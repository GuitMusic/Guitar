import { useCallback, useEffect, useRef, useState } from 'react'
import { listenForPitch, micErrorMessage, playTone, type PitchListener } from '../audio/pitch'
import { Fretboard } from '../components/Fretboard'
import { setView, useFretboardView } from '../components/fretboardView'
import { noteName, pitchClassName, TUNINGS } from '../music/notes'
import type { FretNote } from '../music/types'
import { checkAnswer, nextQuestion, questionText, spots, StableNote, type Question, type QuizMode, type QuizSettings } from './quiz'

type Phase = 'idle' | 'prompt' | 'listening' | 'right' | 'timeout'

interface Stats {
  asked: number
  correct: number
  streak: number
  best: number
  /** misses per note key (pitch class for find-note, MIDI otherwise) */
  misses: Record<number, number>
}

const EMPTY_STATS: Stats = { asked: 0, correct: 0, streak: 0, best: 0, misses: {} }

const MODES: { id: QuizMode; label: string; hint: string }[] = [
  { id: 'find-note', label: 'Find the note', hint: 'The app names a note, you play it anywhere on the neck.' },
  { id: 'find-on-string', label: 'Note on a string', hint: 'The app names a note and a string. Play exactly that spot.' },
  { id: 'ear', label: 'Ear training', hint: 'The app plays a note. Find it on your guitar by ear.' },
]

const RANGES = [
  { label: 'Frets 0 to 5', min: 0, max: 5 },
  { label: 'Frets 0 to 12', min: 0, max: 12 },
  { label: 'Frets 5 to 12', min: 5, max: 12 },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
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
  mode: QuizMode
  tuningId: string
  strings: number[]
  range: number
  naturalsOnly: boolean
  seconds: number
}

const DEFAULT_PREFS: Prefs = { mode: 'find-note', tuningId: 'standard', strings: [1, 2, 3, 4, 5, 6], range: 0, naturalsOnly: true, seconds: 5 }

/** Note-finding and ear-training quiz checked with the microphone. */
export function NoteQuiz() {
  const [prefs, setPrefs] = useState<Prefs>(() => load('quiz-prefs', DEFAULT_PREFS))
  const [stats, setStats] = useState<Stats>(() => load(`quiz-stats-${prefs.mode}`, EMPTY_STATS))
  const [phase, setPhase] = useState<Phase>('idle')
  const [question, setQuestion] = useState<Question | null>(null)
  const [heard, setHeard] = useState<number | null>(null)
  const [wrongTries, setWrongTries] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [answerMs, setAnswerMs] = useState<number | null>(null)
  const view = useFretboardView()

  const listener = useRef<PitchListener | null>(null)
  const stable = useRef(new StableNote(6))
  const live = useRef<{ question: Question | null; phase: Phase; startedAt: number; ignoreUntil: number; wrong: number[] }>({
    question: null,
    phase: 'idle',
    startedAt: 0,
    ignoreUntil: 0,
    wrong: [],
  })
  const timers = useRef<number[]>([])
  const askRef = useRef<() => void>(() => {})

  const tuning = TUNINGS.find((t) => t.id === prefs.tuningId) ?? TUNINGS[0]
  const range = RANGES[prefs.range] ?? RANGES[0]
  const settings: QuizSettings = {
    mode: prefs.mode,
    tuning: tuning.strings,
    strings: prefs.strings,
    minFret: range.min,
    maxFret: range.max,
    naturalsOnly: prefs.naturalsOnly,
    seconds: prefs.seconds,
  }
  const settingsRef = useRef(settings)
  const statsRef = useRef(stats)
  useEffect(() => {
    settingsRef.current = settings
    statsRef.current = stats
  })

  useEffect(() => save('quiz-prefs', prefs), [prefs])
  useEffect(() => save(`quiz-stats-${prefs.mode}`, stats), [stats, prefs.mode])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const setLivePhase = (p: Phase) => {
    live.current.phase = p
    setPhase(p)
  }

  const finish = useCallback((correct: boolean) => {
    const q = live.current.question
    if (!q) return
    clearTimers()
    const key = q.mode === 'find-note' ? q.midi % 12 : q.midi
    const firstTry = correct && live.current.wrong.length === 0
    setAnswerMs(correct ? Math.round(performance.now() - live.current.startedAt) : null)
    setStats((s) => {
      const misses = { ...s.misses }
      if (firstTry) misses[key] = Math.max(0, (misses[key] ?? 0) - 1)
      else misses[key] = (misses[key] ?? 0) + 1
      const streak = firstTry ? s.streak + 1 : 0
      return { asked: s.asked + 1, correct: s.correct + (firstTry ? 1 : 0), streak, best: Math.max(s.best, streak), misses }
    })
    setLivePhase(correct ? 'right' : 'timeout')
    timers.current.push(window.setTimeout(() => askRef.current(), correct ? 1600 : 3200))
  }, [])

  const ask = useCallback(() => {
    clearTimers()
    const q = nextQuestion(settingsRef.current, Math.random, statsRef.current.misses, live.current.question)
    if (!q) {
      setError('Pick at least one string and a fret range with notes in it.')
      return
    }
    stable.current.reset()
    live.current.question = q
    live.current.wrong = []
    setQuestion(q)
    setHeard(null)
    setWrongTries([])
    setAnswerMs(null)
    const delay = q.mode === 'ear' ? 1700 : 300
    if (q.mode === 'ear') playTone(q.midi)
    setLivePhase('prompt')
    live.current.ignoreUntil = performance.now() + delay
    timers.current.push(
      window.setTimeout(() => {
        live.current.startedAt = performance.now()
        setLivePhase('listening')
        const seconds = settingsRef.current.seconds
        setTimeLeft(seconds)
        for (let i = 1; i <= seconds; i++) {
          timers.current.push(window.setTimeout(() => setTimeLeft(seconds - i), i * 1000))
        }
        timers.current.push(window.setTimeout(() => finish(false), seconds * 1000))
      }, delay),
    )
  }, [finish])

  useEffect(() => {
    askRef.current = ask
  }, [ask])

  const start = async () => {
    setError(null)
    try {
      listener.current = await listenForPitch((r) => {
        const L = live.current
        if (performance.now() < L.ignoreUntil) return
        const note = stable.current.push(r ? r.midi : null)
        if (note === null || !L.question) return
        if (L.phase !== 'listening' && L.phase !== 'prompt') return
        setHeard(note)
        if (checkAnswer(L.question, note).correct) {
          if (L.phase === 'listening') finish(true)
        } else if (L.phase === 'listening' && !L.wrong.includes(note)) {
          L.wrong = [...L.wrong, note]
          setWrongTries(L.wrong)
        }
      })
      ask()
    } catch (e) {
      setError(micErrorMessage(e))
    }
  }

  const stop = () => {
    clearTimers()
    listener.current?.stop()
    listener.current = null
    live.current.question = null
    setQuestion(null)
    setLivePhase('idle')
  }

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      listener.current?.stop()
    },
    [],
  )

  const running = phase !== 'idle'
  const reveal = phase === 'right' || phase === 'timeout'
  const shownNotes: FretNote[] =
    question && reveal
      ? question.positions.map((p) => ({
          key: `${p.string}:${p.fret}`,
          string: p.string,
          fret: p.fret,
          tabFret: p.fret,
          midi: tuning.strings[p.string - 1] + p.fret,
          lh: null,
          rh: null,
          lhInferred: false,
          rhInferred: false,
        }))
      : []
  const target = question?.mode === 'find-on-string' && !reveal ? [{ string: question.string! }] : []

  const toggleString = (s: number) =>
    setPrefs((p) => ({ ...p, strings: p.strings.includes(s) ? p.strings.filter((x) => x !== s) : [...p.strings, s].sort() }))

  const pct = stats.asked ? Math.round((stats.correct / stats.asked) * 100) : 0
  const weakest = Object.entries(stats.misses)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => (prefs.mode === 'find-note' ? pitchClassName(Number(k)) : noteName(Number(k))))
  const available = spots(settings).length

  return (
    <div className="quiz">
      <h1>Note finder</h1>
      <p className="hint">{MODES.find((m) => m.id === prefs.mode)?.hint}</p>

      {!running && (
        <div className="quiz-settings">
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
              Time to answer
              <select value={prefs.seconds} onChange={(e) => setPrefs({ ...prefs, seconds: Number(e.target.value) })}>
                {[3, 5, 8, 12].map((s) => (
                  <option key={s} value={s}>
                    {s} seconds
                  </option>
                ))}
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
              <input type="checkbox" checked={view.leftHanded} onChange={(e) => setView({ ...view, leftHanded: e.target.checked })} /> Left-handed
            </label>
          </div>
          <div className="row">
            <button className="primary" onClick={start} disabled={available === 0}>
              Start
            </button>
            <span className="hint">Uses your microphone. No capo, and play one note at a time.</span>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {running && question && (
        <div className={`quiz-card is-${phase}`}>
          <div className="quiz-prompt">{questionText(question)}</div>
          <div className="quiz-status" role="status">
            {phase === 'prompt' && (question.mode === 'ear' ? 'Listen…' : 'Get ready…')}
            {phase === 'listening' &&
              (wrongTries.length
                ? `That was ${noteName(wrongTries[wrongTries.length - 1])}. Keep trying, ${timeLeft}s left`
                : `Listening… ${timeLeft}s`)}
            {phase === 'right' &&
              `Correct, ${noteName(heard ?? question.midi)}${answerMs ? ` in ${(answerMs / 1000).toFixed(1)}s` : ''}${wrongTries.length ? ' (not first try)' : ''}`}
            {phase === 'timeout' && `Time's up. It was ${question.mode === 'find-note' ? pitchClassName(question.midi) : noteName(question.midi)}, shown below.`}
          </div>
          {phase === 'listening' && (
            <div className="quiz-timer">
              <div className="quiz-timer-fill" style={{ animationDuration: `${prefs.seconds}s` }} />
            </div>
          )}
          <div className="row">
            {question.mode === 'ear' && <button onClick={() => playTone(question.midi)}>Play it again</button>}
            <button onClick={() => finish(false)} disabled={phase !== 'listening'}>
              Show me
            </button>
            <button onClick={stop}>Stop</button>
          </div>
        </div>
      )}

      <Fretboard
        notes={shownNotes}
        ghosts={[]}
        highlightStrings={target.map((t) => t.string)}
        tuning={tuning.strings}
        capo={0}
        maxFret={12}
        showPickZone={false}
        options={{ ...view, labelMode: 'note', showGhosts: false }}
      />

      <div className="quiz-stats">
        <div>
          <strong>{stats.asked ? `${pct}%` : '–'}</strong>
          <span>first-try accuracy</span>
        </div>
        <div>
          <strong>{stats.asked}</strong>
          <span>notes asked</span>
        </div>
        <div>
          <strong>{stats.streak}</strong>
          <span>streak (best {stats.best})</span>
        </div>
        <div>
          <strong>{weakest.length ? weakest.join(' ') : '–'}</strong>
          <span>notes to work on (asked more often)</span>
        </div>
      </div>
      {stats.asked > 0 && !running && (
        <button className="link" onClick={() => setStats(EMPTY_STATS)}>
          Reset stats for this mode
        </button>
      )}
    </div>
  )
}
