import { pitchClassName } from '../music/notes'

export type QuizMode = 'find-note' | 'find-on-string' | 'ear' | 'find-all' | 'melody'

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
  /** Notes per phrase in melody mode. Default 3. */
  phraseLength?: number
}

export interface Question {
  mode: QuizMode
  /** The note the player must play. */
  midi: number
  /** For find-on-string: which string. */
  string: number | null
  /** Where it can be played within the settings' range. */
  positions: { string: number; fret: number }[]
  /** find-all: every pitch of the note in range, low to high. melody: the phrase in order. */
  targets: number[]
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
  if (s.mode === 'melody') return melodyQuestion(s, all, random, previous)
  const key = (midi: number) => (s.mode === 'find-note' || s.mode === 'find-all' ? midi % 12 : midi)
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
    s.mode === 'find-note' || s.mode === 'find-all'
      ? all.filter((sp) => sp.midi % 12 === pick.midi % 12)
      : s.mode === 'find-on-string'
        ? [{ string: pick.string, fret: pick.fret }]
        : all.filter((sp) => sp.midi === pick.midi)
  return {
    mode: s.mode,
    midi: pick.midi,
    string: s.mode === 'find-on-string' ? pick.string : null,
    positions: positions.map(({ string, fret }) => ({ string, fret })),
    targets:
      s.mode === 'find-all' ? [...new Set(all.filter((sp) => sp.midi % 12 === pick.midi % 12).map((p) => p.midi))].sort((a, b) => a - b) : [pick.midi],
  }
}

/**
 * A short phrase to echo by ear: it moves by small steps through the notes in range,
 * never repeats a note twice in a row, and starts somewhere new each time.
 */
function melodyQuestion(
  s: QuizSettings,
  all: { string: number; fret: number; midi: number }[],
  random: () => number,
  previous: Question | null,
): Question {
  const pitches = [...new Set(all.map((sp) => sp.midi))].sort((a, b) => a - b)
  const length = Math.max(2, s.phraseLength ?? 3)
  let i = Math.floor(random() * pitches.length)
  if (previous && pitches[i] === previous.targets[0] && pitches.length > 1) i = (i + 1) % pitches.length
  const phrase = [pitches[i]]
  while (phrase.length < length && pitches.length > 1) {
    // steps of one to three notes up or down, staying inside the range
    const step = 1 + Math.floor(random() * 3)
    let dir = random() < 0.5 ? -1 : 1
    if (i + dir * step < 0 || i + dir * step >= pitches.length) dir = -dir
    const next = Math.min(pitches.length - 1, Math.max(0, i + dir * step))
    if (next === i) continue
    i = next
    phrase.push(pitches[i])
  }
  return {
    mode: 'melody',
    midi: phrase[0],
    string: null,
    positions: all.filter((sp) => phrase.includes(sp.midi)).map(({ string, fret }) => ({ string, fret })),
    targets: phrase,
  }
}

/**
 * Below this (D3 and lower: strings 6 and 5 in open position) a heard pitch one
 * octave too high still counts. Low strings have a weak fundamental and phone mics
 * barely pick it up, so the detector can hear E2 as E3 even after octave correction.
 */
export const OCTAVE_SLACK_BELOW = 51

/** Is `heard` the exact note asked for, allowing the low-string octave slip? */
export function samePitch(target: number, heard: number): boolean {
  return heard === target || (target < OCTAVE_SLACK_BELOW && heard === target + 12)
}

/**
 * Checks a heard pitch. "Find the note" accepts any octave; the string and ear modes
 * want the exact pitch (see samePitch for low notes).
 */
export function checkAnswer(q: Question, heardMidi: number | null): Answer {
  if (heardMidi === null) return { correct: false, heard: null }
  const heard = Math.round(heardMidi)
  const correct =
    q.mode === 'find-note'
      ? heard % 12 === q.midi % 12
      : q.mode === 'find-all'
        ? q.targets.includes(heard)
        : samePitch(q.midi, heard)
  return { correct, heard }
}

/** Plain-language octave hint for find-all, e.g. 40 -> "low", 64 -> "high". */
export function registerName(midi: number): string {
  if (midi < 48) return 'low'
  if (midi < 60) return 'middle'
  if (midi < 72) return 'high'
  return 'very high'
}

export function questionText(q: Question): string {
  const name = pitchClassName(q.midi)
  if (q.mode === 'find-note') return `Play any ${name}`
  if (q.mode === 'find-on-string') return `Play ${name} on string ${q.string}`
  if (q.mode === 'find-all') return `Find every ${name}`
  if (q.mode === 'melody') return `Listen, then play the ${q.targets.length} notes back`
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
    // The goal is the right string and fret, not perfect tuning: anything that rounds
    // to a note counts as that note, even a guitar up to half a semitone out.
    const rounded = Math.round(midi)
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

/**
 * Turns stable notes into separate "the player just played X" events, so the same
 * note held for a long time counts once, while a new note, or the same note picked
 * again after a short silence, counts again.
 */
export class NoteEvents {
  private stable: StableNote
  private last: number | null = null
  private quiet = 0
  constructor(framesNeeded = 6) {
    this.stable = new StableNote(framesNeeded)
  }

  push(midi: number | null): number | null {
    if (midi === null) {
      if (++this.quiet >= 3) this.last = null
    } else this.quiet = 0
    const note = this.stable.push(midi)
    if (note === null || note === this.last) return null
    this.last = note
    return note
  }

  reset(): void {
    this.stable.reset()
    this.last = null
    this.quiet = 0
  }
}

/**
 * Spots fresh plucks from the loudness of each mic frame: a frame clearly louder
 * than the quietest of the frames just before it. A string still ringing from the
 * last question, or the open string you hear when you lift a finger, has no pluck,
 * so a wrong note without one is not held against you.
 */
export class Attacks {
  private recent: number[] = []
  private sinceAttack = Infinity
  private readonly lookback: number
  private readonly rise: number
  private readonly floor: number
  /**
   * lookback: frames to look back for the quiet before the pluck.
   * rise: how much louder than that a pluck is (1.4 = about 3 dB).
   * floor: quieter than this is not a pluck (about -50 dBFS).
   */
  constructor(lookback = 8, rise = 1.4, floor = 0.003) {
    this.lookback = lookback
    this.rise = rise
    this.floor = floor
  }

  push(level: number): void {
    const before = this.recent.length ? Math.min(...this.recent) : Infinity
    if (level > this.floor && level > before * this.rise) this.sinceAttack = 0
    else this.sinceAttack++
    this.recent.push(level)
    if (this.recent.length > this.lookback) this.recent.shift()
  }

  /** Was there a pluck in the last `frames` frames? */
  recently(frames: number): boolean {
    return this.sinceAttack <= frames
  }

  reset(): void {
    this.recent = []
    this.sinceAttack = Infinity
  }
}

/** A step on the learn-the-neck path. */
export interface Level {
  id: string
  title: string
  blurb: string
  group: 'Open position' | 'Up the neck' | 'Ear'
  settings: Omit<QuizSettings, 'tuning'>
}

const ALL = [1, 2, 3, 4, 5, 6]

/** Notes per round on the path. */
export const ROUND = 10

export const LEVELS: Level[] = [
  { id: 'open-bass', group: 'Open position', title: 'Bass strings', blurb: 'Natural notes on strings 6 and 5, frets 0 to 5. The notes your thumb plays.', settings: { mode: 'find-on-string', strings: [6, 5], minFret: 0, maxFret: 5, naturalsOnly: true, seconds: 8 } },
  { id: 'open-middle', group: 'Open position', title: 'Middle strings', blurb: 'Strings 4 and 3, frets 0 to 5.', settings: { mode: 'find-on-string', strings: [4, 3], minFret: 0, maxFret: 5, naturalsOnly: true, seconds: 8 } },
  { id: 'open-treble', group: 'Open position', title: 'Treble strings', blurb: 'Strings 2 and 1, frets 0 to 5. Where most melodies live.', settings: { mode: 'find-on-string', strings: [2, 1], minFret: 0, maxFret: 5, naturalsOnly: true, seconds: 8 } },
  { id: 'open-any', group: 'Open position', title: 'Any string', blurb: 'A note name only. Play it on whichever string you like, frets 0 to 5.', settings: { mode: 'find-note', strings: ALL, minFret: 0, maxFret: 5, naturalsOnly: true, seconds: 6 } },
  { id: 'open-sharps', group: 'Open position', title: 'Sharps and flats', blurb: 'All twelve notes on every string, frets 0 to 5.', settings: { mode: 'find-on-string', strings: ALL, minFret: 0, maxFret: 5, naturalsOnly: false, seconds: 7 } },
  { id: 'mid-bass', group: 'Up the neck', title: 'Bass, frets 5 to 9', blurb: 'Strings 6 and 5 in the middle of the neck, where barre-chord roots sit.', settings: { mode: 'find-on-string', strings: [6, 5], minFret: 5, maxFret: 9, naturalsOnly: true, seconds: 8 } },
  { id: 'mid-treble', group: 'Up the neck', title: 'Treble, frets 5 to 10', blurb: 'Strings 3, 2 and 1 in fifth and seventh position.', settings: { mode: 'find-on-string', strings: [3, 2, 1], minFret: 5, maxFret: 10, naturalsOnly: true, seconds: 8 } },
  { id: 'octaves', group: 'Up the neck', title: 'Every octave', blurb: 'Find the same note in every octave between frets 0 and 12. Learn the octave shapes.', settings: { mode: 'find-all', strings: ALL, minFret: 0, maxFret: 12, naturalsOnly: true, seconds: 20 } },
  { id: 'whole-neck', group: 'Up the neck', title: 'Whole neck', blurb: 'Any note, any string, frets 0 to 12, against the clock.', settings: { mode: 'find-on-string', strings: ALL, minFret: 0, maxFret: 12, naturalsOnly: false, seconds: 6 } },
  { id: 'ear-open', group: 'Ear', title: 'Single notes by ear', blurb: 'The app plays a note from open position. Find it.', settings: { mode: 'ear', strings: ALL, minFret: 0, maxFret: 5, naturalsOnly: true, seconds: 10 } },
  { id: 'ear-melody', group: 'Ear', title: 'Echo a melody', blurb: 'Three-note phrases from open position. Play them back in order.', settings: { mode: 'melody', strings: ALL, minFret: 0, maxFret: 5, naturalsOnly: true, seconds: 15, phraseLength: 3 } },
  { id: 'ear-melody-4', group: 'Ear', title: 'Longer melodies', blurb: 'Four-note phrases up to fret 7, sharps included.', settings: { mode: 'melody', strings: ALL, minFret: 0, maxFret: 7, naturalsOnly: false, seconds: 18, phraseLength: 4 } },
]

/** 0 to 3 stars for a round: 7 of 10 passes, 9 is two stars, all of them three. */
export function starsFor(correct: number, total: number): number {
  if (total === 0) return 0
  const r = correct / total
  return r >= 1 ? 3 : r >= 0.9 ? 2 : r >= 0.7 ? 1 : 0
}

/** The first level of each group is open; the rest open once the one before has a star. */
export function isUnlocked(index: number, stars: Record<string, number>): boolean {
  const prev = LEVELS[index - 1]
  return !prev || prev.group !== LEVELS[index].group || (stars[prev.id] ?? 0) > 0
}

/** Consecutive days ending today (or yesterday, if today has no practice yet). */
export function dayStreak(days: string[], today: string): number {
  const set = new Set(days)
  let d = Date.parse(today)
  if (!set.has(today)) d -= 864e5
  let n = 0
  while (set.has(new Date(d).toISOString().slice(0, 10))) {
    n++
    d -= 864e5
  }
  return n
}
