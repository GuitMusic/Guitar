/** Pure helpers for the singing trainer, kept apart from the UI so they can be tested. */

export type VoiceRange = 'low' | 'high'
export type ScaleKind = 'major' | 'minor' | 'hijaz'

/** Where each voice range starts: C3 for lower voices, C4 for higher ones. */
export const RANGE_BASE: Record<VoiceRange, number> = { low: 48, high: 60 }

export const SCALES: Record<ScaleKind, { label: string; steps: number[] }> = {
  major: { label: 'Major (Do Ré Mi)', steps: [0, 2, 4, 5, 7, 9, 11, 12] },
  minor: { label: 'Minor', steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  hijaz: { label: 'Hijaz', steps: [0, 1, 4, 5, 7, 8, 10, 12] },
}

/** The notes to sing: up the scale and back down, tonic at both ends. */
export function scaleRun(tonic: number, kind: ScaleKind): number[] {
  const up = SCALES[kind].steps.map((s) => tonic + s)
  return [...up, ...up.slice(0, -1).reverse()]
}

/**
 * How far a sung pitch is from the target, ignoring the octave: singing an octave
 * below a note is still the right note. `semitones` is in [-6, 6), `octaves` says
 * which octave was sung (−1 = an octave lower).
 */
export function offTarget(sung: number, target: number): { semitones: number; octaves: number } {
  const d = sung - target
  const semitones = ((((d + 6) % 12) + 12) % 12) - 6
  return { semitones, octaves: Math.round((d - semitones) / 12) }
}

export type VocalLevel = 'beginner' | 'normal'

/**
 * How strict the trainer is. Beginner suits people who have never trained their voice:
 * a wide window around the note, a short hold, notes close together, and after a while
 * of trying, anything within a semitone counts.
 */
export const VOCAL_LEVELS: Record<VocalLevel, { label: string; tolerance: number; holdMs: number; span: number; helpAfterMs: number | null; helpTolerance: number }> = {
  beginner: { label: 'Beginner (forgiving)', tolerance: 80, holdMs: 450, span: 7, helpAfterMs: 8000, helpTolerance: 120 },
  normal: { label: 'Practised', tolerance: 35, holdMs: 900, span: 12, helpAfterMs: null, helpTolerance: 35 },
}

/** In tune within this many cents on the practised level. */
export const TOLERANCE_CENTS = VOCAL_LEVELS.normal.tolerance
/** How long a note must be held in tune to count on the practised level. */
export const HOLD_MS = VOCAL_LEVELS.normal.holdMs

/**
 * Counts how long the singer has stayed in tune. A short wobble out of tune only
 * slows the count down instead of starting it again.
 */
export class HoldTimer {
  private held = 0
  push(cents: number | null, dt: number, tolerance = TOLERANCE_CENTS, holdMs = HOLD_MS): number {
    if (cents !== null && Math.abs(cents) <= tolerance) this.held += dt
    // A gap (breath, crack) drains slowly, so starting over is rarely needed
    else this.held = Math.max(0, this.held - dt * (tolerance > TOLERANCE_CENTS ? 0.25 : 0.5))
    return Math.min(1, this.held / holdMs)
  }
  reset() {
    this.held = 0
  }
}

/** A random note to match: from the range base up `span` semitones (7 = Do to Sol, the easy middle of most voices). */
export function randomTarget(range: VoiceRange, naturalsOnly: boolean, previous: number | null, rand = Math.random, span = 12): number {
  const base = RANGE_BASE[range]
  const pool = Array.from({ length: span + 1 }, (_, i) => base + i).filter((m) => (!naturalsOnly || [0, 2, 4, 5, 7, 9, 11].includes(m % 12)) && m !== previous)
  return pool[Math.floor(rand() * pool.length)]
}
