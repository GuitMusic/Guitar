import type * as alphaTab from '@coderline/alphatab'
import { useCallback, useEffect, useRef, useState } from 'react'
import { listenToSpectrum, type SpectrumListener } from '../audio/spectrum'
import { micErrorMessage } from '../audio/pitch'
import { beatKey, beatToFretNotes } from '../player/alphaTabAdapter'
import { CHECK, judgeNote, notesPlayedSince, type NoteResult } from './noteCheck'

export type CheckMode = 'off' | 'play-along' | 'wait'

export interface JudgedNote {
  key: string
  barIndex: number
  string: number
  fret: number
  midi: number
  result: NoteResult
  at: number
}

export interface WaitState {
  beatKey: string
  notes: { midi: number; string: number; fret: number }[]
  played: number[]
}

interface Options {
  api: alphaTab.AlphaTabApi | null
  track: alphaTab.model.Track | null
  mode: CheckMode
  muteSong: boolean
}

type Beat = alphaTab.model.Beat

/** Notes that start on this beat (ties and dead notes are not plucked). */
function plucked(beat: Beat) {
  return beatToFretNotes(beat).filter((n) => !n.isTieContinuation && !n.isDead)
}

/**
 * Listens with the microphone while a song plays.
 * play-along: every note is judged hit, late or missed a moment after its beat.
 * wait: playback pauses on each beat until its notes have been played.
 */
export function usePracticeCheck({ api, track, mode, muteSong }: Options) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [judged, setJudged] = useState<JudgedNote[]>([])
  const [waiting, setWaiting] = useState<WaitState | null>(null)

  const listener = useRef<SpectrumListener | null>(null)
  const pass = useRef<NoteResult[]>([])
  const modeRef = useRef(mode)
  const waitRef = useRef<{ state: WaitState; since: number } | null>(null)
  const lastWaited = useRef<string | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // Microphone on while a check mode is chosen
  useEffect(() => {
    if (mode === 'off') return
    let cancelled = false
    listenToSpectrum()
      .then((l) => {
        if (cancelled) return l.stop()
        listener.current = l
        setListening(true)
        setError(null)
      })
      .catch((e) => !cancelled && setError(micErrorMessage(e)))
    return () => {
      cancelled = true
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
      listener.current?.stop()
      listener.current = null
      waitRef.current = null
      setWaiting(null)
      setListening(false)
    }
  }, [mode])

  // Mute the song so the mic hears only you (unless you use headphones)
  useEffect(() => {
    if (!api || !track) return
    api.changeTrackMute([track], mode !== 'off' && muteSong)
  }, [api, track, mode, muteSong])

  const resume = useCallback(() => {
    waitRef.current = null
    setWaiting(null)
    api?.play()
  }, [api])

  // Wait mode: check each new microphone frame against the notes we are waiting for
  useEffect(() => {
    const l = listener.current
    if (!l || mode !== 'wait') return
    l.onFrame(() => {
      const w = waitRef.current
      if (!w) return
      const midis = w.state.notes.map((n) => n.midi)
      const played = notesPlayedSince(l.frames(), midis, w.since, l.info)
      if (played.size !== w.state.played.length) {
        w.state = { ...w.state, played: [...played] }
        setWaiting(w.state)
      }
      if (played.size === new Set(midis).size) {
        timers.current.push(window.setTimeout(resume, 120))
        waitRef.current = null
      }
    })
    return () => l.onFrame(null)
  }, [mode, listening, resume])

  // React to beats as playback reaches them
  useEffect(() => {
    if (!api || !track || mode === 'off') return
    let previous = new Set<string>()
    const onBeats = (e: { activeBeats: Beat[] }) => {
      const beats = e.activeBeats.filter((b) => b.voice.bar.staff.track === track && !b.isRest)
      const now = performance.now()
      const fresh = beats.filter((b) => !previous.has(beatKey(b)))
      previous = new Set(beats.map(beatKey))
      const l = listener.current
      if (!l || fresh.length === 0) return

      if (modeRef.current === 'play-along') {
        const notes = fresh.flatMap((b) => plucked(b).map((n) => ({ ...n, barIndex: b.voice.bar.index })))
        if (notes.length === 0) return
        timers.current.push(
          window.setTimeout(() => {
            const frames = l.frames()
            const results = notes.map(
              (n): JudgedNote => ({
                key: n.key,
                barIndex: n.barIndex,
                string: n.string,
                fret: n.fret,
                midi: n.midi,
                result: judgeNote(frames, n.midi, now, l.info),
                at: performance.now(),
              }),
            )
            pass.current.push(...results.map((r) => r.result))
            setJudged((prev) => [...prev.filter((p) => !results.some((r) => r.key === p.key)), ...results].slice(-2000))
          }, CHECK.lateMs + 80),
        )
      } else if (modeRef.current === 'wait') {
        const key = fresh.map(beatKey).join('|')
        const notes = fresh.flatMap(plucked)
        if (notes.length === 0 || key === lastWaited.current) return
        lastWaited.current = key
        // A short delay lets the audio output finish starting before it is paused
        timers.current.push(window.setTimeout(() => api.pause(), 60))
        const state: WaitState = { beatKey: key, notes: notes.map((n) => ({ midi: n.midi, string: n.string, fret: n.fret })), played: [] }
        waitRef.current = { state, since: now }
        setWaiting(state)
      }
    }
    api.activeBeatsChanged.on(onBeats)
    return () => api.activeBeatsChanged.off(onBeats)
  }, [api, track, mode])

  /** Results since the last call, for the speed trainer; null when nothing was judged. */
  const takePass = useCallback((): NoteResult[] | null => {
    const results = pass.current
    pass.current = []
    return results.length ? results : null
  }, [])

  const clearResults = useCallback(() => {
    setJudged([])
    pass.current = []
    lastWaited.current = null
  }, [])

  return { listening, error, judged, waiting, skipWait: resume, takePass, clearResults }
}
