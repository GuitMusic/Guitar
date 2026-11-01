import { describe, expect, it } from 'vitest'
import type { FretNote } from '../music/types'
import { RIGHT_HAND_BIND } from './bindPose'
import { norm, sub } from './math'
import { forward, makeRig } from './rig'
import { pressX, solveHandBest as solveHand, type HandTask, type Neck } from './solve'
import { buildHandTask } from './targets'

const rig = makeRig(RIGHT_HAND_BIND, norm([0, 0.3, 1]), norm([0, -1, 0.3]))
// A real neck: 650 mm scale, 9 mm between strings
const neck: Neck = { fretX: (n) => 650 * (1 - 2 ** (-n / 12)), stringY: (s) => (s - 1) * 9, strings: 6, edgeLow: -4, edgeHigh: 49, depth: 22 }

const press = (string: number, fret: number) => ({ kind: 'press' as const, string, fret })
const free = (fret: number) => ({ kind: 'free' as const, fret })

const chords: Record<string, HandTask> = {
  C: { fingers: [press(2, 1), press(4, 2), press(5, 3), free(4)], thumb: { kind: 'behind', fret: 1 } },
  G: { fingers: [press(5, 2), press(6, 3), press(1, 3), free(4)], thumb: { kind: 'behind', fret: 2 } },
  Am: { fingers: [press(2, 1), press(4, 2), press(3, 2), free(3)], thumb: { kind: 'behind', fret: 1 } },
  F: { fingers: [{ kind: 'barre', from: 1, to: 6, fret: 1 }, press(3, 2), press(5, 3), press(4, 3)], thumb: { kind: 'behind', fret: 1 } },
  'high A shape': { fingers: [press(5, 7), press(4, 9), press(3, 9), press(2, 9)], thumb: { kind: 'behind', fret: 7 } },
}

describe('hand solver', () => {
  for (const [name, task] of Object.entries(chords)) {
    it(`${name}: every pressing fingertip lands on its string, arched, outside the neck`, () => {
      const { params, error } = solveHand(rig, neck, task)
      expect(error).toBeLessThan(4.5)
      const pose = forward(rig, params, 1000, false)
      task.fingers.forEach((t, i) => {
        const [mcp, pip, dip, tip] = pose.finger[i]
        if (t.kind === 'press') {
          // The last finger bone points into the fingerboard, so it doesn't touch the next string
          expect(norm(sub(tip, dip))[2]).toBeLessThan(-0.6)
          // The arch stays above the strings
          expect(pip[2]).toBeGreaterThan(5)
          expect(dip[2]).toBeGreaterThan(5)
          // Behind the fret wire, in the back part of the fret space
          expect(tip[0]).toBeLessThan(neck.fretX(t.fret) - 1)
          expect(tip[0]).toBeGreaterThan(neck.fretX(t.fret - 1) + (neck.fretX(t.fret) - neck.fretX(t.fret - 1)) * 0.25)
        }
        if (t.kind === 'barre') {
          // A barre finger lies flat along the fret
          expect(Math.abs(dip[0] - pressX(neck, t.fret))).toBeLessThan(6)
          expect(dip[2]).toBeLessThan(14)
          expect(tip[1]).toBeGreaterThan(neck.stringY(t.to))
        }
        // Knuckles stay below the treble edge of the neck, never inside it
        expect(mcp[1] < neck.edgeLow || mcp[2] > 0).toBe(true)
      })
      // Thumb behind the neck
      expect(pose.thumb[3][2]).toBeLessThan(0)
    })
  }

  it('the thumb can wrap over the neck to fret the low E', () => {
    const task: HandTask = { fingers: [press(3, 2), press(2, 3), press(1, 2), free(4)], thumb: { kind: 'over', string: 6, fret: 2 } }
    const { params } = solveHand(rig, neck, task)
    const tip = forward(rig, params, 1000, false).thumb[3]
    expect(tip[1]).toBeGreaterThan(neck.stringY(6) - 6)
    expect(tip[2]).toBeGreaterThan(-4)
  })
})

function n(string: number, fret: number, lh: FretNote['lh'], extra: Partial<FretNote> = {}): FretNote {
  return { key: `${string}:${fret}`, string, tabFret: fret, fret, midi: 60, lh, rh: null, lhInferred: false, rhInferred: false, ...extra }
}

describe('buildHandTask', () => {
  it('turns one finger on several strings at one fret into a barre', () => {
    const t = buildHandTask([n(6, 1, 1), n(2, 1, 1), n(1, 1, 1), n(5, 3, 3)], [], 1, 6)!
    expect(t.fingers[0]).toEqual({ kind: 'barre', from: 1, to: 6, fret: 1 })
    expect(t.fingers[2]).toEqual({ kind: 'press', string: 5, fret: 3 })
  })

  it('lets fingers hover over notes coming later in the bar; idle fingers curl in next to the busy ones', () => {
    const t = buildHandTask([n(2, 1, 1)], [n(4, 2, 2)], 1, 6)!
    expect(t.fingers[1]).toEqual({ kind: 'hover', string: 4, fret: 2 })
    expect(t.fingers[2]).toMatchObject({ kind: 'free', fret: 3 })
    // No further than one fret past the last finger with a job, not stretched out to fret 4
    expect(t.fingers[3]).toMatchObject({ kind: 'free', fret: 3 })
  })

  it('a free finger next to one on the same fret rests beside it, not across it', () => {
    // A minor shape with the middle finger not playing: it sits on the string above the ring finger
    const t = buildHandTask([n(3, 2, 3), n(2, 1, 1)], [], 1, 6)!
    expect(t.fingers[1]).toEqual({ kind: 'free', fret: 2, string: 4 })
  })

  it('uses the thumb over the neck for a bass note fingered T', () => {
    const t = buildHandTask([n(6, 2, 0), n(3, 2, 1)], [], 2, 6)!
    expect(t.thumb).toEqual({ kind: 'over', string: 6, fret: 2 })
  })

  it('returns null for open strings only and no hand position', () => {
    expect(buildHandTask([n(1, 0, null)], [], null, 6)).toBeNull()
  })
})
