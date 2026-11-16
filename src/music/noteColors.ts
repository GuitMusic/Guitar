import { useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'

/**
 * One colour per note, C to B, round a 12-step colour wheel. The natural notes
 * follow the rainbow order classroom colour systems use (C red, D orange,
 * E yellow, F green, G teal, A blue, B pink), and every sharp or flat sits in a
 * slightly deeper shade halfway between its two neighbours, so C# is between
 * C and D. B wraps round to C, like the octave does.
 */
export const NOTE_COLORS = [
  '#ff5c5c', // C
  '#f0703a', // C#
  '#ff9b3d', // D
  '#e0b020', // Eb
  '#ffe14a', // E
  '#a6e04a', // F
  '#3fbf6a', // F#
  '#2ed3c0', // G
  '#2fa3e0', // G#
  '#6f8bff', // A
  '#9d6ff0', // Bb
  '#f075d0', // B
] as const

/** Colour of a note or pitch class, e.g. 60 -> red (C). */
export function noteColor(midi: number): string {
  return NOTE_COLORS[((midi % 12) + 12) % 12]
}

/** Inline style that hands a note's colour to CSS as --nc. */
export function noteColorStyle(midi: number): CSSProperties {
  return { '--nc': noteColor(midi) } as CSSProperties
}

const KEY = 'note-colors'
const listeners = new Set<() => void>()

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

let current = typeof window !== 'undefined' ? read() : true

/** Lets CSS colour things like the note-name keys only while note colours are on. */
function apply() {
  if (typeof document !== 'undefined') document.documentElement.dataset.noteColors = current ? 'on' : 'off'
}
apply()

export function setNoteColors(on: boolean) {
  current = on
  apply()
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* private mode: the choice lasts for this visit */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** Whether notes are coloured by name. On by default. */
export function useNoteColors(): boolean {
  return useSyncExternalStore(subscribe, () => current, () => true)
}
