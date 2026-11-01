import { describe, expect, it } from 'vitest'
import { fingerSong, type FingerEvent } from './songFingering'
import type { FretFinger, FretNote } from './types'

let id = 0
function n(string: number, fret: number, lh: FretFinger | null = null): FretNote {
  return { key: `n${id++}`, string, tabFret: fret, fret, midi: 0, lh, rh: null, lhInferred: lh === null, rhInferred: true }
}
/** One bar of single notes played one after another, like an arpeggio. */
function arpeggio(bar: number, notes: [number, number][]): FingerEvent[] {
  return notes.map(([s, f]) => ({ bar, notes: [n(s, f)] }))
}
const fingersOf = (events: FingerEvent[], fingers: Map<string, FretFinger>) =>
  events.flatMap((e) => e.notes.filter((x) => x.tabFret > 0).map((x) => `${x.string}/${x.fret}:${fingers.get(x.key)}`))

describe('fingerSong', () => {
  it('fingers an arpeggiated C chord with the C chord shape, even notes that sound alone', () => {
    const events = arpeggio(0, [[5, 3], [3, 0], [2, 1], [1, 0], [4, 2], [3, 0], [2, 1], [1, 0]])
    const { fingers, grips } = fingerSong(events)
    expect(new Set(fingersOf(events, fingers))).toEqual(new Set(['5/3:3', '2/1:1', '4/2:2']))
    expect(grips).toHaveLength(1)
  })

  it('uses the usual A minor and E minor fingers: two fingers on one fret', () => {
    const am = arpeggio(0, [[5, 0], [4, 2], [3, 2], [2, 1]])
    expect(fingersOf(am, fingerSong(am).fingers)).toEqual(['4/2:2', '3/2:3', '2/1:1'])
    const em = arpeggio(0, [[6, 0], [5, 2], [4, 2], [3, 0]])
    expect(fingersOf(em, fingerSong(em).fingers)).toEqual(['5/2:2', '4/2:3'])
  })

  it('plays D with index, middle and ring (not one finger per fret)', () => {
    const d = arpeggio(0, [[4, 0], [3, 2], [2, 3], [1, 2]])
    expect(fingersOf(d, fingerSong(d).fingers)).toEqual(['3/2:1', '2/3:3', '1/2:2'])
  })

  it('takes a small index barre for the small F shape, and no barre when separate fingers fit', () => {
    const f = arpeggio(0, [[4, 3], [3, 2], [2, 1], [1, 1]])
    expect(fingersOf(f, fingerSong(f).fingers)).toEqual(['4/3:3', '3/2:2', '2/1:1', '1/1:1'])
    // Two notes on fret 2 a string apart, with the string between them ringing open: never a barre
    const open = [{ bar: 0, notes: [n(5, 2), n(4, 0), n(3, 2)] }]
    const r = fingerSong(open).fingers
    expect(r.get(open[0].notes[0].key)).not.toBe(r.get(open[0].notes[2].key))
  })

  it('moves the hand up the neck when the notes move, instead of stretching', () => {
    const events: FingerEvent[] = [
      { bar: 0, notes: [n(2, 1, 1), n(1, 3, 3)] },
      { bar: 0, notes: [n(2, 3, 1), n(1, 5, 3)] },
      { bar: 0, notes: [n(2, 5, 1), n(1, 7, 3)] },
    ]
    const { grips } = fingerSong(events)
    expect(grips.map((g) => g.position)).toEqual([1, 3, 5])
  })

  it('keeps a finger that stays on a note where it is when the chord changes', () => {
    // C then Am: the index stays on the B string at fret 1, the middle on the D string at fret 2
    const events = [...arpeggio(0, [[5, 3], [4, 2], [2, 1]]), ...arpeggio(1, [[5, 0], [4, 2], [3, 2], [2, 1]])]
    const { fingers } = fingerSong(events)
    expect(fingersOf(events, fingers)).toEqual(['5/3:3', '4/2:2', '2/1:1', '4/2:2', '3/2:3', '2/1:1'])
  })
})

describe('fingerSong: no barre where two fingers fit', () => {
  it('a bass and a melody note on the same fret get two fingers, not an index barre', () => {
    // Melody F#-G-A on the high E with a B bass under the F#, as in Lamma Bada
    const events: FingerEvent[] = [
      { bar: 0, notes: [n(1, 2, 1)] },
      { bar: 0, notes: [n(1, 3, 2)] },
      { bar: 0, notes: [n(1, 5, 4)] },
      { bar: 0, notes: [n(1, 2), n(5, 2)] },
    ]
    const { fingers } = fingerSong(events)
    const [mel, bass] = events[3].notes
    expect(fingers.get(mel.key)).not.toBe(fingers.get(bass.key))
  })
})
