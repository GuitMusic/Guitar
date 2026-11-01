import { useSyncExternalStore } from 'react'

// "Install app" support. Android Chrome (and desktop Chrome/Edge) fire
// beforeinstallprompt once the page qualifies; we keep that event so a button can
// show the install dialog later. iPhone Safari has no such event: the user adds the
// app from the Share menu, so we only show the steps there.

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    emit()
  })
}

export type InstallState = 'installed' | 'prompt' | 'ios' | 'manual'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac, but has touch
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

function getState(): InstallState {
  if (installed || isStandalone()) return 'installed'
  if (deferred) return 'prompt'
  if (isIos()) return 'ios'
  return 'manual'
}

export function useInstall() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getState,
  )
}

export async function promptInstall() {
  if (!deferred) return
  const e = deferred
  deferred = null
  await e.prompt()
  await e.userChoice.catch(() => undefined)
  emit()
}
