import { describe, expect, it } from 'vitest'
import { STANDARD_TUNING } from '../music/notes'
import { Attacks, checkAnswer, checkTap, dayStreak, pathWeights, warmupWeights, isUnlocked, LEVELS, nextQuestion, NoteEvents, questionText, samePitch, spots, StableNote, starsFor, type QuizSettings } from './quiz'

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
    expect(checkAnswer(q, 49).correct).toBe(false)
    expect(checkAnswer(q, 72).correct).toBe(false)
  })
  it('accepts any octave in find-note mode', () => {
    expect(checkAnswer({ ...q, mode: 'find-note' }, 60).correct).toBe(true)
    expect(checkAnswer({ ...q, mode: 'find-note' }, 61).correct).toBe(false)
  })
  it('accepts low E heard an octave too high on string 6 (the mic misses the fundamental)', () => {
    const lowE = nextQuestion({ ...base, mode: 'find-on-string', strings: [6], minFret: 0, maxFret: 0 }, () => 0)!
    expect(lowE.midi).toBe(40)
    expect(checkAnswer(lowE, 52).correct).toBe(true)
    expect(checkAnswer(lowE, 64).correct).toBe(false)
    expect(checkAnswer(lowE, 41).correct).toBe(false)
  })
  it('wants the exact octave from the middle strings up', () => {
    expect(samePitch(55, 67)).toBe(false)
    expect(samePitch(45, 57)).toBe(true)
    expect(samePitch(57, 45)).toBe(false)
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
  it('forgives tuning: anything that rounds to the note counts', () => {
    const s = new StableNote(2)
    expect(s.push(44.6)).toBeNull()
    expect(s.push(45.45)).toBe(45)
  })
})

describe('find-all', () => {
  it('asks for every octave of the note in range', () => {
    const q = nextQuestion({ ...base, mode: 'find-all', naturalsOnly: true }, () => 0)!
    expect(q.midi % 12).toBe(4)
    expect(q.targets).toEqual([40, 52, 64, 76])
    expect(questionText(q)).toBe('Find every E')
    expect(checkAnswer(q, 52).correct).toBe(true)
    expect(checkAnswer(q, 53).correct).toBe(false)
  })
})

describe('melody', () => {
  it('makes a phrase of small steps with no repeated notes', () => {
    let seed = 1
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let n = 0; n < 50; n++) {
      const q = nextQuestion({ ...base, mode: 'melody', maxFret: 5, naturalsOnly: true, phraseLength: 4 }, rnd)!
      expect(q.targets).toHaveLength(4)
      for (let i = 1; i < 4; i++) {
        expect(q.targets[i]).not.toBe(q.targets[i - 1])
        expect(Math.abs(q.targets[i] - q.targets[i - 1])).toBeLessThanOrEqual(6)
      }
      expect(q.midi).toBe(q.targets[0])
    }
  })
})

describe('NoteEvents', () => {
  it('counts a held note once and a re-picked note again after silence', () => {
    const ev = new NoteEvents(2)
    const out = [60, 60, 60, 60, null, null, null, 60, 60, 62, 62].map((m) => ev.push(m))
    expect(out.filter((x) => x !== null)).toEqual([60, 60, 62])
  })
})

describe('Attacks', () => {
  it('spots a pluck, not a string fading out or the open string under a lifted finger', () => {
    const a = new Attacks(4, 1.4, 0.003)
    // silence, then a pluck
    ;[0.001, 0.001, 0.001, 0.05].forEach((l) => a.push(l))
    expect(a.recently(0)).toBe(true)
    // ringing on and fading: no new pluck
    for (let i = 0; i < 30; i++) a.push(0.05 * Math.pow(0.97, i))
    expect(a.recently(20)).toBe(false)
    // a quieter re-pluck of the ringing string still counts
    a.push(0.04)
    expect(a.recently(0)).toBe(true)
  })
  it('ignores noise below the floor', () => {
    const a = new Attacks(4, 1.4, 0.003)
    ;[0, 0, 0.002].forEach((l) => a.push(l))
    expect(a.recently(5)).toBe(false)
  })
})

describe('path', () => {
  it('gives stars and unlocks levels in order within a group', () => {
    expect(starsFor(6, 10)).toBe(0)
    expect(starsFor(7, 10)).toBe(1)
    expect(starsFor(9, 10)).toBe(2)
    expect(starsFor(10, 10)).toBe(3)
    expect(isUnlocked(0, {})).toBe(true)
    expect(isUnlocked(1, {})).toBe(false)
    expect(isUnlocked(1, { [LEVELS[0].id]: 1 })).toBe(true)
    const firstEar = LEVELS.findIndex((l) => l.group === 'Ear')
    expect(isUnlocked(firstEar, {})).toBe(true)
  })
  it('every level has notes to ask', () => {
    for (const l of LEVELS) expect(spots({ ...l.settings, tuning: STANDARD_TUNING }).length).toBeGreaterThan(3)
  })
  it('counts a day streak', () => {
    expect(dayStreak(['2026-10-30', '2026-10-31', '2026-11-01'], '2026-11-01')).toBe(3)
    expect(dayStreak(['2026-10-30', '2026-10-31'], '2026-11-01')).toBe(2)
    expect(dayStreak(['2026-10-29'], '2026-11-01')).toBe(0)
  })
})

describe('tap modes', () => {
  it('names a single spot and checks a tapped note name', () => {
    const q = nextQuestion({ ...base, mode: 'name-dot', strings: [5], minFret: 3, maxFret: 3 }, () => 0)!
    expect(q.positions).toEqual([{ string: 5, fret: 3 }])
    expect(questionText(q)).toBe('Which note is this?')
    expect(checkTap(q, 0)).toBe(true) // C
    expect(checkTap(q, 2)).toBe(false)
  })
  it('checks a tapped spot', () => {
    const q = nextQuestion({ ...base, mode: 'tap-spot', strings: [3], minFret: 2, maxFret: 2 }, () => 0)!
    expect(questionText(q)).toBe('Tap A on string 3')
    expect(checkTap(q, { string: 3, fret: 2 })).toBe(true)
    expect(checkTap(q, { string: 4, fret: 7 })).toBe(false) // same pitch, wrong string
  })
})

describe('spot weights', () => {
  it('only asks the spots in the map, weighted', () => {
    const s: QuizSettings = { ...base, mode: 'find-on-string', spotWeights: { '2:1': 1, '6:3': 9 } }
    let seed = 7
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const counts: Record<string, number> = {}
    for (let i = 0; i < 300; i++) {
      const q = nextQuestion(s, random)!
      const k = `${q.positions[0].string}:${q.positions[0].fret}`
      counts[k] = (counts[k] ?? 0) + 1
    }
    expect(Object.keys(counts).sort()).toEqual(['2:1', '6:3'])
    expect(counts['6:3']).toBeGreaterThan(counts['2:1'] * 4)
  })

  it('warm-up favours missed and slow spots, then new ones, over known ones', () => {
    const known = { n: 10, ok: 10, ms: 10 * 1500 }
    const neck: Record<string, { n: number; ok: number; ms: number }> = {}
    for (let st = 1; st <= 6; st++) for (let f = 0; f <= 12; f++) neck[`${st}:${f}`] = known
    neck['3:4'] = { n: 6, ok: 2, ms: 2 * 2000 } // often missed
    neck['5:9'] = { n: 6, ok: 6, ms: 6 * 6000 } // right but slow
    delete neck['1:11'] // never asked
    const w = warmupWeights(neck, 6, 12, 3, () => 0)
    expect(Object.keys(w)).toEqual(['3:4', '1:11', '5:9'])
  })

  it('warm-up with an empty neck map spreads over the whole neck', () => {
    const w = warmupWeights({}, 6, 12, 24)
    expect(Object.keys(w)).toHaveLength(24)
  })

  it('levels weight missed spots up', () => {
    const s: QuizSettings = { ...base, mode: 'find-on-string', strings: [1], minFret: 0, maxFret: 1 }
    expect(pathWeights(s, { '1:1': { n: 4, ok: 0, ms: 0 } })).toEqual({ '1:0': 1, '1:1': 4 })
  })
})
