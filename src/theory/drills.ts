import { chordOn, keyChords, nameIn, scale, scaleNames, type Key } from './theory'

/**
 * Theory questions with tap answers: which note is a degree, which degree is a note,
 * which chord sits on a degree, and which notes make a chord.
 */
export type DrillKind = 'degree-note' | 'note-degree' | 'roman-chord' | 'spell'

export interface Drill {
  kind: DrillKind
  key: Key
  prompt: string
  /** The choices to show, as labels. */
  choices: string[]
  /** The right choices (one, or three for spell). */
  answer: string[]
  /** Shown after answering: why it is so. */
  explain: string
}

export const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th']
const KINDS: DrillKind[] = ['degree-note', 'note-degree', 'roman-chord', 'spell']

const pick = <T>(xs: T[], r: () => number) => xs[Math.min(xs.length - 1, Math.floor(r() * xs.length))]

function shuffle<T>(xs: T[], r: () => number): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** The 12 note names as this key writes them. */
export function chromaticIn(key: Key): string[] {
  return Array.from({ length: 12 }, (_, i) => nameIn(key, (key.tonic + i) % 12))
}

export function makeDrill(key: Key, random: () => number = Math.random, kinds: DrillKind[] = KINDS): Drill {
  const kind = pick(kinds, random)
  const names = scaleNames(key)
  const keyLabel = `${names[0]} ${key.mode}`
  const line = names.join(' ')
  // degree 1 is too easy to ask
  const degree = 2 + Math.floor(random() * 6)
  if (kind === 'degree-note')
    return {
      kind,
      key,
      prompt: `What is the ${ORDINAL[degree]} note of ${keyLabel}?`,
      choices: chromaticIn(key),
      answer: [names[degree - 1]],
      explain: `${keyLabel}: ${line}. Count ${degree} from ${names[0]}.`,
    }
  if (kind === 'note-degree')
    return {
      kind,
      key,
      prompt: `${names[degree - 1]} is which degree of ${keyLabel}?`,
      choices: ['1', '2', '3', '4', '5', '6', '7'],
      answer: [String(degree)],
      explain: `${keyLabel}: ${line}. ${names[degree - 1]} is number ${degree}.`,
    }
  const chords = keyChords(key)
  if (kind === 'roman-chord') {
    const d = 1 + Math.floor(random() * 7)
    const c = chords[d - 1]
    return {
      kind,
      key,
      prompt: `In ${keyLabel}, which chord is ${c.roman}?`,
      choices: shuffle(chords.map((x) => x.name), random),
      answer: [c.name],
      explain: `${c.roman} is built on the ${ORDINAL[d]} note, ${names[d - 1]}: ${c.toneNames.join(' ')} = ${c.name}.`,
    }
  }
  const d = 1 + Math.floor(random() * 7)
  const c = chordOn(key, d)
  return {
    kind,
    key,
    prompt: `Tap the three notes of ${c.name}`,
    choices: chromaticIn(key),
    answer: c.toneNames,
    explain: `${c.name}: root ${c.toneNames[0]}, skip one scale note for ${c.toneNames[1]}, skip one more for ${c.toneNames[2]}.`,
  }
}

/** Every pitch class of the key's scale is spelled once in its chromatic names. */
export const scaleCheck = (key: Key) => scale(key).every((pc) => chromaticIn(key).includes(nameIn(key, pc)))
