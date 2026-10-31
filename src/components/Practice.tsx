import * as alphaTab from '@coderline/alphatab'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyFingering } from '../music/fingering'
import { noteName } from '../music/notes'
import type { FingeringOverride, FretNote } from '../music/types'
import { loadSettings, newId, saveSettings, type SongSettings } from '../library/db'
import type { OpenSong } from '../library/songs'
import { beatToFretNotes, nextSoundingBeat } from '../player/alphaTabAdapter'
import { Fretboard, type FretboardOptions } from './Fretboard'
import { FingerEditor } from './FingerEditor'
import { CheckPanel } from './CheckPanel'
import { accuracy, nextTrainerSpeed } from '../check/noteCheck'
import { usePracticeCheck, type CheckMode } from '../check/usePracticeCheck'
import type { FretMark } from './Fretboard'
import { setView, useFretboardView } from './fretboardView'

type Beat = alphaTab.model.Beat
type Score = alphaTab.model.Score

const BASE = import.meta.env.BASE_URL

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface Props {
  song: OpenSong
}

/**
 * Fretted notes played earlier in the same bar on strings that are not sounding now.
 * In fingerstyle the hand usually keeps holding the chord shape, so these show it.
 */
function heldNotes(active: Beat[], soundingStrings: Set<number>): FretNote[] {
  const byString = new Map<number, FretNote>()
  for (const beat of active) {
    const bar = beat.voice.bar
    const before = bar.voices
      .flatMap((v) => v.beats)
      .filter((b) => b.playbackStart < beat.playbackStart)
      .sort((a, b) => a.playbackStart - b.playbackStart)
    for (const b of before) {
      for (const n of beatToFretNotes(b)) {
        if (soundingStrings.has(n.string)) continue
        if (n.tabFret > 0 && !n.isDead) byString.set(n.string, { ...n, isHeld: true })
        else byString.delete(n.string)
      }
    }
  }
  return [...byString.values()]
}

export function Practice({ song }: Props) {
  const scoreEl = useRef<HTMLDivElement>(null)
  const scrollEl = useRef<HTMLDivElement>(null)
  const apiRef = useRef<alphaTab.AlphaTabApi | null>(null)
  const [api, setApi] = useState<alphaTab.AlphaTabApi | null>(null)
  const lastTick = useRef(0)
  const onLoopPass = useRef<() => void>(() => {})

  const [score, setScore] = useState<Score | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingSound, setLoadingSound] = useState(0)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState({ current: 0, end: 0 })
  const [activeBeats, setActiveBeats] = useState<Beat[]>([])
  const [settings, setSettings] = useState<SongSettings | null>(null)
  const view = useFretboardView()
  const [staveProfile, setStaveProfile] = useState<'tab' | 'both'>('both')
  const [metronome, setMetronome] = useState(false)
  const [countIn, setCountIn] = useState(false)
  const [loop, setLoop] = useState<{ on: boolean; start: number; end: number }>({ on: false, start: 1, end: 4 })
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
        soundFont: `${BASE}soundfont/sonivox.sf2`,
        scrollElement: scrollEl.current,
        scrollOffsetY: -40,
      },
    } as unknown as alphaTab.Settings)
    apiRef.current = api
    setApi(api)

    api.scoreLoaded.on((s) => {
      setScore(s)
      setError(null)
      setLoop((l) => ({ ...l, start: 1, end: Math.min(4, s.masterBars.length) }))
    })
    api.error.on((e) => setError(e.message ?? String(e)))
    api.soundFontLoad.on((e) => setLoadingSound(Math.round((e.loaded / Math.max(1, e.total)) * 100)))
    api.playerReady.on(() => setReady(true))
    api.playerStateChanged.on((e) => setPlaying(e.state === alphaTab.synth.PlayerState.Playing))
    api.playerPositionChanged.on((e) => {
      setTime((t) => (Math.abs(t.current - e.currentTime) > 200 || t.end !== e.endTime ? { current: e.currentTime, end: e.endTime } : t))
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
  const { notes, ghosts } = useMemo(() => {
    const beats = activeBeats.filter((b) => !track || b.voice.bar.staff.track === track)
    const raw = beats.flatMap(beatToFretNotes)
    const stringCount = staff?.tuning.length ?? 6
    // Where the hand was on the previous beat, so the suggestion doesn't jump around
    const previous = beats
      .map((b) => b.previousBeat)
      .filter((b): b is Beat => b !== null && b.notes.length > 0)
      .flatMap(beatToFretNotes)
    const before = applyFingering(previous, stringCount, null, overrides).position
    const result = applyFingering(raw, stringCount, before, overrides)
    const nextRaw = beats
      .map(nextSoundingBeat)
      .filter((b): b is Beat => b !== null)
      .flatMap(beatToFretNotes)
    const current = new Set(result.notes.map((n) => `${n.string}:${n.fret}`))
    const held = heldNotes(beats, new Set(result.notes.map((n) => n.string)))
    const heldFingered = applyFingering(held, stringCount, result.position, overrides).notes
    return {
      notes: [...heldFingered, ...result.notes],
      ghosts: nextRaw.filter((n) => !current.has(`${n.string}:${n.fret}`)),
    }
  }, [activeBeats, track, staff, overrides])

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
  const speed = settings?.speed ?? 1
  const tuning = staff?.tuning ?? [64, 59, 55, 50, 45, 40]
  const capo = staff?.capo ?? 0

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
        <div>
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

      <div className="fretboard-wrap">
        <Fretboard
          notes={notes}
          ghosts={ghosts}
          tuning={tuning}
          capo={capo}
          options={view}
          onNoteClick={(note, anchor) => setEditing({ note, anchor })}
          marks={marks}
        />
        <div className="rotate-hint">Turn your phone sideways for a bigger fretboard.</div>
        <div className="legend">
          <span className="legend-item"><i className="dot fb-finger-1" />1 index</span>
          <span className="legend-item"><i className="dot fb-finger-2" />2 middle</span>
          <span className="legend-item"><i className="dot fb-finger-3" />3 ring</span>
          <span className="legend-item"><i className="dot fb-finger-4" />4 little</span>
          <span className="legend-item"><i className="dot dashed" />suggested by the app</span>
          <span className="legend-item"><i className="dot ghost" />coming next</span>
          <span className="legend-hint">Click a note to change its fingering.</span>
        </div>
      </div>

      <div className="transport">
        <div className="transport-group">
          <button className="primary" disabled={!ready} onClick={() => apiRef.current?.playPause()}>
            {!ready ? (loadingSound > 0 && loadingSound < 100 ? `Loading sound ${loadingSound}%` : 'Loading…') : playing ? 'Pause' : 'Play'}
          </button>
          <button disabled={!ready} onClick={() => apiRef.current?.stop()}>
            Stop
          </button>
          <span className="time">
            {formatTime(time.current)} / {formatTime(time.end)}
          </span>
        </div>

        <div className="transport-group">
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
          {[0.5, 0.75, 1].map((v) => (
            <button key={v} className={speed === v ? 'chip active' : 'chip'} onClick={() => updateSettings((s) => ({ ...s, speed: v }))}>
              {v * 100}%
            </button>
          ))}
        </div>

        <div className="transport-group">
          <label className="check">
            <input type="checkbox" checked={loop.on} onChange={(e) => setLoop({ ...loop, on: e.target.checked })} /> Loop bars
          </label>
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
          <button className="chip" onClick={saveLoop} disabled={!score}>
            Save section
          </button>
        </div>

        <div className="transport-group">
          <label className="check">
            <input type="checkbox" checked={metronome} onChange={(e) => setMetronome(e.target.checked)} /> Click
          </label>
          <label className="check">
            <input type="checkbox" checked={countIn} onChange={(e) => setCountIn(e.target.checked)} /> Count-in
          </label>
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
