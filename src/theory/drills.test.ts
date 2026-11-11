import { describe, expect, it } from 'vitest'
import { chromaticIn, makeDrill, scaleCheck } from './drills'

const seq = (seed = 5) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

describe('theory drills', () => {
  it('writes the 12 notes the way the key does', () => {
    expect(chromaticIn({ tonic: 5, mode: 'major' })).toContain('Bb')
    expect(chromaticIn({ tonic: 2, mode: 'major' })).toContain('F#')
    for (let t = 0; t < 12; t++) for (const mode of ['major', 'minor'] as const) expect(scaleCheck({ tonic: t, mode })).toBe(true)
  })
  it('always offers the right answer', () => {
    const r = seq()
    for (let i = 0; i < 300; i++) {
      const d = makeDrill({ tonic: Math.floor(r() * 12), mode: r() < 0.5 ? 'major' : 'minor' }, r)
      for (const a of d.answer) expect(d.choices).toContain(a)
      expect(d.answer.length).toBe(d.kind === 'spell' ? 3 : 1)
    }
  })
  it('asks the 6th of G major', () => {
    const d = makeDrill({ tonic: 7, mode: 'major' }, () => 0.7, ['degree-note'])
    expect(d.prompt).toBe('What is the 6th note of G major?')
    expect(d.answer).toEqual(['E'])
  })
})
