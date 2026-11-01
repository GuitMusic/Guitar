import { describe, expect, it } from 'vitest'
import { applyFingering } from './fingering'
import type { FretNote } from './types'

function note(string: number, tabFret: number, extra: Partial<FretNote> = {}, capo = 0): FretNote {
  return {
    key: `k${string}`,
    string,
    tabFret,
    fret: tabFret + capo,
    midi: 60,
    lh: null,
    rh: null,
    lhInferred: false,
    rhInferred: false,
    ...extra,
  }
}

describe('applyFingering', () => {
  it('assigns p to bass strings and i, m, a to strings 3, 2, 1', () => {
    const { notes } = applyFingering([note(5, 3), note(3, 0), note(2, 1), note(1, 0)], 6, null)
    expect(notes.map((n) => n.rh)).toEqual(['p', 'i', 'm', 'a'])
    expect(notes.every((n) => n.rhInferred)).toBe(true)
  })

  it('uses one finger per fret from the lowest fretted note', () => {
    // C chord: A3 D2 B1
    const { notes, position } = applyFingering([note(5, 3), note(4, 2), note(3, 0), note(2, 1)], 6, null)
    expect(position).toBe(1)
    expect(notes.map((n) => n.lh)).toEqual([3, 2, null, 1])
  })

  it('keeps the hand still while notes fit in the four-fret box', () => {
    const { notes, position } = applyFingering([note(1, 5)], 6, 3)
    expect(position).toBe(3)
    expect(notes[0].lh).toBe(3)
  })

  it('moves the hand when a note falls outside the box', () => {
    const { notes, position } = applyFingering([note(1, 9)], 6, 3)
    expect(position).toBe(9)
    expect(notes[0].lh).toBe(1)
  })

  it('keeps fingers from the file and uses them to place the hand', () => {
    const { notes, position } = applyFingering([note(2, 3, { lh: 4 }), note(1, 2)], 6, null)
    expect(position).toBe(1)
    expect(notes[0]).toMatchObject({ lh: 4, lhInferred: false })
    expect(notes[1].lh).toBe(2)
  })

  it('counts frets from the capo for open strings', () => {
    const { notes } = applyFingering([note(3, 0, {}, 3), note(2, 1, {}, 3)], 6, null)
    expect(notes[0].lh).toBeNull()
    expect(notes[1].lh).toBe(1)
  })

  it('lets user overrides win over file and guesses', () => {
    const { notes } = applyFingering([note(1, 3, { lh: 3, rh: 'a' })], 6, null, { k1: { lh: 4, rh: 'm' } })
    expect(notes[0]).toMatchObject({ lh: 4, rh: 'm', lhInferred: false, rhInferred: false })
  })

  describe('chord shapes', () => {
    const chord = (...pairs: [number, number][]) =>
      applyFingering(pairs.map(([s, f]) => note(s, f)), 6, null).notes.map((n) => n.lh)

    it('open G: one of the two standard fingerings', () => {
      expect([[2, 1, 3], [3, 2, 4]]).toContainEqual(chord([6, 3], [5, 2], [1, 3]))
    })

    it('A minor: index B1, middle D2, ring G2', () => {
      expect(chord([4, 2], [3, 2], [2, 1])).toEqual([2, 3, 1])
    })

    it('E major: middle A2, ring D2, index G1', () => {
      expect(chord([5, 2], [4, 2], [3, 1])).toEqual([2, 3, 1])
    })

    it('D major: index G2, ring B3, middle e2', () => {
      expect(chord([3, 2], [2, 3], [1, 2])).toEqual([1, 3, 2])
    })

    it('A major: index, middle, ring side by side on fret 2', () => {
      expect(chord([4, 2], [3, 2], [2, 2])).toEqual([1, 2, 3])
    })

    it('F barre: index across fret 1, middle G2, ring A3, little D3', () => {
      expect(chord([6, 1], [5, 3], [4, 3], [3, 2], [2, 1], [1, 1])).toEqual([1, 3, 4, 2, 1, 1])
    })

    it('B minor barre at fret 2', () => {
      // x24432
      expect(chord([5, 2], [4, 4], [3, 4], [2, 3], [1, 2])).toEqual([1, 3, 4, 2, 1])
    })

    it('never puts one finger on two frets or crosses fingers', () => {
      const fingers = chord([6, 3], [5, 2], [1, 3])
      expect(new Set(fingers).size).toBe(3)
    })
  })
})
