/** Picking-hand fingers in classical notation: thumb, index, middle, ring, little. */
export type PickFinger = 'p' | 'i' | 'm' | 'a' | 'c'

export const PICK_FINGERS: PickFinger[] = ['p', 'i', 'm', 'a', 'c']

/**
 * Fretting-hand finger: 0 = thumb (over the neck), 1 = index … 4 = little.
 */
export type FretFinger = 0 | 1 | 2 | 3 | 4

/** One note to show on the fretboard. */
export interface FretNote {
  /** Stable key for overrides: track:bar:voice:beat:string. */
  key: string
  /** String number as in tab: 1 = highest (thin e) string. */
  string: number
  /** Fret as written in the tab, relative to the capo. */
  tabFret: number
  /** Actual fret on the neck (tab fret + capo). */
  fret: number
  /** Sounding pitch as MIDI number. */
  midi: number
  /** Fretting-hand finger, null for open strings or unknown. */
  lh: FretFinger | null
  /** Picking-hand finger. */
  rh: PickFinger | null
  /** True when lh was guessed by the app instead of read from the file or the user. */
  lhInferred: boolean
  rhInferred: boolean
  isDead?: boolean
  isTieContinuation?: boolean
  /** Fretted earlier in the bar and probably still held down (part of the chord shape). */
  isHeld?: boolean
  /** Text to show on the dot instead of the finger or note name, e.g. a scale degree. */
  label?: string
  /** Colour by role, e.g. in theory views: the root, a chord tone, or another scale note. */
  tone?: 'root' | 'chord' | 'scale'
}

export interface FingeringOverride {
  lh?: FretFinger | null
  rh?: PickFinger | null
}

export type FingeringOverrides = Record<string, FingeringOverride>
