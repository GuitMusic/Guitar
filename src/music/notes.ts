/** Sharps, except Eb and Bb, which guitarists usually call by their flat names. */
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'] as const

/** Pitch class name without octave, e.g. 64 -> "E". */
export function pitchClassName(midi: number): string {
  return NAMES[((midi % 12) + 12) % 12]
}

/** Scientific pitch name, e.g. 64 -> "E4", 40 -> "E2". */
export function noteName(midi: number): string {
  return `${pitchClassName(midi)}${Math.floor(midi / 12) - 1}`
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Fractional MIDI number for a frequency (69 = A4). */
export function frequencyToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440)
}

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Parses a pitch class like "E", "eb", "F#" into 0..11, or null. */
export function parsePitchClass(name: string): number | null {
  const m = /^([A-Ga-g])([#b]?)$/.exec(name.trim())
  if (!m) return null
  let pc = LETTER_PC[m[1].toUpperCase()]
  if (m[2] === '#') pc += 1
  if (m[2] === 'b') pc -= 1
  return (pc + 12) % 12
}

/** alphaTex tuning token, e.g. 64 -> "e4", 61 -> "c#4". */
export function texPitch(midi: number): string {
  const sharps = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
  return `${sharps[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}

export interface Tuning {
  id: string
  name: string
  /** MIDI notes from string 1 (highest) to the lowest string. */
  strings: number[]
}

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: 'Standard (E A D G B E)', strings: [64, 59, 55, 50, 45, 40] },
  { id: 'drop-d', name: 'Drop D (D A D G B E)', strings: [64, 59, 55, 50, 45, 38] },
  { id: 'dadgad', name: 'DADGAD', strings: [62, 57, 55, 50, 45, 38] },
  { id: 'open-g', name: 'Open G (D G D G B D)', strings: [62, 59, 55, 50, 43, 38] },
  { id: 'open-d', name: 'Open D (D A D F# A D)', strings: [62, 57, 54, 50, 45, 38] },
  { id: 'half-down', name: 'Half step down', strings: [63, 58, 54, 49, 44, 39] },
]

export const STANDARD_TUNING = TUNINGS[0].strings
