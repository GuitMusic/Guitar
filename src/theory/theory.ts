/**
 * Music theory for the guitar neck: keys and their scales, triads, the chords that
 * belong to a key, common progressions, and where triads sit on three strings.
 */

export type KeyMode = 'major' | 'minor'
export type Quality = 'maj' | 'min' | 'dim'

export interface Key {
  /** Pitch class of the tonic, 0 = C. */
  tonic: number
  mode: KeyMode
}

/** Semitones above the tonic for each scale degree. */
export const SCALE_STEPS: Record<KeyMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  // natural minor: the same notes as the major key three semitones up
  minor: [0, 2, 3, 5, 7, 8, 10],
}

/** Whole and half steps between the degrees, for the formula W W H W W W H. */
export function stepPattern(mode: KeyMode): ('W' | 'H')[] {
  const s = [...SCALE_STEPS[mode], 12]
  return s.slice(1).map((v, i) => (v - s[i] === 2 ? 'W' : 'H'))
}

export const TRIAD: Record<Quality, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6] }

/** The triad built on each degree of the key, using only the key's notes. */
export const KEY_QUALITIES: Record<KeyMode, Quality[]> = {
  major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
  minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]

/** How each key's tonic is usually written, so its scale is spelled with each letter once. */
const TONIC_NAMES: Record<KeyMode, string[]> = {
  major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  minor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'],
}

export function tonicName(key: Key): string {
  return TONIC_NAMES[key.mode][key.tonic]
}

export function keyName(key: Key): string {
  return `${tonicName(key)} ${key.mode}`
}

/** Writes a pitch class with a given letter, e.g. (10, 'A') -> "A#", (10, 'B') -> "Bb". */
function spell(pc: number, letter: number): string {
  let diff = (((pc - LETTER_PC[letter]) % 12) + 12) % 12
  if (diff > 6) diff -= 12
  const acc = diff === 0 ? '' : diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff)
  return LETTERS[letter] + acc
}

/** Pitch classes of the key's scale, degree 1 first. */
export function scale(key: Key): number[] {
  return SCALE_STEPS[key.mode].map((s) => (key.tonic + s) % 12)
}

/** The scale's note names, one per letter (F major has Bb, not A#). */
export function scaleNames(key: Key): string[] {
  const first = LETTERS.indexOf(tonicName(key)[0])
  return scale(key).map((pc, i) => spell(pc, (first + i) % 7))
}

/** Degree (1 to 7) of a pitch class in the key, or null if it is not in the scale. */
export function degreeOf(key: Key, pc: number): number | null {
  const i = scale(key).indexOf(((pc % 12) + 12) % 12)
  return i < 0 ? null : i + 1
}

/** The key's name for a pitch class: its scale spelling if in the scale, else the usual name. */
export function nameIn(key: Key, pc: number): string {
  const d = degreeOf(key, pc)
  return d ? scaleNames(key)[d - 1] : ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'][((pc % 12) + 12) % 12]
}

export interface Chord {
  root: number
  quality: Quality
  /** e.g. "Am", "C", "Bdim" */
  name: string
  /** e.g. "vi", "V", "vii°" */
  roman: string
  /** Pitch classes, root first. */
  tones: number[]
  /** Note names of the tones, spelled in the key. */
  toneNames: string[]
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const SUFFIX: Record<Quality, string> = { maj: '', min: 'm', dim: 'dim' }

/**
 * The chord on a degree (1 to 7) of the key. `quality` overrides the key's own, as in
 * minor keys where the V chord is often major (E in A minor) to pull back home.
 */
export function chordOn(key: Key, degree: number, quality?: Quality): Chord {
  const q = quality ?? KEY_QUALITIES[key.mode][degree - 1]
  const names = scaleNames(key)
  const root = scale(key)[degree - 1]
  const tones = TRIAD[q].map((s) => (root + s) % 12)
  const rootName = names[degree - 1]
  const first = LETTERS.indexOf(rootName[0])
  // the 3rd and 5th use the letters two and four above the root
  const toneNames = tones.map((pc, i) => spell(pc, (first + i * 2) % 7))
  const r = ROMAN[degree - 1]
  return {
    root,
    quality: q,
    name: rootName + SUFFIX[q],
    roman: q === 'maj' ? r : q === 'min' ? r.toLowerCase() : `${r.toLowerCase()}°`,
    tones,
    toneNames,
  }
}

/** The seven chords of a key. */
export function keyChords(key: Key): Chord[] {
  return [1, 2, 3, 4, 5, 6, 7].map((d) => chordOn(key, d))
}

export interface Progression {
  id: string
  name: string
  mode: KeyMode
  /** Degrees, with an optional quality where it differs from the key's chord. */
  steps: { degree: number; quality?: Quality }[]
  about: string
}

export const PROGRESSIONS: Progression[] = [
  { id: 'pop', name: 'I – V – vi – IV', mode: 'major', steps: [{ degree: 1 }, { degree: 5 }, { degree: 6 }, { degree: 4 }], about: 'The most used progression in pop songs.' },
  { id: 'blues', name: 'I – IV – V – IV', mode: 'major', steps: [{ degree: 1 }, { degree: 4 }, { degree: 5 }, { degree: 4 }], about: 'Folk, blues and rock: the three major chords of the key.' },
  { id: 'fifties', name: 'I – vi – IV – V', mode: 'major', steps: [{ degree: 1 }, { degree: 6 }, { degree: 4 }, { degree: 5 }], about: 'The 1950s ballad progression.' },
  { id: 'jazz', name: 'ii – V – I – I', mode: 'major', steps: [{ degree: 2 }, { degree: 5 }, { degree: 1 }, { degree: 1 }], about: 'The jazz cadence: tension on V, release on I.' },
  { id: 'andalusian', name: 'i – VII – VI – V', mode: 'minor', steps: [{ degree: 1 }, { degree: 7 }, { degree: 6 }, { degree: 5, quality: 'maj' }], about: 'The Andalusian cadence of flamenco and Arab-Andalusian music. The V is major, so the scale bends there.' },
  { id: 'minor-pop', name: 'i – VI – III – VII', mode: 'minor', steps: [{ degree: 1 }, { degree: 6 }, { degree: 3 }, { degree: 7 }], about: 'A dark, driving minor loop.' },
  { id: 'minor-blues', name: 'i – iv – v – i', mode: 'minor', steps: [{ degree: 1 }, { degree: 4 }, { degree: 5 }, { degree: 1 }], about: 'Minor chords only, calm and modal.' },
]

export function progressionChords(key: Key, p: Progression): Chord[] {
  return p.steps.map((s) => chordOn(key, s.degree, s.quality))
}

/** Interval label of a chord tone: R, 3 or b3, 5 or b5. */
export function toneLabel(quality: Quality, index: number): string {
  if (index === 0) return 'R'
  if (index === 1) return quality === 'maj' ? '3' : 'b3'
  return quality === 'dim' ? 'b5' : '5'
}

export interface Voicing {
  /** Lowest string of the set first: string numbers (1 = highest) and frets. */
  notes: { string: number; fret: number; midi: number; tone: number }[]
  inversion: 0 | 1 | 2
}

export const INVERSIONS = ['Root position', '1st inversion', '2nd inversion'] as const

/**
 * Close triad shapes on three neighbouring strings. `low` is the lowest string of the set
 * (e.g. 3 for strings 3-2-1). Inversion 0 has the root at the bottom, 1 the 3rd, 2 the 5th.
 * Returns every playable shape up to `maxFret`, lowest first; a shape spans at most 4 frets.
 */
export function triadVoicings(tuning: number[], root: number, quality: Quality, low: number, inversion: 0 | 1 | 2, maxFret = 15): Voicing[] {
  const strings = [low, low - 1, low - 2]
  if (strings.some((s) => s < 1 || s > tuning.length)) return []
  const tones = TRIAD[quality].map((s) => (root + s) % 12)
  const order = [0, 1, 2].map((i) => (i + inversion) % 3)
  const out: Voicing[] = []
  for (let f0 = 0; f0 <= maxFret; f0++) {
    const m0 = tuning[strings[0] - 1] + f0
    if (m0 % 12 !== tones[order[0]]) continue
    const notes = [{ string: strings[0], fret: f0, midi: m0, tone: order[0] }]
    let prev = m0
    let ok = true
    for (const i of [1, 2]) {
      let m = prev + 1
      while (m % 12 !== tones[order[i]]) m++
      const fret = m - tuning[strings[i] - 1]
      if (fret < 0 || fret > maxFret) {
        ok = false
        break
      }
      notes.push({ string: strings[i], fret, midi: m, tone: order[i] })
      prev = m
    }
    if (!ok) continue
    const fretted = notes.map((n) => n.fret).filter((f) => f > 0)
    if (fretted.length && Math.max(...fretted) - Math.min(...fretted) > 3) continue
    out.push({ notes, inversion })
  }
  return out
}

/** Spots on the neck, open to `maxFret`, whose note is in the given pitch classes. */
export function spotsOf(tuning: number[], pcs: number[], maxFret = 12): { string: number; fret: number; midi: number }[] {
  const set = new Set(pcs.map((p) => ((p % 12) + 12) % 12))
  return tuning.flatMap((open, i) =>
    Array.from({ length: maxFret + 1 }, (_, fret) => ({ string: i + 1, fret, midi: open + fret })).filter((s) => set.has(s.midi % 12)),
  )
}

/** Hand positions for the scale: a 5-fret box around each place the tonic sits on strings 6 and 5. */
export function scaleBoxes(tuning: number[], key: Key, maxFret = 12): { label: string; from: number; to: number }[] {
  const out: { label: string; from: number; to: number }[] = []
  for (const string of [tuning.length, tuning.length - 1]) {
    for (let fret = 0; fret <= maxFret; fret++) {
      if ((tuning[string - 1] + fret) % 12 !== key.tonic) continue
      const from = Math.max(0, fret - (key.mode === 'major' ? 1 : 0))
      out.push({ label: `Root on string ${string}, fret ${fret}`, from, to: Math.min(maxFret, from + 4) })
    }
  }
  return out.sort((a, b) => a.from - b.from).filter((b, i, all) => i === 0 || b.from !== all[i - 1].from)
}
