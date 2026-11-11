import { describe, expect, it } from 'vitest'
import { STANDARD_TUNING } from '../music/notes'
import { climbTurn, huntTurn, isNatural, multiplier, neckSpots, octaveTurn, rushTurn } from './games'

const seq = (seed = 3) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

describe('games', () => {
  it('lists every spot up to fret 12', () => {
    expect(neckSpots(STANDARD_TUNING)).toHaveLength(6 * 13)
  })

  it('grows the multiplier every 5 in a row, up to 4', () => {
    expect([0, 4, 5, 10, 15, 40].map(multiplier)).toEqual([1, 1, 2, 3, 4, 4])
  })

  it('note rush asks naturals first and never the same name twice in a row', () => {
    const r = seq()
    let prev = null
    for (let i = 0; i < 100; i++) {
      const s = rushTurn(STANDARD_TUNING, 0, prev, r)
      expect(isNatural(s.midi)).toBe(true)
      if (prev) expect(s.midi % 12).not.toBe(prev.midi % 12)
      prev = s
    }
  })

  it('note hunt lists every place of the note', () => {
    const t = huntTurn(STANDARD_TUNING, 0, null, () => 0) // C
    expect(t.pc).toBe(0)
    expect(t.spots.map((s) => `${s.string}:${s.fret}`).sort()).toEqual(['1:8', '2:1', '3:5', '4:10', '5:3', '6:8'])
  })

  it('octave jump targets are an octave away, or the same pitch on another string', () => {
    const r = seq(11)
    for (let i = 0; i < 100; i++) {
      const t = octaveTurn(STANDARD_TUNING, null, r)
      expect(t.targets.length).toBeGreaterThan(0)
      for (const x of t.targets) {
        if (t.kind === 'octave') expect(Math.abs(x.midi - t.from.midi)).toBe(12)
        else {
          expect(x.midi).toBe(t.from.midi)
          expect(x.string).not.toBe(t.from.string)
        }
      }
    }
  })

  it('string climb walks the naturals up one string', () => {
    const t = climbTurn(STANDARD_TUNING, null, () => 0.7) // string 5, A
    expect(t.string).toBe(5)
    expect(t.steps.map((s) => s.fret)).toEqual([0, 2, 3, 5, 7, 8, 10, 12])
  })
})
