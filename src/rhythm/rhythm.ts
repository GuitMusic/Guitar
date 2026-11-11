/**
 * Learning to play with a metronome: lessons, where the beats you should play fall,
 * and how early or late each of your notes or taps was.
 */

export type ClickPlan = 'every' | 'backbeat' | 'gap' | 'one'

export interface Lesson {
  id: string
  title: string
  /** What the lesson teaches and why. */
  why: string
  /** What to do, in one or two sentences. */
  how: string
  /** Counting to say out loud, one entry per step of the bar. */
  count: string[]
  /** Steps per beat: 1 = quarter notes, 2 = eighth notes. */
  sub: 1 | 2
  /** Steps of the 4-beat bar where you play (0-based, in steps). Empty: just listen. */
  play: number[]
  /** When the click sounds: every beat, only 2 and 4, two bars on and two off, or only on 1. */
  clicks: ClickPlan
  bpm: number
  /** Raise the tempo by this much after each clean bar, up to `maxBpm`. */
  speedUp?: { step: number; maxBpm: number }
  /** Good hits needed to finish the lesson. 0 = just listen for a few bars. */
  goal: number
}

const Q = ['1', '2', '3', '4']
const E = ['1', '&', '2', '&', '3', '&', '4', '&']

export const LESSONS: Lesson[] = [
  {
    id: 'pulse',
    title: 'Feel the pulse',
    why: 'A metronome is a steady pulse, like a heartbeat. Before playing with it, just listen: the high click is beat 1, where each bar starts.',
    how: 'Listen and count out loud with each click: "1, 2, 3, 4". Nod your head or tap your foot.',
    count: Q,
    sub: 1,
    play: [],
    clicks: 'every',
    bpm: 70,
    goal: 0,
  },
  {
    id: 'tap',
    title: 'Tap with the click',
    why: 'Your tap should land exactly on the click, so the two sound like one. Too early and you hear your tap first; too late and you hear the click first.',
    how: 'Tap on every click while counting "1, 2, 3, 4". Watch the meter: aim for the middle.',
    count: Q,
    sub: 1,
    play: [0, 1, 2, 3],
    clicks: 'every',
    bpm: 70,
    goal: 16,
  },
  {
    id: 'one',
    title: 'Only on 1',
    why: 'Holding a long note means waiting. Counting the beats you do not play keeps you in time.',
    how: 'Play only on beat 1. Count "2, 3, 4" in your head while you wait.',
    count: Q,
    sub: 1,
    play: [0],
    clicks: 'every',
    bpm: 72,
    goal: 8,
  },
  {
    id: 'bass',
    title: 'Thumb on 1 and 3',
    why: 'In fingerstyle the thumb plays the bass on the strong beats, 1 and 3. This is the backbone of most pieces in the app.',
    how: 'Play a bass note with your thumb on 1 and 3. Rest on 2 and 4, but keep counting them.',
    count: Q,
    sub: 1,
    play: [0, 2],
    clicks: 'every',
    bpm: 72,
    goal: 12,
  },
  {
    id: 'eighths',
    title: 'Two notes per click',
    why: 'Most melodies move faster than the click. Saying "and" between the beats splits each beat into two equal halves.',
    how: 'Play twice per click, counting "1 and 2 and 3 and 4 and". The second note falls exactly halfway.',
    count: E,
    sub: 2,
    play: [0, 1, 2, 3, 4, 5, 6, 7],
    clicks: 'every',
    bpm: 60,
    goal: 24,
  },
  {
    id: 'backbeat',
    title: 'Click on 2 and 4',
    why: 'With fewer clicks you keep more of the time yourself. Musicians often set the click on 2 and 4, like a snare drum.',
    how: 'The click only sounds on 2 and 4. Keep playing on all four beats.',
    count: Q,
    sub: 1,
    play: [0, 1, 2, 3],
    clicks: 'backbeat',
    bpm: 72,
    goal: 16,
  },
  {
    id: 'gap',
    title: 'Keep going in the silence',
    why: 'The real test: does your time hold when the click stops? This is what lets you play steadily without one.',
    how: 'Two bars with the click, then two bars of silence. Keep playing on every beat; it comes back in time if you did.',
    count: Q,
    sub: 1,
    play: [0, 1, 2, 3],
    clicks: 'gap',
    bpm: 72,
    goal: 20,
  },
  {
    id: 'speed',
    title: 'Speed builder',
    why: 'Speed comes from playing cleanly slowly, then a little faster. Here the tempo goes up only after a clean bar.',
    how: 'Play on every click. Each bar with all four notes in time adds 4 BPM, up to 120.',
    count: Q,
    sub: 1,
    play: [0, 1, 2, 3],
    clicks: 'every',
    bpm: 60,
    speedUp: { step: 4, maxBpm: 120 },
    goal: 40,
  },
]

/** Is there a click on this step of this bar? Returns 2 for the accented beat 1, 1 for others, 0 for none. */
export function clickAt(plan: ClickPlan, bar: number, step: number, sub: number): 0 | 1 | 2 {
  if (step % sub !== 0) return 0
  const beat = step / sub
  if (plan === 'backbeat') return beat === 1 || beat === 3 ? 1 : 0
  if (plan === 'one') return beat === 0 ? 2 : 0
  if (plan === 'gap' && bar % 4 >= 2) return 0
  return beat === 0 ? 2 : 1
}

/** How strict the timing is: half of the window either side, in milliseconds. */
export const WINDOWS = [
  { id: 'easy', label: 'Relaxed', ms: 70 },
  { id: 'normal', label: 'Normal', ms: 45 },
  { id: 'tight', label: 'Tight', ms: 25 },
] as const

/**
 * Matches a tap or note (time in seconds) to the nearest target beat not yet used, if it
 * is within `reach` seconds. Returns the target's index and how early (negative) or late
 * (positive) it was, in milliseconds.
 */
export function matchHit(targets: number[], used: Set<number>, t: number, reach: number): { index: number; offsetMs: number } | null {
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < targets.length; i++) {
    if (used.has(i)) continue
    const d = Math.abs(t - targets[i])
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  if (best < 0 || bestD > reach) return null
  return { index: best, offsetMs: Math.round((t - targets[best]) * 1000) }
}

export type Verdict = 'on' | 'early' | 'late'

export function verdict(offsetMs: number, windowMs: number): Verdict {
  return Math.abs(offsetMs) <= windowMs ? 'on' : offsetMs < 0 ? 'early' : 'late'
}

/** A plain-language summary of a set of offsets: are you rushing, dragging or steady? */
export function tendency(offsets: number[], windowMs: number): string {
  if (offsets.length < 4) return 'Keep going, a few more notes and you will see your tendency.'
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length
  const spread = Math.sqrt(offsets.reduce((a, b) => a + (b - mean) ** 2, 0) / offsets.length)
  const lean = Math.abs(mean) < windowMs / 2 ? null : mean < 0 ? 'rush' : 'drag'
  const steady = spread < windowMs ? 'steady' : 'uneven'
  if (!lean && steady === 'steady') return `Right on the click and steady (about ${Math.round(spread)} ms of wobble). Great time.`
  if (!lean) return `Centred on the click on average, but uneven (${Math.round(spread)} ms of wobble). Relax and listen for the click to "disappear" under your note.`
  if (lean === 'rush') return `You tend to rush: about ${Math.round(-mean)} ms early. Wait for the click, as if you were placing your note right on top of it.`
  return `You tend to drag: about ${Math.round(mean)} ms late. Get your finger ready before the click, and move with it rather than after it.`
}

/**
 * Finds note starts in a stream of loudness frames: a frame clearly louder than the
 * frames just before it, at least `refractory` seconds after the last one.
 */
export class OnsetDetector {
  private history: number[] = []
  private last = -Infinity
  private readonly rise: number
  private readonly floor: number
  private readonly refractory: number
  private readonly lookback: number
  constructor(rise = 2.5, floor = 0.004, refractory = 0.09, lookback = 12) {
    this.rise = rise
    this.floor = floor
    this.refractory = refractory
    this.lookback = lookback
  }

  push(level: number, time: number): number | null {
    const before = this.history.length ? this.history.reduce((a, b) => a + b, 0) / this.history.length : Infinity
    this.history.push(level)
    if (this.history.length > this.lookback) this.history.shift()
    if (level > this.floor && level > before * this.rise && time - this.last > this.refractory) {
      this.last = time
      return time
    }
    return null
  }

  reset(): void {
    this.history = []
    this.last = -Infinity
  }
}

/** Median of a list, for the microphone delay check. */
export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
