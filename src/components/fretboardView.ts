import { useSyncExternalStore } from 'react'
import type { FretboardOptions } from './Fretboard'

// v2: left-handed became the default; older saved settings (v1) started right-handed.
const KEY = 'fretboard-view-v2'

/** Left-handed is the default: the person this app is built for plays left-handed. */
export const DEFAULT_VIEW: FretboardOptions = { labelMode: 'finger', stringOrder: 'tab', leftHanded: true, showGhosts: true }

let current: FretboardOptions = read()
const listeners = new Set<() => void>()

function read(): FretboardOptions {
  try {
    return { ...DEFAULT_VIEW, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULT_VIEW
  }
}

export function getView(): FretboardOptions {
  return current
}

/** Fretboard view settings shared by every screen; changing them anywhere updates all. */
export function setView(change: Partial<FretboardOptions>): void {
  current = { ...current, ...change }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    /* storage may be unavailable */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useFretboardView(): FretboardOptions {
  return useSyncExternalStore(subscribe, getView)
}
