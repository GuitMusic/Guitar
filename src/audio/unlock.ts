import { useEffect, useState } from 'react'

/**
 * Keeps the app's sound switched on.
 *
 * Browsers start every AudioContext "suspended" until the page gets a click or key
 * press, and laptops suspend or "interrupt" it again after sleep, when the tab sits
 * in the background, or when headphones or Bluetooth speakers come and go. A context
 * that is resumed outside a click (from a timer, say) stays silent in Safari.
 *
 * Every context the app plays through is registered here. Any click, tap or key
 * press on the page resumes the ones that stopped, and so does coming back to the
 * tab. Components can ask whether sound is currently blocked to show a hint.
 */

type Ctx = AudioContext

const contexts = new Set<Ctx>()
const listeners = new Set<() => void>()
let shared: Ctx | null = null
let installed = false

function notify() {
  listeners.forEach((l) => l())
}

function isStopped(ctx: Ctx): boolean {
  // 'interrupted' is Safari's state after a call, Siri or the lid closing
  return (ctx.state as string) === 'suspended' || (ctx.state as string) === 'interrupted'
}

/** Resume every registered context that has stopped. Safe to call often. */
export function resumeAudio(): void {
  contexts.forEach((ctx) => {
    if (ctx.state === 'closed') {
      contexts.delete(ctx)
      return
    }
    if (isStopped(ctx)) ctx.resume().then(notify, notify)
  })
}

function install() {
  if (installed || typeof window === 'undefined') return
  installed = true
  // Capture phase, so the resume runs inside the same click that presses Play
  const opts = { capture: true, passive: true } as const
  for (const type of ['pointerdown', 'touchend', 'keydown', 'click']) window.addEventListener(type, resumeAudio, opts)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumeAudio()
  })
  window.addEventListener('pageshow', resumeAudio)
  // Headphones or speakers plugged in or out
  navigator.mediaDevices?.addEventListener?.('devicechange', resumeAudio)
}

/** Track a context so it is resumed whenever the user interacts with the page. */
export function registerAudioContext(ctx: Ctx): () => void {
  install()
  if (contexts.has(ctx)) return () => {}
  contexts.add(ctx)
  const onState = () => notify()
  ctx.addEventListener('statechange', onState)
  notify()
  return () => {
    ctx.removeEventListener('statechange', onState)
    contexts.delete(ctx)
    notify()
  }
}

/**
 * One context for the app's own short sounds (reference tones, tap to hear).
 * Making a new context for every tone runs into the browser's limit on open
 * contexts, and a fresh one made outside a click starts suspended.
 */
export function sharedAudioContext(): Ctx {
  if (!shared || shared.state === 'closed') {
    shared = new AudioContext()
    registerAudioContext(shared)
  }
  if (isStopped(shared)) void shared.resume().catch(() => {})
  return shared
}

/** True when a registered context is stopped and needs a click to start again. */
export function isAudioBlocked(): boolean {
  for (const ctx of contexts) if (isStopped(ctx)) return true
  return false
}

export function onAudioStateChange(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** React hook: whether sound is blocked right now. */
export function useAudioBlocked(): boolean {
  const [blocked, setBlocked] = useState(isAudioBlocked)
  useEffect(() => {
    const update = () => setBlocked(isAudioBlocked())
    update()
    return onAudioStateChange(update)
  }, [])
  return blocked
}
