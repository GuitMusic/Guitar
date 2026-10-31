import type { FretboardOptions } from './Fretboard'

const KEY = 'fretboard-view'

/** Left-handed is the default: the person this app is built for plays left-handed. */
export const DEFAULT_VIEW: FretboardOptions = { labelMode: 'finger', stringOrder: 'tab', leftHanded: true, showGhosts: true }

/** Fretboard view settings shared by the practice view and the note finder. */
export function loadView(): FretboardOptions {
  try {
    return { ...DEFAULT_VIEW, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULT_VIEW
  }
}

export function saveView(view: FretboardOptions): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(view))
  } catch {
    /* storage may be unavailable */
  }
}
