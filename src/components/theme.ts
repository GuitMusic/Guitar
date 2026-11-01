import { useSyncExternalStore } from 'react'

/** 'dark' is the default: the fretboard and dots glow best on a dark stage. */
export type Theme = 'dark' | 'light' | 'system'

const KEY = 'theme'
const listeners = new Set<() => void>()
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function read(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'system' || t === 'dark' ? t : 'dark'
  } catch {
    return 'dark'
  }
}

let current = read()

function apply() {
  document.documentElement.dataset.theme = current
}

export function setTheme(t: Theme) {
  current = t
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* private mode: the choice lasts for this visit */
  }
  apply()
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  media?.addEventListener('change', l)
  return () => {
    listeners.delete(l)
    media?.removeEventListener('change', l)
  }
}

/** The chosen theme and whether the page is dark right now. */
export function useTheme(): { theme: Theme; dark: boolean } {
  const theme = useSyncExternalStore(subscribe, () => current)
  const systemDark = useSyncExternalStore(subscribe, () => media?.matches ?? false)
  return { theme, dark: theme === 'dark' || (theme === 'system' && systemDark) }
}

if (typeof document !== 'undefined') apply()
