import { pitchClassName } from '../music/notes'

export type QuizMode = 'find-note' | 'find-on-string' | 'ear'

export interface QuizSettings {
  mode: QuizMode
  /** MIDI open-string notes, string 1 (highest) first. */
  tuning: number[]
  /** Strings to use, tab numbering (1 = highest). */
  strings: number[]
  minFret: number
  maxFret: number
  /** Only natural notes (no sharps or flats). */
  naturalsOnly: boolean
  seconds: number
}

export interface Question {
  mode: QuizMode
  /** The note the player must play. */
  midi: number
  /** For find-on-string: which string. */
  string: number | null
  /** Where it can be played within the settings' range. */
  positions: { string: number; fret: number }[]
}

export interface Answer {
  correct: boolean
  /** Rounded MIDI note that was heard. */
  heard: number | null
}

const NATURAL = new Set([0, 2, 4, 5, 7, 9, 11])

/** Every string/fret spot in range. */
export function spots(s: QuizSettings): { string: number; fret: number; midi: number }[] {
  const out: { string: number; fret: number; midi: number }[] = []
  for (const string of s.strings) {
    for (let fret = s.minFret; fret <= s.maxFret; fret++) {
      const midi = s.tuning[string - 1] + fret
      if (s.naturalsOnly && !NATURAL.has(midi % 12)) continue
      out.push({ string, fret, midi })
    }
  }
  return out
}

/**
 * Picks the next question. Notes you missed more often come up more often:
 * weights maps a pitch class (0-11) or MIDI note to a miss count.
 */
export function nextQuestion(
  s: QuizSettings,
  random: () => number = Math.random,
  misses: Record<number, number> = {},
  previous: Question | null = null,
): Question | null {
  const all = spots(s)
  if (all.length === 0) return null
  const key = (midi: number) => (s.mode === 'find-note' ? midi % 12 : midi)
  let candidates = all.filter((sp) => !previous || key(sp.midi) !== key(previous.midi))
  if (candidates.length === 0) candidates = all
  const weights = candidates.map((c) => 1 + 2 * (misses[key(c.midi)] ?? 0))
  let r = random() * weights.reduce((a, b) => a + b, 0)
  let pick = candidates[candidates.length - 1]
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r < 0) {
      pick = candidates[i]
      break
    }
  }
  const positions =
    s.mode === 'find-note'
      ? all.filter((sp) => sp.midi % 12 === pick.midi % 12)
      : s.mode === 'find-on-string'
        ? [{ string: pick.string, fret: pick.fret }]
        : all.filter((sp) => sp.midi === pick.midi)
  return {
    mode: s.mode,
    midi: pick.midi,
    string: s.mode === 'find-on-string' ? pick.string : null,
    positions: positions.map(({ string, fret }) => ({ string, fret })),
  }
}

/**
 * Checks a heard pitch. "Find the note" accepts any octave; the string and ear modes
 * want the exact pitch.
 */
export function checkAnswer(q: Question, heardMidi: number | null): Answer {
  if (heardMidi === null) return { correct: false, heard: null }
  const heard = Math.round(heardMidi)
  const correct = q.mode === 'find-note' ? heard % 12 === q.midi % 12 : heard === q.midi
  return { correct, heard }
}

export function questionText(q: Question): string {
  const name = pitchClassName(q.midi)
  if (q.mode === 'find-note') return `Play any ${name}`
  if (q.mode === 'find-on-string') return `Play ${name} on string ${q.string}`
  return 'Listen, then play the same note'
}

/**
 * Turns a stream of pitch readings into one answer: a note counts once it has been
 * held steady for a few frames, so the pluck's attack noise is ignored.
 */
export class StableNote {
  private candidate: number | null = null
  private count = 0
  private readonly framesNeeded: number
  constructor(framesNeeded = 6) {
    this.framesNeeded = framesNeeded
  }

  push(midi: number | null): number | null {
    if (midi === null) {
      this.count = 0
      this.candidate = null
      return null
    }
    const rounded = Math.round(midi)
    if (Math.abs(midi - rounded) > 0.35) return null
    if (rounded === this.candidate) this.count++
    else {
      this.candidate = rounded
      this.count = 1
    }
    return this.count >= this.framesNeeded ? rounded : null
  }

  reset(): void {
    this.candidate = null
    this.count = 0
  }
}
