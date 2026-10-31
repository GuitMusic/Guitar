import { describe, expect, it } from 'vitest'
import * as alphaTab from '@coderline/alphatab'
import { asciiTabToTex } from './asciiTab'

function parseTex(tex: string) {
  const importer = new alphaTab.importer.AlphaTexImporter()
  importer.initFromString(tex, new alphaTab.Settings())
  return importer.readScore()
}

function allNotes(tex: string) {
  const score = parseTex(tex)
  const staff = score.tracks[0].staves[0]
  return { score, staff, beats: staff.bars.flatMap((b) => b.voices[0].beats) }
}

const SIMPLE = `
Capo 2
e|-------0-------|-------0-------|
B|-----1---1-----|-----3---3-----|
G|---0-------0---|---0-------0---|
D|---------------|---------------|
A|-3-------------|---------------|
E|---------------|-3-------------|
`

describe('asciiTabToTex', () => {
  it('reads notes, bars, standard tuning and capo', () => {
    const result = asciiTabToTex(SIMPLE, { title: 'Arpeggio' })
    expect(result.bars).toBe(2)
    expect(result.notes).toBe(12)
    expect(result.capo).toBe(2)
    expect(result.tuning).toEqual([64, 59, 55, 50, 45, 40])

    const { score, staff, beats } = allNotes(result.tex)
    expect(score.title).toBe('Arpeggio')
    expect(staff.capo).toBe(2)
    expect(score.masterBars).toHaveLength(2)
    // First note: A string (string 5 in tab numbering) fret 3 -> alphaTab string 2 (counted from the lowest)
    const first = beats[0].notes[0]
    expect(first.fret).toBe(3)
    expect(first.string).toBe(2)
    expect(beats.filter((b) => !b.isRest)).toHaveLength(12)
  })

  it('gives every bar a time signature that matches its contents', () => {
    const { score } = allNotes(asciiTabToTex(SIMPLE).tex)
    for (const mb of score.masterBars) {
      const beats = score.tracks[0].staves[0].bars[mb.index].voices[0].beats
      const filled = beats.reduce((sum, b) => sum + b.playbackDuration, 0)
      expect(filled).toBe(mb.calculateDuration())
    }
  })

  it('treats an empty slot at the end of a bar as part of a 4/4 bar', () => {
    const { score } = allNotes(asciiTabToTex(SIMPLE).tex)
    expect(score.masterBars[0].timeSignatureNumerator).toBe(4)
    expect(score.masterBars[0].timeSignatureDenominator).toBe(4)
  })

  it('reads chords and two-digit frets', () => {
    const tab = `
e|--12----0--|
B|--10----0--|
G|--11----1--|
D|--------2--|
A|-----------|
E|-----------|`
    const { beats } = allNotes(asciiTabToTex(tab).tex)
    expect(beats[0].notes.map((n) => n.fret).sort((a, b) => a - b)).toEqual([10, 11, 12])
    expect(beats[1].notes).toHaveLength(4)
  })

  it('infers alternate tunings from string labels', () => {
    const tab = `
D|---0---|
A|---0---|
G|---0---|
D|---0---|
A|---0---|
D|-0-----|`
    const result = asciiTabToTex(tab)
    expect(result.tuning).toEqual([62, 57, 55, 50, 45, 38])
    const { staff } = allNotes(result.tex)
    expect(staff.tuning).toEqual([62, 57, 55, 50, 45, 38])
  })

  it('joins several systems and ignores surrounding text', () => {
    const tab = `Intro (let ring)
e|---0---|
B|---0---|
G|---0---|
D|---2---|
A|---2---|
E|-0-----|

Verse
e|-3-----|
B|---0---|
G|---0---|
D|---0---|
A|---2---|
E|---3---|`
    const result = asciiTabToTex(tab)
    expect(result.bars).toBe(2)
  })

  it('throws a helpful error when there is no tab', () => {
    expect(() => asciiTabToTex('just some lyrics\nand chords: Am G')).toThrow(/No tab lines/)
  })
})
