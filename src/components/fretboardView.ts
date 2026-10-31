import { useSyncExternalStore } from 'react'
import type { FretboardOptions } from './Fretboard'

// v2: left-handed became the default. v3: bass strings on top (as you see your guitar)
// became the default; other choices saved under v2 are kept.
const KEY = 'fretboard-view-v3'
const OLD_KEY = 'fretboard-view-v2'

/**
 * Defaults for the person this app is built for: left-handed, with the bass strings
 * on top, the way you see the neck when you look down at your guitar.
 */
export const DEFAULT_VIEW: FretboardOptions = { labelMode: 'finger', stringOrder: 'player', leftHanded: true, showGhosts: true, zoom: 'song' }

let current: FretboardOptions = read()
const listeners = new Set<() => void>()

function read(): FretboardOptions {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return { ...DEFAULT_VIEW, ...JSON.parse(saved) }
    const old = JSON.parse(localStorage.getItem(OLD_KEY) ?? '{}')
    return { ...DEFAULT_VIEW, ...old, stringOrder: DEFAULT_VIEW.stringOrder }
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
