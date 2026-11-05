import { describe, expect, it } from 'vitest'
import { GUIDES, retuneSteps } from './guide'
import { parsePitchClass, pitchClassName } from '../music/notes'
import { STUDIES, SONGS } from '../studies/studies'

describe.each(GUIDES)('$name', (guide) => {
  it.each(guide.chords)('$name sounds exactly its chord tones', (chord) => {
    const open = [...guide.strings].reverse() // string 6 first, like the chart
    const sounding = chord.frets.flatMap((f, i) => (f === null ? [] : [(open[i] + f) % 12]))
    const tones = chord.tones.map((t) => parsePitchClass(t))
    expect(new Set(sounding.map((pc) => pitchClassName(pc)))).toEqual(new Set(tones.map((pc) => pitchClassName(pc!))))
    // A finger on every fretted string and none on open or muted ones
    chord.frets.forEach((f, i) => expect(chord.fingers[i] > 0, `string ${6 - i}`).toBe(!!f))
  })

  it('has studies and songs in the tuning', () => {
    expect(STUDIES.filter((s) => s.tuning === guide.id).length).toBeGreaterThanOrEqual(5)
    expect(SONGS.filter((s) => s.tuning === guide.id).length).toBeGreaterThanOrEqual(8)
  })

  it('scale notes are real pitch names', () => {
    for (const s of guide.scales) for (const n of s.notes) expect(parsePitchClass(n), n).not.toBeNull()
  })
})

it('retune steps go from standard tuning to the target', () => {
  expect(retuneSteps(GUIDES[0].strings).filter((s) => s.semitones !== 0).map((s) => [s.string, s.semitones])).toEqual([
    [6, -2],
    [2, -2],
    [1, -2],
  ])
})

it('every piece in an alternate tuning names that tuning in its score', () => {
  for (const s of [...STUDIES, ...SONGS]) {
    if (s.tuning === 'dadgad') expect(s.tex).toContain('\\tuning (d4 a3 g3 d3 a2 d2)')
    else if (s.tuning === 'open-d') expect(s.tex).toContain('\\tuning (d4 a3 f#3 d3 a2 d2)')
    else expect(s.tex).not.toContain('\\tuning')
  }
})
