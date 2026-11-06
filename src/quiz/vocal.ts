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

/** In tune within this many cents. Generous on purpose: voices waver, beginners more so. */
export const TOLERANCE_CENTS = 35
/** How long a note must be held in tune to count. */
export const HOLD_MS = 900

/**
 * Counts how long the singer has stayed in tune. A short wobble out of tune only
 * slows the count down instead of starting it again.
 */
export class HoldTimer {
  private held = 0
  push(cents: number | null, dt: number): number {
    if (cents !== null && Math.abs(cents) <= TOLERANCE_CENTS) this.held += dt
    else this.held = Math.max(0, this.held - dt * 0.5)
    return Math.min(1, this.held / HOLD_MS)
  }
  reset() {
    this.held = 0
  }
}

/** A random note to match inside the chosen range (one octave from the range base). */
export function randomTarget(range: VoiceRange, naturalsOnly: boolean, previous: number | null, rand = Math.random): number {
  const base = RANGE_BASE[range]
  const pool = Array.from({ length: 13 }, (_, i) => base + i).filter((m) => (!naturalsOnly || [0, 2, 4, 5, 7, 9, 11].includes(m % 12)) && m !== previous)
  return pool[Math.floor(rand() * pool.length)]
}
