import { useCallback, useEffect, useRef, useState } from 'react'
import { listenForPitch, micErrorMessage, playChime, playTone, type PitchListener } from '../audio/pitch'
import { Fretboard, type FretMark } from '../components/Fretboard'
import { setView, useFretboardView } from '../components/fretboardView'
import { noteName, pitchClassName, TUNINGS } from '../music/notes'
import type { FretNote } from '../music/types'
import { localDate } from '../progress/practiceLog'
import {
  checkAnswer,
  dayStreak,
  isUnlocked,
  LEVELS,
  nextQuestion,
  NoteEvents,
  questionText,
  registerName,
  ROUND,
  spots,
  starsFor,
  type Level,
  type Question,
  type QuizMode,
  type QuizSettings,
} from './quiz'

type Phase = 'idle' | 'prompt' | 'listening' | 'right' | 'timeout' | 'summary'
type Tab = 'path' | 'free'

interface Stats {
  asked: number
  correct: number
  streak: number
  best: number
  /** misses per note key (pitch class for find-note, MIDI otherwise) */
  misses: Record<number, number>
}

/** Results for one spot on the neck or one note name. */
interface Tally {
  n: number
  ok: number
  /** Total answer time of the right answers, in ms. */
  ms: number
}

interface RoundResult {
  label: string
  ok: boolean
  ms: number | null
}

interface Round {
  level: Level | null
  /** 0 = keep going until stopped. */
  total: number
  results: RoundResult[]
  streak: number
  best: number
}

const EMPTY_STATS: Stats = { asked: 0, correct: 0, streak: 0, best: 0, misses: {} }

const MODES: { id: QuizMode; label: string; hint: string }[] = [
  { id: 'find-note', label: 'Find the note', hint: 'The app names a note, you play it anywhere on the neck.' },
  { id: 'find-on-string', label: 'Note on a string', hint: 'The app names a note and a string. Play exactly that spot.' },
  { id: 'find-all', label: 'Every octave', hint: 'The app names a note. Play it in every octave you can reach.' },
  { id: 'ear', label: 'Ear training', hint: 'The app plays a note. Find it on your guitar by ear.' },
  { id: 'melody', label: 'Echo a melody', hint: 'The app plays a short phrase. Play it back, note by note.' },
]

const RANGES = [
  { label: 'Frets 0 to 5', min: 0, max: 5 },
  { label: 'Frets 0 to 12', min: 0, max: 12 },
  { label: 'Frets 5 to 12', min: 5, max: 12 },
  { label: 'Frets 0 to 7', min: 0, max: 7 },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const v = JSON.parse(raw)
    return (Array.isArray(fallback) ? (Array.isArray(v) ? v : fallback) : { ...fallback, ...v }) as T
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage may be unavailable */
  }
}

interface Prefs {
  tab: Tab
  mode: QuizMode
  tuningId: string
  strings: number[]
  range: number
  naturalsOnly: boolean
  seconds: number
  roundLength: number
  sounds: boolean
}

const DEFAULT_PREFS: Prefs = {
  tab: 'path',
  mode: 'find-note',
  tuningId: 'standard',
  strings: [1, 2, 3, 4, 5, 6],
  range: 0,
  naturalsOnly: true,
  seconds: 5,
  roundLength: 10,
  sounds: true,
}

const CONFETTI = ['#ff7a45', '#ff4f7b', '#fbbf24', '#2dd4bf', '#a78bfa', '#7cc4ff']
const NOTE_GAP_MS = 650

function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span className="stars" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" className={i < n ? 'star on' : 'star'} aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
        </svg>
      ))}
    </span>
  )
}

function Flame() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 0 2 1 3 2 3 0-3-1.5-5 .5-9z" fill="currentColor" />
    </svg>
  )
}

const avg = (t: Tally | undefined) => (t && t.ok ? t.ms / t.ok : 0)

/** Note-finding and ear-training quiz checked with the microphone. */
export function NoteQuiz() {
  const [prefs, setPrefs] = useState<Prefs>(() => load('quiz-prefs', DEFAULT_PREFS))
  const [stats, setStats] = useState<Stats>(() => load(`quiz-stats-${prefs.mode}`, EMPTY_STATS))
  const [pathStars, setPathStars] = useState<Record<string, number>>(() => load('quiz-path', {}))
  const [neck, setNeck] = useState<Record<string, Tally>>(() => load('quiz-neck', {}))
  const [noteTally, setNoteTally] = useState<Record<string, Tally>>(() => load('quiz-notes', {}))
  const [days, setDays] = useState<string[]>(() => load('quiz-days', [] as string[]))
  const [phase, setPhase] = useState<Phase>('idle')
  const [question, setQuestion] = useState<Question | null>(null)
  const [round, setRound] = useState<Round | null>(null)
  const [found, setFound] = useState<number[]>([])
  const [heard, setHeard] = useState<number | null>(null)
  const [live, setLive] = useState<number | null>(null)
  const [wrongTries, setWrongTries] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [answerMs, setAnswerMs] = useState<number | null>(null)
  const view = useFretboardView()

  const listener = useRef<PitchListener | null>(null)
  const events = useRef(new NoteEvents(6))
  const L = useRef({
    question: null as Question | null,
    phase: 'idle' as Phase,
    startedAt: 0,
    ignoreUntil: 0,
    wrong: [] as number[],
    found: [] as number[],
    live: null as number | null,
    quiet: 0,
  })
  const timers = useRef<number[]>([])
  const askRef = useRef<() => void>(() => {})
  const roundRef = useRef<Round | null>(null)

  const tuning = TUNINGS.find((t) => t.id === prefs.tuningId) ?? TUNINGS[0]
  const range = RANGES[prefs.range] ?? RANGES[0]
  const freeSettings: QuizSettings = {
    mode: prefs.mode,
    tuning: tuning.strings,
    strings: prefs.strings,
    minFret: range.min,
    maxFret: range.max,
    naturalsOnly: prefs.naturalsOnly,
    seconds: prefs.mode === 'find-all' ? prefs.seconds * 4 : prefs.mode === 'melody' ? prefs.seconds * 3 : prefs.seconds,
    phraseLength: 3,
  }
  const settings: QuizSettings = round?.level ? { ...round.level.settings, tuning: tuning.strings } : freeSettings
  const settingsRef = useRef(settings)
  const statsRef = useRef(stats)
  const soundsRef = useRef(prefs.sounds)
  useEffect(() => {
    settingsRef.current = settings
    statsRef.current = stats
    soundsRef.current = prefs.sounds
    roundRef.current = round
  })

  useEffect(() => save('quiz-prefs', prefs), [prefs])
  useEffect(() => save(`quiz-stats-${prefs.mode}`, stats), [stats, prefs.mode])
  useEffect(() => save('quiz-path', pathStars), [pathStars])
  useEffect(() => save('quiz-neck', neck), [neck])
  useEffect(() => save('quiz-notes', noteTally), [noteTally])
  useEffect(() => save('quiz-days', days), [days])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const setLivePhase = (p: Phase) => {
    L.current.phase = p
    setPhase(p)
  }

  const playPhrase = (notes: number[]) => notes.forEach((m, i) => later(() => playTone(m, 1.1), i * NOTE_GAP_MS))

  const stopMic = () => {
    listener.current?.stop()
    listener.current = null
  }

  const finish = useCallback((correct: boolean) => {
    const q = L.current.question
    if (!q || (L.current.phase !== 'listening' && L.current.phase !== 'prompt')) return
    clearTimers()
    const firstTry = correct && L.current.wrong.length === 0
    const ms = correct ? Math.round(performance.now() - L.current.startedAt) : null
    setAnswerMs(ms)
    const key = q.mode === 'find-note' || q.mode === 'find-all' ? q.midi % 12 : q.midi
    // lifetime stats and the "asked more often" weights belong to free practice
    if (!roundRef.current?.level) setStats((s) => {
      const misses = { ...s.misses }
      if (firstTry) misses[key] = Math.max(0, (misses[key] ?? 0) - 1)
      else misses[key] = (misses[key] ?? 0) + 1
      const streak = firstTry ? s.streak + 1 : 0
      return { asked: s.asked + 1, correct: s.correct + (firstTry ? 1 : 0), streak, best: Math.max(s.best, streak), misses }
    })
    const add = (t: Tally | undefined): Tally => ({
      n: (t?.n ?? 0) + 1,
      ok: (t?.ok ?? 0) + (firstTry ? 1 : 0),
      ms: (t?.ms ?? 0) + (firstTry && ms ? ms : 0),
    })
    if (q.mode !== 'melody') {
      const pc = String(q.midi % 12)
      setNoteTally((n) => ({ ...n, [pc]: add(n[pc]) }))
    }
    if (q.mode === 'find-on-string') {
      const spot = `${q.positions[0].string}:${q.positions[0].fret}`
      setNeck((n) => ({ ...n, [spot]: add(n[spot]) }))
    }
    const today = localDate()
    setDays((d) => (d.includes(today) ? d : [...d.slice(-60), today]))
    const label =
      q.mode === 'melody'
        ? q.targets.map(pitchClassName).join(' ')
        : q.mode === 'find-on-string'
          ? `${pitchClassName(q.midi)} on ${q.string}`
          : q.mode === 'find-note' || q.mode === 'find-all'
            ? pitchClassName(q.midi)
            : noteName(q.midi)
    const r = roundRef.current
    if (r) {
      const streak = firstTry ? r.streak + 1 : 0
      const next = { ...r, results: [...r.results, { label, ok: firstTry, ms }], streak, best: Math.max(r.best, streak) }
      roundRef.current = next
      setRound(next)
    }
    if (soundsRef.current) {
      if (correct) playChime(firstTry ? 'right' : 'late')
      else if (q.mode === 'melody') later(() => playPhrase(q.targets), 400)
      else later(() => playTone(q.midi), 300)
    }
    setLivePhase(correct ? 'right' : 'timeout')
    later(() => askRef.current(), correct ? 1500 : q.mode === 'melody' ? 4000 : 3000)
  }, [])

  const ask = useCallback(() => {
    clearTimers()
    const r = roundRef.current
    if (r && r.total > 0 && r.results.length >= r.total) {
      stopMic()
      setLivePhase('summary')
      const level = r.level
      if (level) {
        const stars = starsFor(r.results.filter((x) => x.ok).length, r.total)
        setPathStars((p) => ({ ...p, [level.id]: Math.max(p[level.id] ?? 0, stars) }))
      }
      return
    }
    const q = nextQuestion(settingsRef.current, Math.random, statsRef.current.misses, L.current.question)
    if (!q) {
      setError('Pick at least one string and a fret range with notes in it.')
      return
    }
    events.current.reset()
    L.current.question = q
    L.current.wrong = []
    L.current.found = []
    setQuestion(q)
    setHeard(null)
    setFound([])
    setWrongTries([])
    setAnswerMs(null)
    let delay = 300
    if (q.mode === 'ear') {
      playTone(q.midi)
      delay = 1700
    } else if (q.mode === 'melody') {
      playPhrase(q.targets)
      delay = q.targets.length * NOTE_GAP_MS + 900
    }
    setLivePhase('prompt')
    L.current.ignoreUntil = performance.now() + delay
    later(() => {
      L.current.startedAt = performance.now()
      setLivePhase('listening')
      const seconds = settingsRef.current.seconds
      setTimeLeft(seconds)
      for (let i = 1; i <= seconds; i++) later(() => setTimeLeft(seconds - i), i * 1000)
      later(() => finish(false), seconds * 1000)
    }, delay)
  }, [finish])

  useEffect(() => {
    askRef.current = ask
  }, [ask])

  const onNote = (note: number) => {
    const S = L.current
    const q = S.question
    if (!q || S.phase !== 'listening') return
    setHeard(note)
    const wrong = () => {
      if (!S.wrong.includes(note)) {
        S.wrong = [...S.wrong, note]
        setWrongTries(S.wrong)
      }
    }
    if (q.mode === 'find-all') {
      if (!q.targets.includes(note)) return wrong()
      if (!S.found.includes(note)) {
        S.found = [...S.found, note]
        setFound(S.found)
        if (S.found.length === q.targets.length) finish(true)
      }
    } else if (q.mode === 'melody') {
      const expected = q.targets[S.found.length]
      if (note === expected) {
        S.found = [...S.found, note]
        setFound(S.found)
        if (S.found.length === q.targets.length) finish(true)
      } else if (note !== q.targets[S.found.length - 1]) wrong()
    } else if (checkAnswer(q, note).correct) finish(true)
    else wrong()
  }
  const onNoteRef = useRef(onNote)
  useEffect(() => {
    onNoteRef.current = onNote
  })

  const begin = async (level: Level | null) => {
    setError(null)
    const r: Round = { level, total: level ? ROUND : prefs.roundLength, results: [], streak: 0, best: 0 }
    roundRef.current = r
    setRound(r)
    settingsRef.current = level ? { ...level.settings, tuning: tuning.strings } : freeSettings
    L.current.question = null
    try {
      if (!listener.current) {
        listener.current = await listenForPitch((reading) => {
          const S = L.current
          // live "hearing" readout, only re-rendered when the note changes
          const rounded = reading ? Math.round(reading.midi) : null
          if (rounded === null) S.quiet++
          else S.quiet = 0
          const shown = rounded ?? (S.quiet > 8 ? null : S.live)
          if (shown !== S.live) {
            S.live = shown
            setLive(shown)
          }
          if (performance.now() < S.ignoreUntil) return
          const note = events.current.push(reading ? reading.midi : null)
          if (note !== null) onNoteRef.current(note)
        })
      }
      ask()
    } catch (e) {
      roundRef.current = null
      setRound(null)
      setError(micErrorMessage(e))
    }
  }

  const stop = () => {
    clearTimers()
    stopMic()
    L.current.question = null
    setQuestion(null)
    roundRef.current = null
    setRound(null)
    setLive(null)
    setLivePhase('idle')
  }

  const replay = () => {
    const q = L.current.question
    if (!q) return
    if (q.mode === 'melody') {
      playPhrase(q.targets)
      L.current.ignoreUntil = performance.now() + q.targets.length * NOTE_GAP_MS + 700
    } else {
      playTone(q.midi)
      L.current.ignoreUntil = performance.now() + 1500
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (L.current.phase === 'idle' || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'Escape') stop()
      if (e.key.toLowerCase() === 'r') replay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      listener.current?.stop()
    },
    [],
  )

  const running = phase !== 'idle' && phase !== 'summary'
  const reveal = phase === 'right' || phase === 'timeout'
  const toFretNote = (p: { string: number; fret: number }): FretNote => ({
    key: `${p.string}:${p.fret}`,
    string: p.string,
    fret: p.fret,
    tabFret: p.fret,
    midi: tuning.strings[p.string - 1] + p.fret,
    lh: null,
    rh: null,
    lhInferred: false,
    rhInferred: false,
  })
  const shownNotes: FretNote[] = question && reveal ? question.positions.map(toFretNote) : []
  const target = question?.mode === 'find-on-string' && !reveal && running ? [question.string!] : []

  // While finding every octave, ring the places of the octaves already played
  const foundMarks: FretMark[] =
    running && question?.mode === 'find-all' && !reveal
      ? question.positions
          .filter((p) => found.includes(tuning.strings[p.string - 1] + p.fret))
          .map((p) => ({ key: `f${p.string}:${p.fret}`, string: p.string, fret: p.fret, result: 'hit' as const }))
      : []

  // Neck map: how well each spot is known, from "note on a string" answers
  const neckMarks: FretMark[] = Object.entries(neck)
        .map(([k, t]) => {
          const [string, fret] = k.split(':').map(Number)
          const ratio = t.ok / t.n
          const result: FretMark['result'] = ratio >= 0.85 && avg(t) < 3500 ? 'hit' : ratio >= 0.5 ? 'late' : 'miss'
          return { key: `n${k}`, string, fret, result }
        })
        .filter((m) => m.fret <= 12 && m.string <= tuning.strings.length)

  const toggleString = (s: number) =>
    setPrefs((p) => ({ ...p, strings: p.strings.includes(s) ? p.strings.filter((x) => x !== s) : [...p.strings, s].sort() }))

  const pct = stats.asked ? Math.round((stats.correct / stats.asked) * 100) : 0
  const weakest = Object.entries(stats.misses)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => (prefs.mode === 'find-note' || prefs.mode === 'find-all' ? pitchClassName(Number(k)) : noteName(Number(k))))
  const available = spots(freeSettings).length
  const streakDays = dayStreak(days, localDate())
  const nextUp = LEVELS.findIndex((l, i) => isUnlocked(i, pathStars) && !(pathStars[l.id] > 0))
  const totalStars = LEVELS.reduce((a, l) => a + (pathStars[l.id] ?? 0), 0)
  const groups = [...new Set(LEVELS.map((l) => l.group))]
  const mode = round?.level?.settings.mode ?? prefs.mode

  const statusText = () => {
    if (!question) return ''
    if (phase === 'prompt') return question.mode === 'ear' || question.mode === 'melody' ? 'Listen…' : 'Get ready…'
    if (phase === 'listening') {
      const last = wrongTries.length ? wrongTries[wrongTries.length - 1] : null
      if (question.mode === 'find-all')
        return `${found.length} of ${question.targets.length} found${last !== null && heard === last ? `. ${noteName(last)} is not it` : ''}. ${timeLeft}s`
      if (question.mode === 'melody')
        return `Note ${Math.min(found.length + 1, question.targets.length)} of ${question.targets.length}${last !== null && heard === last ? `, ${noteName(last)} is not it` : ''}. ${timeLeft}s`
      return last !== null ? `That was ${noteName(last)}. Keep trying, ${timeLeft}s left` : `Listening… ${timeLeft}s`
    }
    if (phase === 'right') {
      const time = answerMs ? ` in ${(answerMs / 1000).toFixed(1)}s` : ''
      const extra = wrongTries.length ? ' (not first try)' : ''
      if (question.mode === 'melody') return `You got the melody${time}${extra}`
      if (question.mode === 'find-all') return `All ${question.targets.length} found${time}${extra}`
      return `Correct, ${noteName(heard ?? question.midi)}${time}${extra}`
    }
    if (phase === 'timeout') {
      if (question.mode === 'melody') return `It was ${question.targets.map(noteName).join(', ')}. Listen once more.`
      if (question.mode === 'find-all')
        return `Missing ${question.targets.filter((t) => !found.includes(t)).map(noteName).join(', ')}. All the places are shown below.`
      return `Time's up. It was ${question.mode === 'find-note' ? pitchClassName(question.midi) : noteName(question.midi)}, shown below.`
    }
    return ''
  }

  const summary = (() => {
    if (phase !== 'summary' || !round) return null
    const right = round.results.filter((r) => r.ok).length
    const times = round.results.filter((r) => r.ok && r.ms).map((r) => r.ms!)
    const stars = round.level ? starsFor(right, round.total) : 0
    const passed = round.level ? stars > 0 : right / Math.max(1, round.total) >= 0.8
    const missed = [...new Set(round.results.filter((r) => !r.ok).map((r) => r.label))]
    const levelIndex = round.level ? LEVELS.indexOf(round.level) : -1
    const next = levelIndex >= 0 ? LEVELS[levelIndex + 1] : undefined
    const nextOpen = next && isUnlocked(levelIndex + 1, { ...pathStars, [round.level!.id]: Math.max(stars, pathStars[round.level!.id] ?? 0) })
    return { right, times, stars, passed, missed, next: nextOpen ? next : undefined }
  })()

  return (
    <div className="quiz">
      <div className="quiz-head">
        <h1>Note finder</h1>
        {streakDays > 0 && (
          <span className="quiz-pill" title="Days in a row with at least one note">
            <Flame /> {streakDays}-day streak
          </span>
        )}
        {totalStars > 0 && (
          <span className="quiz-pill">
            <Stars n={1} of={1} /> {totalStars} of {LEVELS.length * 3}
          </span>
        )}
      </div>

      {phase === 'idle' && (
        <>
          <div className="segmented quiz-tabs" role="tablist">
            <button role="tab" aria-selected={prefs.tab === 'path'} className={prefs.tab === 'path' ? 'active' : ''} onClick={() => setPrefs({ ...prefs, tab: 'path' })}>
              Learn the neck
            </button>
            <button role="tab" aria-selected={prefs.tab === 'free'} className={prefs.tab === 'free' ? 'active' : ''} onClick={() => setPrefs({ ...prefs, tab: 'free' })}>
              Free practice
            </button>
          </div>

          {prefs.tab === 'path' && (
            <div className="quiz-path">
              <p className="hint">
                Short rounds of {ROUND} notes. Get 7 right on the first try to earn a star and open the next level. Uses your microphone, so play one note at a time, no capo.
              </p>
              {groups.map((g) => (
                <section key={g}>
                  <h2 className="quiz-group">{g}</h2>
                  <div className="level-grid">
                    {LEVELS.map((l, i) => {
                      if (l.group !== g) return null
                      const open = isUnlocked(i, pathStars)
                      return (
                        <button
                          key={l.id}
                          className={`level-card${open ? '' : ' locked'}${i === nextUp ? ' next' : ''}`}
                          disabled={!open}
                          onClick={() => void begin(l)}
                        >
                          <span className="level-num">{i + 1}</span>
                          <span className="level-title">{l.title}</span>
                          <span className="level-blurb">{open ? l.blurb : 'Earn a star on the level before to open this.'}</span>
                          <span className="level-foot">
                            <Stars n={pathStars[l.id] ?? 0} />
                            {i === nextUp && <span className="level-tag">Start here</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {prefs.tab === 'free' && (
            <div className="quiz-settings">
              <p className="hint">{MODES.find((m) => m.id === prefs.mode)?.hint}</p>
              <div className="row">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    className={prefs.mode === m.id ? 'chip active' : 'chip'}
                    onClick={() => {
                      setPrefs({ ...prefs, mode: m.id })
                      setStats(load(`quiz-stats-${m.id}`, EMPTY_STATS))
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="row">
                <span className="field-label">Strings</span>
                {[6, 5, 4, 3, 2, 1].map((s) => (
                  <button key={s} className={prefs.strings.includes(s) ? 'chip active' : 'chip'} onClick={() => toggleString(s)}>
                    {s} {pitchClassName(tuning.strings[s - 1])}
                  </button>
                ))}
              </div>
              <div className="row">
                <label className="field">
                  Frets
                  <select value={prefs.range} onChange={(e) => setPrefs({ ...prefs, range: Number(e.target.value) })}>
                    {RANGES.map((r, i) => (
                      <option key={r.label} value={i}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Time per note
                  <select value={prefs.seconds} onChange={(e) => setPrefs({ ...prefs, seconds: Number(e.target.value) })}>
                    {[3, 5, 8, 12].map((s) => (
                      <option key={s} value={s}>
                        {s} seconds
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Round
                  <select value={prefs.roundLength} onChange={(e) => setPrefs({ ...prefs, roundLength: Number(e.target.value) })}>
                    <option value={10}>10 notes</option>
                    <option value={20}>20 notes</option>
                    <option value={0}>Until I stop</option>
                  </select>
                </label>
                <label className="field">
                  Tuning
                  <select value={prefs.tuningId} onChange={(e) => setPrefs({ ...prefs, tuningId: e.target.value })}>
                    {TUNINGS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check">
                  <input type="checkbox" checked={prefs.naturalsOnly} onChange={(e) => setPrefs({ ...prefs, naturalsOnly: e.target.checked })} /> Natural notes only
                </label>
                <label className="check">
                  <input type="checkbox" checked={prefs.sounds} onChange={(e) => setPrefs({ ...prefs, sounds: e.target.checked })} /> Sounds
                </label>
                <label className="check">
                  <input type="checkbox" checked={view.leftHanded} onChange={(e) => setView({ ...view, leftHanded: e.target.checked })} /> Left-handed
                </label>
              </div>
              <div className="row">
                <button className="primary" onClick={() => void begin(null)} disabled={available === 0}>
                  Start
                </button>
                <span className="hint">Uses your microphone. No capo, and play one note at a time.</span>
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="error">{error}</div>}

      {running && round && (
        <div className="quiz-round">
          <span className="quiz-round-title">{round.level ? `Level ${LEVELS.indexOf(round.level) + 1}: ${round.level.title}` : MODES.find((m) => m.id === mode)?.label}</span>
          {round.total > 0 && (
            <div className="quiz-dots" aria-label={`Note ${Math.min(round.results.length + 1, round.total)} of ${round.total}`}>
              {Array.from({ length: round.total }, (_, i) => (
                <i key={i} className={i < round.results.length ? (round.results[i].ok ? 'ok' : 'bad') : i === round.results.length ? 'now' : ''} />
              ))}
            </div>
          )}
          {round.streak >= 2 && (
            <span className="quiz-pill hot">
              <Flame /> {round.streak} in a row
            </span>
          )}
        </div>
      )}

      {running && question && (
        <div className={`quiz-card is-${phase}`}>
          <div className="quiz-prompt">{questionText(question)}</div>
          {question.mode === 'find-all' && (
            <div className="quiz-targets">
              {question.targets.map((t) => (
                <span key={t} className={found.includes(t) ? 'found' : reveal ? 'missed' : ''}>
                  {found.includes(t) || reveal ? noteName(t) : `${registerName(t)} ${pitchClassName(t)}`}
                </span>
              ))}
            </div>
          )}
          {question.mode === 'melody' && (
            <div className="quiz-targets">
              {question.targets.map((t, i) => (
                <span key={i} className={i < found.length ? 'found' : reveal ? 'missed' : ''}>
                  {i < found.length || reveal ? noteName(t) : '?'}
                </span>
              ))}
            </div>
          )}
          <div className="quiz-status" role="status">
            {statusText()}
          </div>
          {phase === 'listening' && (
            <div className="quiz-timer">
              <div key={question.targets.join() + question.midi} className="quiz-timer-fill" style={{ animationDuration: `${settings.seconds}s` }} />
            </div>
          )}
          <div className="quiz-live" aria-hidden="true">
            <span className={live !== null ? 'on' : ''}>{live !== null ? `Hearing ${noteName(live)}` : 'Waiting for a note'}</span>
          </div>
          <div className="row">
            {(question.mode === 'ear' || question.mode === 'melody') && <button onClick={replay}>Play it again</button>}
            <button onClick={() => finish(false)} disabled={phase !== 'listening'}>
              Show me
            </button>
            <button onClick={stop}>Stop</button>
          </div>
        </div>
      )}

      {summary && round && (
        <div className={`quiz-summary${summary.passed ? ' passed' : ''}`}>
          {summary.passed && (
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 30 }, (_, i) => (
                <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.07}s`, background: CONFETTI[i % CONFETTI.length], rotate: `${(i * 53) % 360}deg` }} />
              ))}
            </div>
          )}
          <p className="eyebrow">{round.level ? `Level ${LEVELS.indexOf(round.level) + 1}: ${round.level.title}` : 'Round done'}</p>
          <div className="quiz-score">
            {summary.right}
            <span> / {round.total}</span>
          </div>
          {round.level && <Stars n={summary.stars} />}
          <p className="complete-line">
            {round.level
              ? summary.stars === 3
                ? 'Perfect round.'
                : summary.stars > 0
                  ? summary.next
                    ? `Star earned. Level ${LEVELS.indexOf(summary.next) + 1} is open.`
                    : 'Star earned.'
                  : 'Seven right on the first try earns a star. Have another go.'
              : summary.passed
                ? 'Nicely done.'
                : 'Keep at it. The notes you miss come up more often.'}
          </p>
          <div className="complete-stats">
            <div>
              <strong>{summary.times.length ? `${(summary.times.reduce((a, b) => a + b, 0) / summary.times.length / 1000).toFixed(1)}s` : '–'}</strong>
              <span>average time</span>
            </div>
            <div>
              <strong>{round.best}</strong>
              <span>best run</span>
            </div>
            <div>
              <strong>{summary.missed.length ? summary.missed.slice(0, 4).join(', ') : 'None'}</strong>
              <span>to work on</span>
            </div>
          </div>
          <div className="complete-actions">
            {summary.next && (
              <button className="primary" onClick={() => void begin(summary.next!)}>
                Next level
              </button>
            )}
            <button className={summary.next ? 'ghost' : 'primary'} onClick={() => void begin(round.level)}>
              Try again
            </button>
            <button className="ghost" onClick={stop}>
              {round.level ? 'All levels' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {phase !== 'summary' && (
        <>
          {phase === 'idle' && <h2 className="quiz-group">Your neck map</h2>}
          <Fretboard
            notes={shownNotes}
            ghosts={[]}
            highlightStrings={target}
            tuning={tuning.strings}
            capo={0}
            maxFret={12}
            showPickZone={false}
            marks={phase === 'idle' ? neckMarks : foundMarks}
            options={{ ...view, labelMode: 'note', showGhosts: false }}
          />
          {phase === 'idle' && (
            <p className="hint neck-legend">
              {neckMarks.length ? (
                <>
                  <i className="lg hit" /> known <i className="lg late" /> getting there <i className="lg miss" /> often missed. Filled in whenever a question names the string.
                </>
              ) : (
                'Play a few rounds with a string named and this map shows which spots you know and which need work.'
              )}
            </p>
          )}
        </>
      )}

      {phase === 'idle' && Object.keys(noteTally).length > 0 && (
        <>
          <h2 className="quiz-group">Notes</h2>
          <div className="note-tiles">
            {Array.from({ length: 12 }, (_, pc) => {
              const t = noteTally[pc]
              const ratio = t ? t.ok / t.n : -1
              return (
                <div key={pc} className={`note-tile ${ratio < 0 ? '' : ratio >= 0.85 ? 'good' : ratio >= 0.5 ? 'mid' : 'bad'}`}>
                  <strong>{pitchClassName(pc)}</strong>
                  <span>{t ? `${Math.round(ratio * 100)}%` : '–'}</span>
                  <span>{t && t.ok ? `${(avg(t) / 1000).toFixed(1)}s` : ''}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {phase === 'idle' && prefs.tab === 'free' && (
        <>
          <div className="quiz-stats">
            <div>
              <strong>{stats.asked ? `${pct}%` : '–'}</strong>
              <span>first-try accuracy</span>
            </div>
            <div>
              <strong>{stats.asked}</strong>
              <span>asked in this mode</span>
            </div>
            <div>
              <strong>{stats.best}</strong>
              <span>best run</span>
            </div>
            <div>
              <strong>{weakest.length ? weakest.join(' ') : '–'}</strong>
              <span>notes to work on (asked more often)</span>
            </div>
          </div>
          {stats.asked > 0 && (
            <button className="link" onClick={() => setStats(EMPTY_STATS)}>
              Reset stats for this mode
            </button>
          )}
        </>
      )}
    </div>
  )
}
