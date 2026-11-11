import { useCallback, useEffect, useRef, useState } from 'react'
import { VocalTrainer } from './VocalTrainer'
import { listenForPitch, micErrorMessage, playChime, playTone, type PitchListener } from '../audio/pitch'
import { Fretboard, type FretMark } from '../components/Fretboard'
import { setView, useFretboardView } from '../components/fretboardView'
import { noteName, pitchClassName, solfegeName, TUNINGS } from '../music/notes'
import type { FretNote } from '../music/types'
import { localDate } from '../progress/practiceLog'
import { Games } from './Games'
import { LiveNeck } from './LiveNeck'
import {
  Attacks,
  checkAnswer,
  checkTap,
  isSpotMode,
  isTapMode,
  pathWeights,
  warmupWeights,
  dayStreak,
  isUnlocked,
  LEVELS,
  nextQuestion,
  NoteEvents,
  questionText,
  registerName,
  ROUND,
  samePitch,
  StableNote,
  spots,
  starsFor,
  type Level,
  type Question,
  type QuizMode,
  type QuizSettings,
} from './quiz'

type Phase = 'idle' | 'prompt' | 'listening' | 'right' | 'timeout' | 'summary'
type Tab = 'path' | 'free' | 'games' | 'live' | 'sing'

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

/** A round with its own settings that is not a path level, e.g. the daily warm-up. */
interface Custom {
  title: string
  settings: Omit<QuizSettings, 'tuning'>
}

interface Round {
  level: Level | null
  custom?: Custom
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
  { id: 'name-dot', label: 'Name the dot', hint: 'No guitar or mic needed. A dot appears on the neck: tap its note name, or press its letter key.' },
  { id: 'tap-spot', label: 'Tap the spot', hint: 'No guitar or mic needed. The app names a note and a string: tap that spot on the neck.' },
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
  /** Last day the warm-up was finished, YYYY-MM-DD. */
  warmupDay?: string
}

const DEFAULT_PREFS: Prefs = {
  tab: 'path',
  mode: 'find-note',
  tuningId: 'standard',
  strings: [1, 2, 3, 4, 5, 6],
  range: 0,
  naturalsOnly: true,
  seconds: 5,
  roundLength: 20,
  sounds: true,
}

/** The question, with the do-ré-mi name in small type right after the note name. */
function PromptText({ text, midi }: { text: string; midi: number | null }) {
  if (midi === null) return <>{text}</>
  const name = pitchClassName(midi)
  const m = new RegExp(`(^|\\s)${name.replace('#', '\\#')}(?=\\s|$)`).exec(text)
  if (!m) return <>{text}</>
  const end = m.index + m[0].length
  return (
    <>
      {text.slice(0, end)}
      <span className="solfa-inline">{solfegeName(midi)}</span>
      {text.slice(end)}
    </>
  )
}

const CONFETTI = ['#ff7a45', '#ff4f7b', '#fbbf24', '#2dd4bf', '#a78bfa', '#7cc4ff']
const NOTE_GAP_MS = 650
/** A wrong note only counts if it was plucked within this many mic frames (about half a second). */
const PLUCK_FRAMES = 40
/** A wrong note is only shown once it has held this many mic frames (about a third of a second). */
const WRONG_FRAMES = 20

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
  const [prefs, setPrefs] = useState<Prefs>(() => {
    const p = load('quiz-prefs', DEFAULT_PREFS)
    // rounds doubled: 10 notes became 20
    return p.roundLength === 10 ? { ...p, roundLength: 20 } : p
  })
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
  const [tapSpot, setTapSpot] = useState<{ string: number; fret: number } | null>(null)
  const view = useFretboardView()

  const listener = useRef<PitchListener | null>(null)
  const events = useRef(new NoteEvents(6))
  // Wrong notes need a longer, steadier sound than right ones, so brief noises are ignored
  const steady = useRef(new StableNote(WRONG_FRAMES))
  const attacks = useRef(new Attacks())
  const L = useRef({
    question: null as Question | null,
    phase: 'idle' as Phase,
    startedAt: 0,
    ignoreUntil: 0,
    wrong: [] as number[],
    found: [] as number[],
    live: null as number | null,
    quiet: 0,
    pendingWrong: null as number | null,
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
  const roundSettings = (level: Level | null, custom?: Custom): QuizSettings => {
    if (custom) return { ...custom.settings, tuning: tuning.strings }
    if (!level) return freeSettings
    const s = { ...level.settings, tuning: tuning.strings }
    // within a level, the spots you miss come up more often
    return isSpotMode(s.mode) ? { ...s, spotWeights: pathWeights(s, neck) } : s
  }
  const settings: QuizSettings = round ? roundSettings(round.level, round.custom) : freeSettings
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
    // A right note counts even after wrong tries: on a real guitar most "wrong tries"
    // are room noise, finger squeaks or a neighbouring string, not a wrong guess.
    const firstTry = correct
    const ms = correct ? Math.round(performance.now() - L.current.startedAt) : null
    setAnswerMs(ms)
    const key = q.mode === 'find-note' || q.mode === 'find-all' ? q.midi % 12 : q.midi
    // lifetime stats and the "asked more often" weights belong to free practice
    if (!roundRef.current?.level && !roundRef.current?.custom) setStats((s) => {
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
    if (isSpotMode(q.mode)) {
      const spot = `${q.positions[0].string}:${q.positions[0].fret}`
      setNeck((n) => ({ ...n, [spot]: add(n[spot]) }))
    }
    const today = localDate()
    setDays((d) => (d.includes(today) ? d : [...d.slice(-60), today]))
    const label =
      q.mode === 'melody'
        ? q.targets.map(pitchClassName).join(' ')
        : isSpotMode(q.mode)
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
      // tapping: hear the note you were looking for, so name, place and sound go together
      if (isTapMode(q.mode)) later(() => playTone(q.midi, 1.2), correct ? 0 : 250)
      else if (correct) playChime('right')
      else if (q.mode === 'melody') later(() => playPhrase(q.targets), 400)
      else later(() => playTone(q.midi), 300)
    }
    setLivePhase(correct ? 'right' : 'timeout')
    later(() => askRef.current(), correct ? (isTapMode(q.mode) ? 900 : 1500) : isTapMode(q.mode) ? 2200 : q.mode === 'melody' ? 4000 : 3000)
  }, [])

  const ask = useCallback(() => {
    clearTimers()
    const r = roundRef.current
    if (r && r.total > 0 && r.results.length >= r.total) {
      stopMic()
      setLivePhase('summary')
      const level = r.level
      if (r.custom) {
        const today = localDate()
        setPrefs((p) => ({ ...p, warmupDay: today }))
      }
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
    steady.current.reset()
    L.current.pendingWrong = null
    L.current.question = q
    L.current.wrong = []
    L.current.found = []
    setQuestion(q)
    setHeard(null)
    setFound([])
    setWrongTries([])
    setAnswerMs(null)
    setTapSpot(null)
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
      // No fresh pluck: a string ringing on from before, or the open string under a
      // lifted finger. Not a guess, so it does not count against you.
      if (!attacks.current.recently(PLUCK_FRAMES)) return
      // Held long enough to be a real note? Decided by the mic callback below.
      S.pendingWrong = note
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
      if (samePitch(expected, note)) {
        S.found = [...S.found, expected]
        setFound(S.found)
        if (S.found.length === q.targets.length) finish(true)
      } else if (S.found.length === 0 || !samePitch(q.targets[S.found.length - 1], note)) wrong()
    } else if (checkAnswer(q, note).correct) finish(true)
    else wrong()
  }
  /** A tapped answer: a pitch class for name-dot, a spot for tap-spot. A wrong tap is a real guess, so it ends the question. */
  const onTap = (answer: number | { string: number; fret: number }) => {
    const q = L.current.question
    if (!q || !isTapMode(q.mode) || L.current.phase !== 'listening') return
    const tapped = typeof answer === 'number' ? answer : tuning.strings[answer.string - 1] + answer.fret
    setHeard(tapped)
    if (typeof answer !== 'number') setTapSpot(answer)
    if (!checkTap(q, answer)) {
      L.current.wrong = [tapped]
      setWrongTries([tapped])
      if (soundsRef.current) playChime('miss')
    }
    finish(checkTap(q, answer))
  }

  const onNoteRef = useRef(onNote)
  useEffect(() => {
    onNoteRef.current = onNote
  })

  const begin = async (level: Level | null, custom?: Custom) => {
    setError(null)
    const r: Round = { level, custom, total: level || custom ? ROUND : prefs.roundLength, results: [], streak: 0, best: 0 }
    roundRef.current = r
    setRound(r)
    settingsRef.current = roundSettings(level, custom)
    L.current.question = null
    window.scrollTo?.({ top: 0, behavior: 'smooth' })
    try {
      if (isTapMode(settingsRef.current.mode)) stopMic()
      else if (!listener.current) {
        listener.current = await listenForPitch((reading, level) => {
          const S = L.current
          attacks.current.push(level)
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
          const held = steady.current.push(reading ? reading.midi : null)
          const note = events.current.push(reading ? reading.midi : null)
          if (note !== null) onNoteRef.current(note)
          if (S.pendingWrong !== null && (!reading || Math.round(reading.midi) !== S.pendingWrong)) S.pendingWrong = null
          else if (S.pendingWrong !== null && held === S.pendingWrong && S.phase === 'listening') {
            S.pendingWrong = null
            if (!S.wrong.includes(held)) {
              S.wrong = [...S.wrong, held]
              setWrongTries(S.wrong)
            }
          }
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
      const q = L.current.question
      if (q?.mode === 'name-dot') {
        const pc = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[e.key.toLowerCase()]
        if (pc !== undefined) onTap(pc)
        return
      }
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
  const tapMode = !!question && isTapMode(question.mode) && running
  // name-dot shows its dot, without the name, while you answer
  const dotNow = running && question?.mode === 'name-dot' && !reveal
  const shownNotes: FretNote[] = question && (reveal || dotNow) && running ? question.positions.map(toFretNote) : []
  const target = (question?.mode === 'find-on-string' || question?.mode === 'tap-spot') && !reveal && running ? [question.string!] : []
  // A wrong tap on the neck: ring the spot that was tapped
  const wrongTapMarks: FretMark[] =
    question?.mode === 'tap-spot' && phase === 'timeout' && tapSpot
      ? [{ key: `w${tapSpot.string}:${tapSpot.fret}`, string: tapSpot.string, fret: tapSpot.fret, result: 'miss' }]
      : []

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
  const mode = round?.custom?.settings.mode ?? round?.level?.settings.mode ?? prefs.mode
  const roundTitle = (r: Round) =>
    r.custom ? r.custom.title : r.level ? `Level ${LEVELS.indexOf(r.level) + 1}: ${r.level.title}` : MODES.find((m) => m.id === mode)?.label
  const warmup = (withGuitar: boolean): Custom => ({
    title: withGuitar ? 'Warm-up on guitar' : 'Warm-up, tapping',
    settings: {
      mode: withGuitar ? 'find-on-string' : 'tap-spot',
      strings: tuning.strings.map((_, i) => i + 1),
      minFret: 0,
      maxFret: 12,
      naturalsOnly: false,
      seconds: withGuitar ? 8 : 6,
      spotWeights: warmupWeights(neck, tuning.strings.length),
    },
  })
  const warmedUpToday = prefs.warmupDay === localDate()
  const neckSeen = Object.keys(neck).length

  const statusText = () => {
    if (!question) return ''
    if (phase === 'prompt') return question.mode === 'ear' || question.mode === 'melody' ? 'Listen…' : 'Get ready…'
    if (phase === 'listening' && tapMode) return `${timeLeft}s`
    if (phase === 'timeout' && tapMode) {
      const where = `string ${question.string}, fret ${question.positions[0]?.fret}`
      if (heard === null) return `Time's up. It was ${pitchClassName(question.midi)}, ${where}.`
      return question.mode === 'name-dot'
        ? `Not ${pitchClassName(heard)}. This dot is ${pitchClassName(question.midi)}.`
        : `That spot is ${pitchClassName(heard)}. ${pitchClassName(question.midi)} is at fret ${question.positions[0]?.fret}.`
    }
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
      const extra = ''
      if (question.mode === 'melody') return `You got the melody${time}${extra}`
      if (question.mode === 'find-all') return `All ${question.targets.length} found${time}${extra}`
      if (question.mode === 'name-dot') return `Yes, ${pitchClassName(question.midi)}${time}`
      if (question.mode === 'tap-spot') return `Yes, fret ${question.positions[0]?.fret}${time}`
      return `Correct, ${noteName(question.mode === 'find-note' ? (heard ?? question.midi) : question.midi)}${time}${extra}`
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
              <span className="tab-long">Learn the neck</span>
              <span className="tab-short">Learn</span>
            </button>
            <button role="tab" aria-selected={prefs.tab === 'free'} className={prefs.tab === 'free' ? 'active' : ''} onClick={() => setPrefs({ ...prefs, tab: 'free' })}>
              <span className="tab-long">Free practice</span>
              <span className="tab-short">Practice</span>
            </button>
            <button role="tab" aria-selected={prefs.tab === 'games'} className={prefs.tab === 'games' ? 'active' : ''} onClick={() => setPrefs({ ...prefs, tab: 'games' })}>
              Games
            </button>
            <button role="tab" aria-selected={prefs.tab === 'live'} className={prefs.tab === 'live' ? 'active' : ''} onClick={() => setPrefs({ ...prefs, tab: 'live' })}>
              <span className="tab-long">Live neck</span>
              <span className="tab-short">Live</span>
            </button>
            <button role="tab" aria-selected={prefs.tab === 'sing'} className={prefs.tab === 'sing' ? 'active' : ''} onClick={() => setPrefs({ ...prefs, tab: 'sing' })}>
              Sing
            </button>
          </div>

          {prefs.tab === 'path' && (
            <div className="quiz-path">
              <div className={`warmup-card${warmedUpToday ? ' done' : ''}`}>
                <div className="warmup-text">
                  <span className="eyebrow">{warmedUpToday ? 'Done today' : 'Daily warm-up'}</span>
                  <strong>{ROUND} spots picked for you</strong>
                  <span className="hint">
                    {neckSeen >= 10
                      ? 'From your neck map: the spots you miss or answer slowly, plus ones you have not tried yet. About three minutes.'
                      : 'Spots from the whole neck, up to fret 12. The more you play, the more it focuses on the spots you miss.'}
                  </span>
                </div>
                <div className="warmup-actions">
                  <button className={warmedUpToday ? '' : 'primary'} onClick={() => void begin(null, warmup(true))}>
                    Play on guitar
                  </button>
                  <button className="ghost" onClick={() => void begin(null, warmup(false))}>
                    Tap, no guitar
                  </button>
                </div>
              </div>
              <p className="hint">
                Short rounds of {ROUND} notes. Get 14 right to earn a star and open the next level. Uses your microphone, so play one note at a time, no capo.
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
                          {isTapMode(l.settings.mode) && <span className="level-badge">No mic</span>}
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

          {prefs.tab === 'sing' && <VocalTrainer />}

          {prefs.tab === 'games' && <Games tuning={tuning.strings} sounds={prefs.sounds} view={{ ...view, labelMode: 'note', showGhosts: false }} />}

          {prefs.tab === 'live' && (
            <>
              <div className="row live-tuning">
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
              </div>
              <LiveNeck tuning={tuning.strings} />
            </>
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
                    <option value={20}>20 notes</option>
                    <option value={40}>40 notes</option>
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
          <span className="quiz-round-title">{roundTitle(round)}</span>
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
          <div className="quiz-prompt">
            <PromptText text={questionText(question)} midi={question.mode === 'ear' || question.mode === 'melody' ? null : question.midi} />
          </div>
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
          {!tapMode && (
            <div className="quiz-live" aria-hidden="true">
              <span className={live !== null ? 'on' : ''}>{live !== null ? `Hearing ${noteName(live)}` : 'Waiting for a note'}</span>
            </div>
          )}
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
          <p className="eyebrow">{round.level || round.custom ? roundTitle(round) : 'Round done'}</p>
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
                  : '14 right earns a star. Have another go.'
              : round.custom
                ? summary.passed
                  ? 'Warm-up done. Your neck map is updated.'
                  : 'Warm-up done. The spots you missed come back tomorrow.'
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
            <button className={summary.next ? 'ghost' : 'primary'} onClick={() => void begin(round.level, round.custom && warmup(round.custom.settings.mode === 'find-on-string'))}>
              Try again
            </button>
            <button className="ghost" onClick={stop}>
              {round.level || round.custom ? 'All levels' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {phase !== 'summary' && !(phase === 'idle' && (prefs.tab === 'live' || prefs.tab === 'games')) && (
        <>
          {phase === 'idle' && <h2 className="quiz-group">Your neck map</h2>}
          <Fretboard
            notes={shownNotes}
            ghosts={[]}
            highlightStrings={target}
            tuning={tuning.strings}
            capo={0}
            maxFret={running && settings.maxFret <= 5 ? 7 : 12}
            showPickZone={false}
            marks={phase === 'idle' ? neckMarks : [...foundMarks, ...wrongTapMarks]}
            options={{ ...view, labelMode: dotNow ? 'finger' : 'note', showGhosts: false }}
            onFretClick={question?.mode === 'tap-spot' && phase === 'listening' ? (string, fret) => onTap({ string, fret }) : undefined}
          />
          {running && question?.mode === 'name-dot' && (
            <div className={`name-pad${settings.naturalsOnly ? '' : ' all'}`} role="group" aria-label="Note names">
              {Array.from({ length: 12 }, (_, pc) => pc)
                .filter((pc) => !settings.naturalsOnly || [0, 2, 4, 5, 7, 9, 11].includes(pc))
                .map((pc) => (
                  <button
                    key={pc}
                    className={
                      reveal && pc === question.midi % 12 ? 'name-key right' : phase === 'timeout' && heard !== null && pc === heard % 12 ? 'name-key wrong' : 'name-key'
                    }
                    disabled={phase !== 'listening'}
                    onClick={() => onTap(pc)}
                  >
                    <strong>{pitchClassName(pc)}</strong>
                    <span>{solfegeName(pc)}</span>
                  </button>
                ))}
            </div>
          )}
          {phase === 'idle' && (
            <p className="hint neck-legend">
              {neckMarks.length ? (
                <>
                  <i className="lg hit" /> known <i className="lg late" /> getting there <i className="lg miss" /> often missed. Filled in by every question about one spot: a note on a string, a dot, or a tap.
                </>
              ) : (
                'Play a warm-up or a few levels and this map shows which spots you know and which need work.'
              )}
            </p>
          )}
        </>
      )}

      {phase === 'idle' && prefs.tab !== 'live' && prefs.tab !== 'games' && Object.keys(noteTally).length > 0 && (
        <>
          <h2 className="quiz-group">Notes</h2>
          <div className="note-tiles">
            {Array.from({ length: 12 }, (_, pc) => {
              const t = noteTally[pc]
              const ratio = t ? t.ok / t.n : -1
              return (
                <div key={pc} className={`note-tile ${ratio < 0 ? '' : ratio >= 0.85 ? 'good' : ratio >= 0.5 ? 'mid' : 'bad'}`}>
                  <strong>
                    {pitchClassName(pc)}
                    <span className="solfa-inline">{solfegeName(pc)}</span>
                  </strong>
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
              <span>accuracy</span>
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
