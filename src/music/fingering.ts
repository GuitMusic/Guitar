import type { FingeringOverrides, FretFinger, FretNote, PickFinger } from './types'

export interface FingeringResult {
  notes: FretNote[]
  /** Fret under the index finger after this beat, used as context for the next beat. */
  position: number | null
}

/**
 * Applies user overrides, then fills in missing fingers with simple, predictable rules:
 *
 * Fretting hand: one finger per fret from the current hand position. The hand stays where
 * it was while the new notes fit in the four-fret box, otherwise it moves so the lowest
 * fretted note gets the index finger.
 *
 * Picking hand: the thumb (p) plays the bass strings (4 and lower on a six-string), and
 * i, m, a play strings 3, 2 and 1.
 */
export function applyFingering(
  notes: FretNote[],
  numStrings: number,
  previousPosition: number | null,
  overrides: FingeringOverrides = {},
): FingeringResult {
  const withOverrides = notes.map((n) => {
    const o = overrides[n.key]
    if (!o) return n
    return {
      ...n,
      lh: o.lh !== undefined ? o.lh : n.lh,
      rh: o.rh !== undefined ? o.rh : n.rh,
      lhInferred: o.lh !== undefined ? false : n.lhInferred,
      rhInferred: o.rh !== undefined ? false : n.rhInferred,
    }
  })

  const fretted = withOverrides.filter((n) => n.tabFret > 0 && !n.isDead)
  let position = previousPosition
  if (fretted.length > 0) {
    // A note with a known finger pins the hand position exactly.
    const pinned = fretted.find((n) => n.lh !== null && n.lh > 0)
    const minFret = Math.min(...fretted.map((n) => n.fret))
    const maxFret = Math.max(...fretted.map((n) => n.fret))
    if (pinned) {
      position = Math.max(1, pinned.fret - (pinned.lh! - 1))
    } else if (position === null || minFret < position || maxFret > position + 3) {
      position = minFret
    }
  }

  const bassFrom = numStrings >= 6 ? 4 : Math.max(2, numStrings - 2)

  const result = withOverrides.map((n): FretNote => {
    let { lh, rh, lhInferred, rhInferred } = n
    if (lh === null && n.tabFret > 0 && !n.isDead && position !== null) {
      lh = clampFinger(n.fret - position + 1)
      lhInferred = true
    }
    if (rh === null && !n.isTieContinuation) {
      rh = n.string >= bassFrom ? 'p' : trebleFinger(n.string)
      rhInferred = true
    }
    return { ...n, lh, rh, lhInferred, rhInferred }
  })

  return { notes: result, position }
}

function clampFinger(f: number): FretFinger {
  return Math.min(4, Math.max(1, f)) as FretFinger
}

function trebleFinger(stringNumber: number): PickFinger {
  if (stringNumber <= 1) return 'a'
  if (stringNumber === 2) return 'm'
  return 'i'
}

/** alphaTab Fingers enum value (Thumb = 0 … Little = 4, negatives = none) to a fretting finger. */
export function fretFingerFromAlphaTab(value: number): FretFinger | null {
  return value >= 0 && value <= 4 ? (value as FretFinger) : null
}

/** alphaTab Fingers enum value to a picking finger. */
export function pickFingerFromAlphaTab(value: number): PickFinger | null {
  const map: PickFinger[] = ['p', 'i', 'm', 'a', 'c']
  return value >= 0 && value <= 4 ? map[value] : null
}

export function fretFingerLabel(f: FretFinger): string {
  return f === 0 ? 'T' : String(f)
}
