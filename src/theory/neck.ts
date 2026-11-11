import { audioNow, playToneAt } from '../audio/pitch'
import type { Chord } from './theory'
import type { FretNote } from '../music/types'

/** A dot for the theory views, with an optional label and role colour. */
export function dot(tuning: number[], string: number, fret: number, extra: Partial<FretNote> = {}): FretNote {
  return {
    key: `${string}:${fret}`,
    string,
    fret,
    tabFret: fret,
    midi: tuning[string - 1] + fret,
    lh: null,
    rh: null,
    lhInferred: false,
    rhInferred: false,
    ...extra,
  }
}

/** A comfortable octave for hearing a pitch class: from G3 up. */
export const voice = (pc: number, from = 55) => from + ((((pc - from) % 12) + 12) % 12)

/** Strums a chord's tones quickly from low to high. */
export function strum(midis: number[], gap = 0.035, seconds = 1.6) {
  const t = audioNow() + 0.03
  ;[...midis].sort((a, b) => a - b).forEach((m, i) => playToneAt(m, t + i * gap, seconds, 0.32))
}

/** A chord in a middle voicing, for hearing it. */
export const chordSound = (c: Chord) => {
  const r = voice(c.root, 48)
  return [r, ...c.tones.slice(1).map((pc) => r + ((((pc - c.root) % 12) + 12) % 12))]
}

