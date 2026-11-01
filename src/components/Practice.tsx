import * as alphaTab from '@coderline/alphatab'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyFingering } from '../music/fingering'
import { fingerSong } from '../music/songFingering'
import { noteName } from '../music/notes'
import type { FingeringOverride, FretNote } from '../music/types'
import { loadSettings, newId, saveSettings, type SongSettings } from '../library/db'
import type { OpenSong } from '../library/songs'
import { beatToFretNotes, nextSoundingBeat } from '../player/alphaTabAdapter'
import { Fretboard, type FretboardOptions } from './Fretboard'
import { playTone } from '../audio/pitch'
import { registerAudioContext, resumeAudio, useAudioBlocked } from '../audio/unlock'
import { FingerEditor } from './FingerEditor'
import { CheckPanel, ListenMenu } from './CheckPanel'
import { BeatLights, Icon, Menu, ProgressLine, TogglePill } from './PlayerBar'
import { accuracy, nextTrainerSpeed } from '../check/noteCheck'
import { usePracticeCheck, type CheckMode } from '../check/usePracticeCheck'
import { logPractice } from '../progress/practiceLog'
import type { FretMark, GuitarSound } from './Fretboard'
import { getView, setView, useFretboardView } from './fretboardView'
import { SongCover } from './Library'
import { SongComplete } from './SongComplete'
import { useTheme } from './theme'

type Beat = alphaTab.model.Beat

// Program numbers inside public/sounds/guitar.sf3
const PROGRAM: Record<GuitarSound, number> = { steel: 25, nylon: 24, 'steel-dry': 27, 'nylon-dry': 28 }

/**
 * The sound bank holds only guitars, so every pitched track plays
 * one of them, whatever instrument the file asked for. Returns true if anything changed.
 */
function setGuitarSound(score: alphaTab.model.Score, sound: GuitarSound = 'steel'): boolean {
  let changed = false
  for (const t of score.tracks) {
    if (t.staves.some((st) => st.isPercussion)) continue
    if (t.playbackInfo.program !== PROGRAM[sound]) {
      t.playbackInfo.program = PROGRAM[sound]
      changed = true
    }
    // Instrument changes inside the song would switch back to a sound the bank does not have
    for (const st of t.staves)
      for (const bar of st.bars)
        for (const v of bar.voices)
          for (const b of v.beats)
            for (const a of b.automations)
              if (a.type === alphaTab.model.AutomationType.Instrument && a.value !== PROGRAM[sound]) {
                a.value = PROGRAM[sound]
                changed = true
              }
  }
  return changed
}
type Score = alphaTab.model.Score

const BASE = import.meta.env.BASE_URL
// three.js is big, so the 3D hand loads only when it's shown
const HandPanel = lazy(() => import('../hand/HandPanel'))

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface Props {
  song: OpenSong
}

export function Practice({ song }: Props) {
  const scoreEl = useRef<HTMLDivElement>(null)
  const scrollEl = useRef<HTMLDivElement>(null)
  const apiRef = useRef<alphaTab.AlphaTabApi | null>(null)
  const [api, setApi] = useState<alphaTab.AlphaTabApi | null>(null)
  const [finished, setFinished] = useState(false)
  // A slim player docks at the bottom of the screen whenever the big player bar's Play button
  // can't be seen: scrolled off the top, tucked under the sticky fretboard, or below the fold.
  const playerBarEl = useRef<HTMLDivElement>(null)
  const fretboardWrapEl = useRef<HTMLDivElement>(null)
  const [barVisible, setBarVisible] = useState(true)
  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const play = playerBarEl.current?.querySelector('.pb-play')
      if (!play) return
      const r = play.getBoundingClientRect()
      const fb = fretboardWrapEl.current?.getBoundingClientRect()
      const top = Math.max(0, fb ? fb.bottom : 0)
      const nav = document.querySelector('nav.main-nav')
      const navTop = nav && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().top : window.innerHeight
      setBarVisible(r.top >= top - 4 && r.bottom <= navTop + 4)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', schedule, { passive: true, capture: true })
    window.addEventListener('resize', schedule)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    if (ro && fretboardWrapEl.current) ro.observe(fretboardWrapEl.current)
    if (ro && playerBarEl.current) ro.observe(playerBarEl.current)
    return () => {
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      ro?.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  const lastTick = useRef(0)
  const onLoopPass = useRef<() => void>(() => {})

  const [score, setScore] = useState<Score | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingSound, setLoadingSound] = useState(0)
  const [ready, setReady] = useState(false)
  const audioBlocked = useAudioBlocked()
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState({ current: 0, end: 0, tick: 0 })
  const [activeBeats, setActiveBeats] = useState<Beat[]>([])
  const [settings, setSettings] = useState<SongSettings | null>(null)
  const view = useFretboardView()
  const { dark } = useTheme()
  const [staveProfile, setStaveProfile] = useState<'tab' | 'both'>('both')
  const [metronome, setMetronome] = useState(false)
  const [countIn, setCountIn] = useState(false)
  const [loop, setLoop] = useState<{ on: boolean; start: number; end: number }>({ on: false, start: 1, end: 4 })
  const [showLegend, setShowLegend] = useState(false)
  const [editing, setEditing] = useState<{ note: FretNote; anchor: { x: number; y: number } } | null>(null)
  const [checkMode, setCheckMode] = useState<CheckMode>('off')
  const [muteSong, setMuteSong] = useState(true)
  const [trainer, setTrainer] = useState<{ on: boolean; target: number; passes: number; message: string | null }>({
    on: false,
    target: 1,
    passes: 0,
    message: null,
  })

  // Per-song settings (speed, saved loops, fingering edits)
  useEffect(() => {
    let alive = true
    loadSettings(song.id).then((s) => alive && setSettings(s))
    return () => {
      alive = false
    }
  }, [song.id])

  const updateSettings = useCallback((change: (s: SongSettings) => SongSettings) => {
    setSettings((prev) => {
      if (!prev) return prev
      const next = change(prev)
      void saveSettings(next)
      return next
    })
  }, [])


  // Create the alphaTab score view and player
  useEffect(() => {
    if (!scoreEl.current || !scrollEl.current) return
    const api = new alphaTab.AlphaTabApi(scoreEl.current, {
      core: { fontDirectory: `${BASE}font/` },
      display: { scale: 0.95, layoutMode: alphaTab.LayoutMode.Page },
      notation: { rhythmMode: alphaTab.TabRhythmMode.Automatic },
      player: {
        playerMode: alphaTab.PlayerMode.EnabledSynthesizer,
        soundFont: `${BASE}sounds/guitar.sf3`,
        scrollElement: scrollEl.current,
        scrollOffsetY: -100,
      },
    } as unknown as alphaTab.Settings)
    apiRef.current = api
    setApi(api)

    api.scoreLoaded.on((s) => {
      setGuitarSound(s, getView().sound)
      setScore(s)
      setError(null)
      setLoop((l) => ({ ...l, start: 1, end: Math.min(4, s.masterBars.length) }))
    })
    api.error.on((e) => setError(e.message ?? String(e)))
    api.soundFontLoad.on((e) => setLoadingSound(Math.round((e.loaded / Math.max(1, e.total)) * 100)))
    // alphaTab plays through its own AudioContext: track it so a click wakes it up
    // again after the laptop sleeps or the output device changes
    let unregisterAudio = () => {}
    const watchAudio = () => {
      const ctx = (api.player as unknown as { output?: { context?: AudioContext | null } } | null)?.output?.context
      if (ctx) {
        unregisterAudio()
        unregisterAudio = registerAudioContext(ctx)
      }
    }
    api.playerReady.on(() => {
      watchAudio()
      setReady(true)
    })
    api.playerStateChanged.on((e) => {
      const isPlaying = e.state === alphaTab.synth.PlayerState.Playing
      if (isPlaying) {
        watchAudio()
        resumeAudio()
      }
      setPlaying(isPlaying)
    })
    api.playerFinished.on(() => {
      if (!api.isLooping) setFinished(true)
    })
    api.playerPositionChanged.on((e) => {
      setTime((t) => (Math.abs(t.current - e.currentTime) > 120 || t.end !== e.endTime ? { current: e.currentTime, end: e.endTime, tick: e.currentTick } : t))
      // Playback jumping back while looping = one pass of the loop finished
      const range = api.playbackRange
      if (api.isLooping && range && e.currentTick + 960 < lastTick.current && e.currentTick <= range.startTick + 960) onLoopPass.current()
      lastTick.current = e.currentTick
    })
    api.activeBeatsChanged.on((e) => setActiveBeats(e.activeBeats))
    api.beatMouseDown.on((beat) => {
      if (api.playerState !== alphaTab.synth.PlayerState.Playing) setActiveBeats([beat])
    })

    try {
      if (song.format === 'binary') api.load(new Uint8Array(song.data as ArrayBuffer))
      else api.tex(song.data as string)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }

    return () => {
      unregisterAudio()
      api.destroy()
      apiRef.current = null
      setApi(null)
      setScore(null)
      setReady(false)
      setPlaying(false)
      setActiveBeats([])
    }
  }, [song])

  const trackIndex = settings?.trackIndex ?? 0
  const track = score?.tracks[Math.min(trackIndex, score.tracks.length - 1)] ?? null
  const staff = track?.staves[0] ?? null

  // Render only the chosen track, as score + tab or tab only
  useEffect(() => {
    const api = apiRef.current
    if (!api || !track) return
    api.settings.display.staveProfile = staveProfile === 'tab' ? alphaTab.StaveProfile.Tab : alphaTab.StaveProfile.ScoreTab
    api.updateSettings()
    api.renderTracks([track])
  }, [track, staveProfile])

  // Notation ink that suits the page: light ink on dark paper in the dark theme
  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    const r = api.settings.display.resources
    const ink = (hex: string) => alphaTab.model.Color.fromJson(hex)!
    const main = dark ? '#e8e0d4' : '#000000'
    const soft = dark ? '#8f877b' : '#a5a5a5'
    r.mainGlyphColor = ink(main)
    r.secondaryGlyphColor = ink(dark ? '#e8e0d466' : '#00000066')
    r.scoreInfoColor = ink(main)
    r.staffLineColor = ink(soft)
    r.barSeparatorColor = ink(dark ? '#b8afa2' : '#222222')
    r.barNumberColor = ink(dark ? '#e8875a' : '#c80000')
    api.updateSettings()
    if (api.score) api.render()
  }, [dark, api])

  // Switching steel and nylon: change every track's instrument and rebuild the playback
  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    // The close and dry samples are recorded about 7 dB quieter
    api.masterVolume = view.sound?.endsWith('-dry') ? 2.2 : 1
    if (api.score && setGuitarSound(api.score, view.sound)) api.loadMidiForScore()
  }, [view.sound, api])

  // Apply saved speed
  useEffect(() => {
    if (apiRef.current && settings) apiRef.current.playbackSpeed = settings.speed
  }, [settings?.speed, ready, settings])

  useEffect(() => {
    if (apiRef.current) apiRef.current.metronomeVolume = metronome ? 1 : 0
  }, [metronome, ready])
  useEffect(() => {
    if (apiRef.current) apiRef.current.countInVolume = countIn ? 1 : 0
  }, [countIn, ready])

  // Loop range
  useEffect(() => {
    const api = apiRef.current
    if (!api || !score) return
    const bars = score.masterBars
    const start = bars[Math.max(0, Math.min(loop.start, bars.length) - 1)]
    const end = bars[Math.max(0, Math.min(loop.end, bars.length) - 1)]
    if (loop.on && start && end && end.index >= start.index) {
      api.playbackRange = { startTick: start.start, endTick: end.start + end.calculateDuration() } as alphaTab.synth.PlaybackRange
      api.isLooping = true
      const firstBeat = track?.staves[0].bars[start.index]?.voices[0]?.beats[0]
      const lastBeats = track?.staves[0].bars[end.index]?.voices[0]?.beats
      if (firstBeat && lastBeats?.length) api.highlightPlaybackRange(firstBeat, lastBeats[lastBeats.length - 1])
      if (api.tickPosition < start.start || api.tickPosition >= end.start + end.calculateDuration()) api.tickPosition = start.start
    } else {
      api.playbackRange = null
      api.isLooping = false
      api.clearPlaybackRangeHighlight()
    }
  }, [loop, score, track])

  // What to show on the fretboard
  const overrides = settings?.fingering
  // The whole track fingered once, in hand shapes ("grips"), the way a player would plan it
  const songFingering = useMemo(() => {
    if (!staff) return null
    const beats = staff.bars.flatMap((bar) =>
      bar.voices
        .flatMap((v) => v.beats)
        .filter((b) => b.notes.length > 0)
        .sort((a, b) => a.playbackStart - b.playbackStart),
    )
    const eventOf = new Map<Beat, number>()
    beats.forEach((b, i) => eventOf.set(b, i))
    const events = beats.map((b) => ({ bar: b.voice.bar.index, notes: beatToFretNotes(b) }))
    return { beats, events, eventOf, ...fingerSong(events, overrides) }
  }, [staff, overrides])

  const { notes, ghosts, shape, grip, position } = useMemo(() => {
    const empty = { notes: [] as FretNote[], ghosts: [] as FretNote[], shape: [] as FretNote[], grip: [] as FretNote[], position: null as number | null }
    let beats = activeBeats.filter((b) => !track || b.voice.bar.staff.track === track)
    // Before Play (or after Stop) show the first note and hand shape of the bar playback starts from
    if (beats.length === 0 && staff) {
      const startBar = staff.bars[Math.max(0, Math.min((loop.on ? loop.start : 1) - 1, staff.bars.length - 1))]
      const first = startBar?.voices
        .flatMap((v) => v.beats)
        .filter((b) => b.notes.length > 0)
        .sort((a, b) => a.playbackStart - b.playbackStart)[0]
      if (first) beats = [first]
    }
    if (!songFingering || beats.length === 0) return empty
    const { events, eventOf, fingers, grips, gripOf } = songFingering
    const stringCount = staff?.tuning.length ?? 6
    const withFinger = (n: FretNote): FretNote => {
      const lh = n.lh ?? fingers.get(n.key) ?? null
      return lh === n.lh ? n : { ...n, lh, lhInferred: true }
    }
    const raw = beats.flatMap(beatToFretNotes).map(withFinger)
    const at = Math.max(...beats.map((b) => eventOf.get(b) ?? -1))
    if (at < 0) return { ...empty, notes: applyFingering(raw, stringCount, null, overrides).notes }
    const g = grips[gripOf[at]]
    // Notes played earlier from the same grip stay held down (fingerstyle lets the chord ring)
    const sounding = new Set(raw.map((n) => n.string))
    const held = new Map<number, FretNote>()
    for (let i = g.start; i < at; i++)
      for (const n of events[i].notes) {
        if (sounding.has(n.string)) continue
        if (n.tabFret > 0 && !n.isDead) held.set(n.string, { ...withFinger(n), isHeld: true })
        else held.delete(n.string)
      }
    const result = applyFingering([...held.values(), ...raw], stringCount, g.position, overrides)
    const nextRaw = beats
      .map(nextSoundingBeat)
      .filter((b): b is Beat => b !== null)
      .flatMap(beatToFretNotes)
      .map(withFinger)
    const current = new Set(result.notes.map((n) => `${n.string}:${n.fret}`))
    // The rest of the bar's notes, with the fingers they'll be played with
    const shapeNotes: FretNote[] = []
    const seen = new Set(current)
    for (const bar of new Set(beats.map((b) => b.voice.bar)))
      for (const b of bar.voices.flatMap((v) => v.beats).sort((a, b) => a.playbackStart - b.playbackStart))
        for (const n of beatToFretNotes(b).map(withFinger)) {
          const id = `${n.string}:${n.fret}`
          if (n.tabFret <= 0 || n.isDead || n.isTieContinuation || seen.has(id)) continue
          seen.add(id)
          shapeNotes.push(n)
        }
    return {
      notes: result.notes,
      ghosts: nextRaw.filter((n) => !current.has(`${n.string}:${n.fret}`)),
      shape: shapeNotes,
      // The rest of this grip: the fingers the hand already has in place for what comes next
      grip: g.notes.filter((n) => !current.has(`${n.string}:${n.fret}`)),
      position: g.position,
    }
  }, [activeBeats, track, staff, overrides, loop.on, loop.start, songFingering])

  const setOverride = (note: FretNote, override: FingeringOverride | null) => {
    updateSettings((s) => {
      const fingering = { ...s.fingering }
      if (override === null) delete fingering[note.key]
      else fingering[note.key] = { ...fingering[note.key], ...override }
      return { ...s, fingering }
    })
    setEditing(null)
  }

  const barCount = score?.masterBars.length ?? 0
  // Start tick of each bar plus the end of the song, for the progress line
  const barTicks = useMemo(() => {
    const bars = score?.masterBars ?? []
    if (!bars.length) return []
    const last = bars[bars.length - 1]
    return [...bars.map((b) => b.start), last.start + last.calculateDuration()]
  }, [score])
  // Which beat of the bar is playing, for the metronome lights
  const beatInfo = useMemo(() => {
    const beat = activeBeats[0]
    const master = beat?.voice.bar.masterBar ?? score?.masterBars[0]
    if (!master) return { count: 4, index: null as number | null }
    const unit = 3840 / master.timeSignatureDenominator
    return { count: master.timeSignatureNumerator, index: beat ? Math.floor(beat.playbackStart / unit) : null }
  }, [activeBeats, score])
  const speed = settings?.speed ?? 1
  const tuning = staff?.tuning ?? [64, 59, 55, 50, 45, 40]
  const capo = staff?.capo ?? 0
  // Highest fret the song reaches, so the fretboard can zoom to just those frets
  const songMaxFret = useMemo(() => {
    let max = 0
    for (const bar of staff?.bars ?? []) for (const voice of bar.voices) for (const beat of voice.beats) for (const n of beatToFretNotes(beat)) max = Math.max(max, n.fret)
    return max
  }, [staff])
  const fretsShown = view.zoom === 'neck' || !staff ? undefined : Math.min(15, Math.max(7, songMaxFret + 2))

  const check = usePracticeCheck({ api, track, mode: checkMode, muteSong })

  // Speed trainer: after each loop pass, speed up if the pass was clean
  useEffect(() => {
    onLoopPass.current = () => {
      if (!trainer.on) return
      const results = check.takePass()
      const acc = results ? accuracy(results) : null
      const next = nextTrainerSpeed(speed, acc, { step: 0.05, target: trainer.target, cleanAt: 0.9 })
      const passNo = trainer.passes + 1
      const verdict =
        acc === null
          ? `Pass ${passNo} done`
          : `Pass ${passNo}: ${Math.round(acc * 100)}% of notes right`
      const message =
        next > speed
          ? `${verdict}, speeding up to ${Math.round(next * 100)}%`
          : speed >= trainer.target
            ? `${verdict}. You're at the target speed.`
            : `${verdict}, staying at ${Math.round(speed * 100)}% (90% needed to speed up)`
      setTrainer((t) => ({ ...t, passes: passNo, message }))
      if (next !== speed) updateSettings((s) => ({ ...s, speed: next }))
    }
  }, [trainer, speed, check, updateSettings])

  // Practice log: count the time the song is playing (saved every 15 s and on pause)
  const logInfo = useRef({ title: song.title, speed, accuracy: undefined as number | undefined })
  useEffect(() => {
    const all = check.judged.map((j) => j.result)
    logInfo.current = {
      title: score?.title || song.title,
      speed,
      accuracy: checkMode === 'play-along' && all.length >= 8 ? accuracy(all) : undefined,
    }
  }, [score, song.title, speed, check.judged, checkMode])
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const flush = () => {
      const now = performance.now()
      const seconds = Math.round((now - last) / 1000)
      if (seconds <= 0) return
      last = now
      void logPractice({ songId: song.id, ...logInfo.current, seconds })
    }
    const interval = window.setInterval(flush, 15000)
    return () => {
      window.clearInterval(interval)
      flush()
    }
  }, [playing, song.id])

  // Keyboard: Space play/pause, Up/Down speed, L loop. Only while this page is on screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!scrollEl.current?.offsetParent || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest('input, select, textarea, [contenteditable="true"]')) return
      const step = (d: number) =>
        updateSettings((s) => ({ ...s, speed: Math.round(Math.min(1.5, Math.max(0.25, s.speed + d)) * 100) / 100 }))
      if (e.code === 'Space') apiRef.current?.playPause()
      else if (e.key === 'ArrowUp') step(0.05)
      else if (e.key === 'ArrowDown') step(-0.05)
      else if (e.key === 'l' || e.key === 'L') setLoop((l) => ({ ...l, on: !l.on }))
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [updateSettings])

  const startTrainer = () => {
    setLoop((l) => ({ ...l, on: true }))
    updateSettings((s) => ({ ...s, speed: 0.6 }))
    check.takePass()
    setTrainer((t) => ({ ...t, on: true, passes: 0, message: 'Starting at 60%. Play the loop; each clean pass adds 5%.' }))
  }

  // Coloured rings on the fretboard for notes just judged, or played while waiting
  const marks: FretMark[] = check.waiting
    ? check.waiting.notes.map((n) => ({
        key: `w-${n.string}-${n.fret}`,
        string: n.string,
        fret: n.fret,
        result: check.waiting!.played.includes(n.midi) ? 'hit' : 'waiting',
      }))
    : check.judged.slice(-12).map((j) => ({ key: `${j.key}-${j.at}`, string: j.string, fret: j.fret, result: j.result, fade: true }))

  const saveLoop = () => {
    const name = window.prompt('Name this section', `Bars ${loop.start} to ${loop.end}`)
    if (!name) return
    updateSettings((s) => ({ ...s, loops: [...s.loops, { id: newId(), name, startBar: loop.start, endBar: loop.end }] }))
  }

  return (
    <div className="practice">
      <div className="song-head">
        <div className="song-head-art" aria-hidden="true">
          <SongCover id={song.id} dots={false} />
        </div>
        <div className="song-head-text">
          <p className="eyebrow">{song.kind === 'study' ? 'Fingerstyle study' : song.builtIn ? 'Free song' : 'Your song'}</p>
          <h1>{score?.title || song.title}</h1>
          <div className="song-meta">
            {score?.artist && <span>{score.artist}</span>}
            {staff && (
              <span>
                Tuning {[...tuning].reverse().map((m) => noteName(m).replace(/\d/, '')).join(' ')}
              </span>
            )}
            {capo > 0 && <span>Capo {capo}</span>}
            {score && <span>{score.tempo} BPM</span>}
            {score && <span>{barCount} bars</span>}
          </div>
        </div>
        {score && score.tracks.length > 1 && (
          <label className="field">
            Track
            <select value={trackIndex} onChange={(e) => updateSettings((s) => ({ ...s, trackIndex: Number(e.target.value) }))}>
              {score.tracks.map((t) => (
                <option key={t.index} value={t.index}>
                  {t.name || `Track ${t.index + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="fretboard-wrap" ref={fretboardWrapEl}>
        <div className={`fretboard-row${view.hand3d !== false ? ' with-hand' : ''}`}>
        <Fretboard
          notes={notes}
          ghosts={ghosts}
          tuning={tuning}
          capo={capo}
          options={view}
          onNoteClick={(note, anchor) => setEditing({ note, anchor })}
          onFretClick={(_string, _fret, midi) => playTone(midi)}
          marks={marks}
          maxFret={fretsShown}
          shape={view.showShape === false ? [] : shape}
          handPosition={view.showShape === false ? null : position}
        />
        {view.hand3d !== false && (
          <Suspense fallback={<div className="hand-panel" />}>
            <HandPanel
              notes={notes}
              shape={grip}
              handPosition={position}
              layout={{ strings: tuning.length, leftHanded: view.leftHanded, stringOrder: view.stringOrder }}
            />
          </Suspense>
        )}
        </div>
        <div className="rotate-hint">Turn your phone sideways for a bigger fretboard.</div>
        <div className="legend-row">
          <span className="legend-hint">
            <span className="tap-word">Tap</span><span className="click-word">Click</span> a note to change its fingering, or an empty fret to hear it. <span className="keys">Keys: Space play, ↑↓ speed, L loop</span>
          </span>
          <button className="legend-toggle" aria-label="What the colours mean" aria-expanded={showLegend} onClick={() => setShowLegend(!showLegend)} title="What the colours mean">
            ?
          </button>
        </div>
        {showLegend && (
          <div className="legend">
            <span className="legend-item"><i className="dot fb-finger-1" />1 index</span>
            <span className="legend-item"><i className="dot fb-finger-2" />2 middle</span>
            <span className="legend-item"><i className="dot fb-finger-3" />3 ring</span>
            <span className="legend-item"><i className="dot fb-finger-4" />4 little</span>
            <span className="legend-item"><i className="dot dashed" />suggested by the app</span>
            <span className="legend-item"><i className="dot ghost" />coming next</span>
            <span className="legend-item"><i className="dot shape" />rest of the bar's hand shape</span>
            <span className="legend-item">Picking hand: p thumb, i index, m middle, a ring</span>
          </div>
        )}
      </div>

      <div className="player-bar" ref={playerBarEl}>
        <button
          className="pb-play"
          disabled={!ready}
          onClick={() => apiRef.current?.playPause()}
          aria-label={playing ? 'Pause' : 'Play'}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={24} />
        </button>
        <button className="pb-icon-btn" disabled={!ready} onClick={() => apiRef.current?.stop()} aria-label="Back to the start" title="Back to the start">
          <Icon name="restart" />
        </button>
        {ready && playing && audioBlocked && (
          <button className="pb-sound-off" onClick={resumeAudio} title="The browser paused the sound">
            Sound is off. Click to turn it on
          </button>
        )}
        {!ready && <span className="pb-loading">{loadingSound > 0 && loadingSound < 100 ? `Loading sound ${loadingSound}%` : 'Loading…'}</span>}
        <span className="time">{formatTime(time.current)}</span>
        <ProgressLine
          barTicks={barTicks}
          tick={time.tick}
          loop={loop}
          onSeekBar={(bar) => {
            const api = apiRef.current
            if (api && barTicks[bar - 1] !== undefined) api.tickPosition = barTicks[bar - 1]
          }}
          onLoopBars={(start, end) => setLoop({ on: true, start, end })}
        />
        <span className="time">{formatTime(time.end)}</span>

        <div className="pb-group">
          <Menu
            label="Speed"
            trigger={
              <>
                <Icon name="speed" />
                <span className="pb-pill-label">Speed {Math.round(speed * 100)}%</span>
              </>
            }
          >
            <label className="field speed">
              Speed {Math.round(speed * 100)}%
              <input
                type="range"
                min={0.25}
                max={1.5}
                step={0.05}
                value={speed}
                onChange={(e) => updateSettings((s) => ({ ...s, speed: Number(e.target.value) }))}
              />
            </label>
            <div className="row">
              {[0.5, 0.75, 1].map((v) => (
                <button key={v} className={speed === v ? 'chip active' : 'chip'} onClick={() => updateSettings((s) => ({ ...s, speed: v }))}>
                  {v * 100}%
                </button>
              ))}
            </div>
            <p className="hint">Keys: ↑ and ↓ change the speed by 5%.</p>
          </Menu>

          <TogglePill
            on={loop.on}
            icon="loop"
            label={loop.start === loop.end ? `Loop bar ${loop.start}` : `Loop bars ${loop.start}–${loop.end}`}
            title="Repeat these bars (L). Drag across the progress line to pick bars."
            onToggle={() => setLoop({ ...loop, on: !loop.on })}
            menuLabel="Choose the bars to loop"
          >
            <div className="row">
              Bars
              <input
                className="bar-input"
                type="number"
                min={1}
                max={barCount || 1}
                value={loop.start}
                aria-label="Loop start bar"
                onChange={(e) => {
                  const start = Math.max(1, Number(e.target.value))
                  setLoop({ ...loop, start, end: Math.max(start, loop.end) })
                }}
              />
              to
              <input
                className="bar-input"
                type="number"
                min={loop.start}
                max={barCount || 1}
                value={loop.end}
                aria-label="Loop end bar"
                onChange={(e) => setLoop({ ...loop, end: Math.max(loop.start, Number(e.target.value)) })}
              />
            </div>
            <button className="chip" onClick={saveLoop} disabled={!score}>
              Save as a section
            </button>
            <p className="hint">Tip: drag across the progress line to pick bars.</p>
          </TogglePill>

          <TogglePill
            on={metronome}
            icon="metronome"
            label="Metronome"
            title="Tick on every beat while the song plays"
            onToggle={() => setMetronome(!metronome)}
            menuLabel="Metronome options"
            extra={metronome && <BeatLights count={beatInfo.count} current={playing ? beatInfo.index : null} />}
          >
            <label className="check">
              <input type="checkbox" checked={countIn} onChange={(e) => setCountIn(e.target.checked)} /> Count in one bar before the song starts
            </label>
            <p className="hint">The metronome ticks on every beat while the song plays. Check me and Wait for me turn it on.</p>
          </TogglePill>

          <Menu
            label="Listen while I play"
            trigger={
              <>
                <Icon name="mic" />
                <span className="pb-pill-label">{checkMode === 'play-along' ? 'Check me' : checkMode === 'wait' ? 'Wait for me' : 'Listen'}</span>
              </>
            }
          >
            <ListenMenu
        mode={checkMode}
        onModeChange={(m) => {
          setCheckMode(m)
          if (m !== 'off') setMetronome(true)
        }}
        muteSong={muteSong}
        onMuteSongChange={setMuteSong}
        listening={check.listening}
        error={check.error}
        judged={check.judged}
        waiting={check.waiting}
        onSkip={check.skipWait}
        onClear={check.clearResults}
        barCount={barCount}
        onBarClick={(bar) => setLoop({ on: true, start: bar, end: bar })}
        trainer={trainer}
        onStartTrainer={startTrainer}
        onStopTrainer={() => setTrainer((t) => ({ ...t, on: false, message: null }))}
        onTargetChange={(target) => setTrainer((t) => ({ ...t, target }))}
        speed={speed}
            />
          </Menu>
        </div>
      </div>

      <CheckPanel
        mode={checkMode}
        onModeChange={(m) => {
          setCheckMode(m)
          if (m !== 'off') setMetronome(true)
        }}
        muteSong={muteSong}
        onMuteSongChange={setMuteSong}
        listening={check.listening}
        error={check.error}
        judged={check.judged}
        waiting={check.waiting}
        onSkip={check.skipWait}
        onClear={check.clearResults}
        barCount={barCount}
        onBarClick={(bar) => setLoop({ on: true, start: bar, end: bar })}
        trainer={trainer}
        onStartTrainer={startTrainer}
        onStopTrainer={() => setTrainer((t) => ({ ...t, on: false, message: null }))}
        onTargetChange={(target) => setTrainer((t) => ({ ...t, target }))}
        speed={speed}
      />

      {settings && settings.loops.length > 0 && (
        <div className="sections">
          <span className="sections-label">Sections</span>
          {settings.loops.map((l) => (
            <span key={l.id} className="section-chip">
              <button
                className={loop.on && loop.start === l.startBar && loop.end === l.endBar ? 'chip active' : 'chip'}
                onClick={() => setLoop({ on: true, start: l.startBar, end: l.endBar })}
              >
                {l.name} <small>bars {l.startBar} to {l.endBar}</small>
              </button>
              <button
                className="icon"
                aria-label={`Delete section ${l.name}`}
                onClick={() => updateSettings((s) => ({ ...s, loops: s.loops.filter((x) => x.id !== l.id) }))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <details className="view-options">
        <summary>View options</summary>
        <div className="view-options-body">
          <label className="field">
            Dots show
            <select value={view.labelMode} onChange={(e) => setView({ ...view, labelMode: e.target.value as FretboardOptions['labelMode'] })}>
              <option value="finger">Finger numbers</option>
              <option value="note">Note names</option>
            </select>
          </label>
          <label className="field">
            Strings
            <select value={view.stringOrder} onChange={(e) => setView({ ...view, stringOrder: e.target.value as FretboardOptions['stringOrder'] })}>
              <option value="player">Low E on top (looking down at your guitar)</option>
              <option value="tab">High e on top (like tab)</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={view.leftHanded} onChange={(e) => setView({ ...view, leftHanded: e.target.checked })} /> Left-handed
          </label>
          <label className="field">
            Fretboard
            <select value={view.zoom ?? 'song'} onChange={(e) => setView({ zoom: e.target.value as 'song' | 'neck' })}>
              <option value="song">Zoom to the frets this song uses</option>
              <option value="neck">Show the first 15 frets</option>
            </select>
          </label>
          <label className="field">
            Guitar sound
            <select value={view.sound ?? 'steel'} onChange={(e) => setView({ sound: e.target.value as GuitarSound })}>
              <option value="steel">Steel-string acoustic</option>
              <option value="nylon">Nylon-string classical</option>
              <option value="steel-dry">Steel-string, close and dry</option>
              <option value="nylon-dry">Nylon-string, close and dry</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={view.hand3d !== false} onChange={(e) => setView({ hand3d: e.target.checked })} /> Show the 3D hand
          </label>
          <label className="check">
            <input type="checkbox" checked={view.showShape !== false} onChange={(e) => setView({ showShape: e.target.checked })} /> Show the hand shape for the bar
          </label>
          <label className="check">
            <input type="checkbox" checked={view.showGhosts} onChange={(e) => setView({ ...view, showGhosts: e.target.checked })} /> Show next notes
          </label>
          <label className="field">
            Notation
            <select value={staveProfile} onChange={(e) => setStaveProfile(e.target.value as 'tab' | 'both')}>
              <option value="both">Standard notation and tab</option>
              <option value="tab">Tab only</option>
            </select>
          </label>
        </div>
      </details>

      {error && <div className="error">This file could not be opened: {error}</div>}

      <div className="score-scroll" ref={scrollEl}>
        <div ref={scoreEl} />
      </div>

      <div className={`mini-player${barVisible ? ' mini-hidden' : ''}`} aria-hidden={barVisible} role="region" aria-label="Player">
        <button
          className="pb-play"
          disabled={!ready}
          tabIndex={barVisible ? -1 : 0}
          onClick={() => apiRef.current?.playPause()}
          aria-label={playing ? 'Pause' : 'Play'}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={22} />
        </button>
        <button
          className="pb-icon-btn"
          disabled={!ready}
          tabIndex={barVisible ? -1 : 0}
          onClick={() => apiRef.current?.stop()}
          aria-label="Back to the start"
          title="Back to the start"
        >
          <Icon name="restart" />
        </button>
        {ready && playing && audioBlocked ? (
          <button className="pb-sound-off" onClick={resumeAudio} tabIndex={barVisible ? -1 : 0}>
            Sound is off. Tap to turn it on
          </button>
        ) : (
          <>
            <ProgressLine
              barTicks={barTicks}
              tick={time.tick}
              loop={loop}
              onSeekBar={(bar) => {
                const api = apiRef.current
                if (api && barTicks[bar - 1] !== undefined) api.tickPosition = barTicks[bar - 1]
              }}
              onLoopBars={(start, end) => setLoop({ on: true, start, end })}
            />
            <span className="time">{formatTime(time.current)}</span>
          </>
        )}
        <span className="mini-speed" title="Speed">{Math.round(speed * 100)}%</span>
      </div>

      {finished && (
        <SongComplete
          songId={song.id}
          title={score?.title || song.title}
          speed={speed}
          onAgain={() => {
            setFinished(false)
            apiRef.current?.play()
          }}
          onFaster={
            speed < 1.5
              ? () => {
                  updateSettings((s) => ({ ...s, speed: Math.min(1.5, Math.round((s.speed + 0.1) * 100) / 100) }))
                  setFinished(false)
                  window.setTimeout(() => apiRef.current?.play(), 100)
                }
              : undefined
          }
          onClose={() => setFinished(false)}
        />
      )}

      {editing && (
        <FingerEditor
          note={notes.find((n) => n.key === editing.note.key) ?? editing.note}
          anchor={editing.anchor}
          onChange={(o) => setOverride(editing.note, o)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
