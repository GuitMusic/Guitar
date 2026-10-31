import { describe, expect, it } from 'vitest'
import { STANDARD_TUNING } from '../music/notes'
import { checkAnswer, nextQuestion, questionText, spots, StableNote, type QuizSettings } from './quiz'

const base: QuizSettings = {
  mode: 'find-note',
  tuning: STANDARD_TUNING,
  strings: [1, 2, 3, 4, 5, 6],
  minFret: 0,
  maxFret: 12,
  naturalsOnly: false,
  seconds: 5,
}

describe('spots', () => {
  it('lists every string and fret in range', () => {
    expect(spots(base)).toHaveLength(6 * 13)
  })
  it('can leave out sharps and flats', () => {
    const s = spots({ ...base, strings: [6], naturalsOnly: true })
    expect(s.map((x) => x.fret)).toEqual([0, 1, 3, 5, 7, 8, 10, 12])
  })
})

describe('nextQuestion', () => {
  it('shows every place the note can be found in find-note mode', () => {
    const q = nextQuestion({ ...base, strings: [6, 5] }, () => 0)!
    expect(q.midi).toBe(40) // low E, open
    expect(q.positions).toEqual([
      { string: 6, fret: 0 },
      { string: 6, fret: 12 },
      { string: 5, fret: 7 },
    ])
  })

  it('names the string in find-on-string mode', () => {
    const q = nextQuestion({ ...base, mode: 'find-on-string', strings: [5], minFret: 3, maxFret: 3 }, () => 0)!
    expect(q.string).toBe(5)
    expect(questionText(q)).toBe('Play C on string 5')
  })

  it('does not repeat the previous note when there is a choice', () => {
    const s = { ...base, strings: [1], minFret: 0, maxFret: 1 }
    const first = nextQuestion(s, () => 0)!
    const second = nextQuestion(s, () => 0, {}, first)!
    expect(second.midi).not.toBe(first.midi)
  })

  it('asks missed notes more often', () => {
    const s = { ...base, mode: 'find-on-string' as const, strings: [1], minFret: 0, maxFret: 1 }
    let seed = 1
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const counts: Record<number, number> = { 64: 0, 65: 0 }
    for (let i = 0; i < 400; i++) counts[nextQuestion(s, random, { 65: 5 })!.midi]++
    expect(counts[65]).toBeGreaterThan(counts[64] * 5)
  })

  it('returns null when nothing is in range', () => {
    expect(nextQuestion({ ...base, strings: [] })).toBeNull()
  })
})

describe('checkAnswer', () => {
  const q = nextQuestion({ ...base, mode: 'find-on-string', strings: [5], minFret: 3, maxFret: 3 }, () => 0)!
  it('wants the exact pitch on a named string', () => {
    expect(checkAnswer(q, 48.1).correct).toBe(true)
    expect(checkAnswer(q, 60).correct).toBe(false)
  })
  it('accepts any octave in find-note mode', () => {
    expect(checkAnswer({ ...q, mode: 'find-note' }, 60).correct).toBe(true)
    expect(checkAnswer({ ...q, mode: 'find-note' }, 61).correct).toBe(false)
  })
  it('counts silence as a miss', () => {
    expect(checkAnswer(q, null)).toEqual({ correct: false, heard: null })
  })
})

describe('StableNote', () => {
  it('only reports a note after it is held steady', () => {
    const s = new StableNote(3)
    expect(s.push(52.9)).toBeNull()
    expect(s.push(45)).toBeNull()
    expect(s.push(45.1)).toBeNull()
    expect(s.push(44.9)).toBe(45)
  })
  it('ignores pitches between notes', () => {
    const s = new StableNote(1)
    expect(s.push(45.5)).toBeNull()
  })
})
