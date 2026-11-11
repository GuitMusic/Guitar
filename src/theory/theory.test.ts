import { describe, expect, it } from 'vitest'
import { STANDARD_TUNING } from '../music/notes'
import { chordOn, degreeOf, keyChords, keyName, PROGRESSIONS, progressionChords, scaleBoxes, scaleNames, stepPattern, triadVoicings } from './theory'

describe('scales', () => {
  it('spells keys with each letter once', () => {
    expect(scaleNames({ tonic: 0, mode: 'major' })).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    expect(scaleNames({ tonic: 5, mode: 'major' })).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E'])
    expect(scaleNames({ tonic: 2, mode: 'major' })).toEqual(['D', 'E', 'F#', 'G', 'A', 'B', 'C#'])
    expect(scaleNames({ tonic: 1, mode: 'major' })).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
    expect(scaleNames({ tonic: 9, mode: 'minor' })).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    expect(scaleNames({ tonic: 4, mode: 'minor' })).toEqual(['E', 'F#', 'G', 'A', 'B', 'C', 'D'])
    expect(keyName({ tonic: 3, mode: 'major' })).toBe('Eb major')
  })
  it('has the major formula', () => {
    expect(stepPattern('major').join('')).toBe('WWHWWWH')
    expect(stepPattern('minor').join('')).toBe('WHWWHWW')
  })
  it('finds degrees', () => {
    expect(degreeOf({ tonic: 7, mode: 'major' }, 4)).toBe(6) // E is the 6th of G
    expect(degreeOf({ tonic: 7, mode: 'major' }, 5)).toBeNull() // F is not in G major
  })
})

describe('chords', () => {
  it('builds the chords of a key', () => {
    expect(keyChords({ tonic: 0, mode: 'major' }).map((c) => `${c.roman}:${c.name}`)).toEqual(['I:C', 'ii:Dm', 'iii:Em', 'IV:F', 'V:G', 'vi:Am', 'vii°:Bdim'])
    expect(keyChords({ tonic: 9, mode: 'minor' }).map((c) => c.name)).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'])
  })
  it('spells triads', () => {
    expect(chordOn({ tonic: 2, mode: 'major' }, 3).toneNames).toEqual(['F#', 'A', 'C#'])
    expect(chordOn({ tonic: 5, mode: 'major' }, 4).toneNames).toEqual(['Bb', 'D', 'F'])
  })
  it('makes the Andalusian V major', () => {
    const p = PROGRESSIONS.find((x) => x.id === 'andalusian')!
    expect(progressionChords({ tonic: 9, mode: 'minor' }, p).map((c) => c.name)).toEqual(['Am', 'G', 'F', 'E'])
    expect(progressionChords({ tonic: 9, mode: 'minor' }, p)[3].toneNames).toEqual(['E', 'G#', 'B'])
  })
})

describe('triad shapes', () => {
  it('finds C major on strings 3-2-1 in every inversion', () => {
    const at = (inv: 0 | 1 | 2) => triadVoicings(STANDARD_TUNING, 0, 'maj', 3, inv).map((v) => v.notes.map((n) => n.fret).join('-'))
    expect(at(0)).toEqual(['5-5-3']) // C E G
    expect(at(1)).toEqual(['9-8-8']) // E G C
    expect(at(2)).toEqual(['0-1-0', '12-13-12']) // G C E
  })
  it('keeps shapes within four frets', () => {
    for (const low of [6, 5, 4, 3])
      for (const inv of [0, 1, 2] as const)
        for (const v of triadVoicings(STANDARD_TUNING, 4, 'min', low, inv)) {
          const f = v.notes.map((n) => n.fret).filter((x) => x > 0)
          if (f.length) expect(Math.max(...f) - Math.min(...f)).toBeLessThanOrEqual(3)
        }
  })
  it('places scale boxes at the root', () => {
    expect(scaleBoxes(STANDARD_TUNING, { tonic: 7, mode: 'major' })[0]).toEqual({ label: 'Root on string 6, fret 3', from: 2, to: 6 })
  })
})
