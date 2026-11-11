import { useEffect, useRef, useState } from 'react'
import { audioNow, micErrorMessage } from '../audio/pitch'
import { clickAt as playClick, listenForOnsets, outputDelay, type OnsetListener } from './onsets'
import { clickAt, LESSONS, matchHit, median, tendency, verdict, WINDOWS, type Lesson, type Verdict } from './rhythm'

type Input = 'tap' | 'guitar'

interface Hit {
  id: number
  offsetMs: number | null
  verdict: Verdict | 'missed'
}

interface Saved {
  input: Input
  windowIdx: number
  done: Record<string, boolean>
  micDelay: number | null
}

function load(): Saved {
  try {
    return { input: 'tap', windowIdx: 0, done: {}, micDelay: null, ...JSON.parse(localStorage.getItem('rhythm-trainer') ?? '{}') }
  } catch {
    return { input: 'tap', windowIdx: 0, done: {}, micDelay: null }
  }
}

const METER_MS = 150

/**
 * Learning to play with a metronome, step by step: count with the click, tap or play on
 * it, and see each note as early, on time or late, with a tip on what to change.
 */
export function RhythmTrainer() {
  const [saved, setSaved] = useState<Saved>(load)
  const save = (p: Partial<Saved>) => setSaved((s) => ({ ...s, ...p }))
  useEffect(() => {
    try {
      localStorage.setItem('rhythm-trainer', JSON.stringify(saved))
    } catch {
      // storage unavailable
    }
  }, [saved])

  const [lessonIdx, setLessonIdx] = useState<number | null>(null)
  const lesson: Lesson | null = lessonIdx === null ? null : LESSONS[lessonIdx]
  const [bpm, setBpm] = useState(70)
  const [status, setStatus] = useState<'ready' | 'checking' | 'running' | 'done'>('ready')
  const [pos, setPos] = useState({ bar: 0, step: -1 })
  const [hits, setHits] = useState<Hit[]>([])
  const [good, setGood] = useState(0)
  const [offsets, setOffsets] = useState<number[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const win = WINDOWS[saved.windowIdx] ?? WINDOWS[0]

  // Everything the scheduler and the mic callback need, without re-rendering
  const R = useRef({
    targets: [] as number[],
    targetBar: [] as number[],
    used: new Set<number>(),
    judgedUpTo: 0,
    bpm: 70,
    hitId: 0,
    barHits: new Map<number, { on: number; total: number }>(),
    delay: 0,
    listening: null as OnsetListener | null,
    timers: [] as number[],
  })

  const open = (i: number) => {
    stop()
    setLessonIdx(i)
    setBpm(LESSONS[i].bpm)
    setStatus('ready')
    setHits([])
    setGood(0)
    setOffsets([])
    setNote(null)
    setError(null)
  }

  const stop = () => {
    const S = R.current
    S.timers.forEach((t) => window.clearTimeout(t))
    S.timers = []
    window.clearInterval(sched.current)
    S.listening?.stop()
    S.listening = null
    setPos({ bar: 0, step: -1 })
  }
  useEffect(() => () => stop(), [])

  const sched = useRef(0)

  const addHit = (offsetMs: number | null, v: Hit['verdict']) => {
    const S = R.current
    S.hitId++
    setHits((h) => [...h.slice(-11), { id: S.hitId, offsetMs, verdict: v }])
    if (offsetMs !== null) setOffsets((o) => [...o, offsetMs])
  }

  /** A tap or a note at audio time t (already delay-corrected to "when it was heard"). */
  const onHit = (t: number) => {
    const S = R.current
    if (!lesson || !lesson.play.length) return
    const stepSec = 60 / S.bpm / lesson.sub
    const m = matchHit(S.targets, S.used, t, Math.min(0.25, stepSec * 0.45))
    if (!m) return
    S.used.add(m.index)
    const v = verdict(m.offsetMs, win.ms)
    addHit(m.offsetMs, v)
    const bar = S.targetBar[m.index]
    const b = S.barHits.get(bar) ?? { on: 0, total: 0 }
    if (v === 'on') b.on++
    S.barHits.set(bar, b)
    if (v === 'on') setGood((g) => g + 1)
  }
  const onHitRef = useRef(onHit)
  useEffect(() => {
    onHitRef.current = onHit
  })

  const start = async () => {
    if (!lesson) return
    setError(null)
    setHits([])
    setGood(0)
    setOffsets([])
    setNote(null)
    const S = R.current
    S.targets = []
    S.targetBar = []
    S.used = new Set()
    S.judgedUpTo = 0
    S.barHits = new Map()
    S.bpm = bpm
    S.delay = outputDelay()
    if (saved.input === 'guitar' && lesson.play.length) {
      try {
        S.listening = await listenForOnsets((t) => onHitRef.current(t - S.delay))
      } catch (e) {
        setError(micErrorMessage(e))
        return
      }
      let delay = saved.micDelay
      if (delay === null) delay = await checkDelay()
      S.delay = delay
    }
    run()
  }

  /** Plays six clicks and listens for them, to measure how late the mic hears the speakers. */
  const checkDelay = async (): Promise<number> => {
    const S = R.current
    if (!S.listening) return 0.1
    setStatus('checking')
    S.listening.filterClicks(false)
    const heard: number[] = []
    const prev = onHitRef.current
    onHitRef.current = (t) => heard.push(t + S.delay)
    const t0 = audioNow() + 0.3
    const clicks = Array.from({ length: 6 }, (_, i) => t0 + i * 0.45)
    clicks.forEach((t) => playClick(t, 2, 0.9))
    await new Promise((r) => window.setTimeout(r, (clicks[5] - audioNow() + 0.5) * 1000))
    onHitRef.current = prev
    S.listening.filterClicks(true)
    const found = clicks.map((c) => heard.find((h) => h > c && h < c + 0.35))
    const ds = found.flatMap((h, i) => (h === undefined ? [] : [h - clicks[i]]))
    let d = 0.1
    if (ds.length >= 3) {
      d = median(ds)
      setNote(`Mic delay measured: ${Math.round(d * 1000)} ms. It is taken off your timing.`)
    } else setNote('The mic could not hear the clicks (headphones?), so a typical delay of 100 ms is used. Use speakers and "Check mic delay" for a better reading.')
    save({ micDelay: d })
    return d
  }

  const run = () => {
    if (!lesson) return
    const S = R.current
    setStatus('running')
    const stepsPerBar = 4 * lesson.sub
    let next = audioNow() + 0.6
    let n = 0
    // a one-bar count-in with clicks on every beat, then the lesson
    const countIn = 4
    for (let b = 0; b < countIn; b++) {
      const t = next + (b * 60) / S.bpm
      playClick(t, b === 0 ? 2 : 1)
      S.timers.push(window.setTimeout(() => setNote(`Count in: ${b + 1}`), Math.max(0, (t - audioNow()) * 1000)))
    }
    next += (countIn * 60) / S.bpm
    const tick = () => {
      while (next < audioNow() + 0.15) {
        const bar = Math.floor(n / stepsPerBar)
        const step = n % stepsPerBar
        const level = clickAt(lesson.clicks, bar, step, lesson.sub)
        if (level) playClick(next, level === 2 ? 2 : 1)
        if (lesson.play.includes(step)) {
          S.targets.push(next + (saved.input === 'tap' ? outputDelay() : 0))
          S.targetBar.push(bar)
        }
        const at = next
        S.timers.push(
          window.setTimeout(() => {
            setPos({ bar, step })
            if (bar === 0 && step === 0) setNote(null)
            // beats that went by with nothing played
            const reach = Math.min(0.25, (60 / S.bpm / lesson.sub) * 0.45)
            while (S.judgedUpTo < S.targets.length && S.targets[S.judgedUpTo] < audioNow() - reach) {
              if (!S.used.has(S.judgedUpTo)) {
                S.used.add(S.judgedUpTo)
                addHit(null, 'missed')
              }
              S.judgedUpTo++
            }
            // speed builder: a clean bar adds tempo
            if (step === 0 && bar > 0 && lesson.speedUp) {
              const prev = S.barHits.get(bar - 1)
              if (prev && prev.on >= lesson.play.length && S.bpm < lesson.speedUp.maxBpm) {
                S.bpm = Math.min(lesson.speedUp.maxBpm, S.bpm + lesson.speedUp.step)
                setBpm(S.bpm)
              }
            }
          }, Math.max(0, (at - audioNow()) * 1000)),
        )
        if (S.timers.length > 400) S.timers = S.timers.slice(-200)
        next += 60 / S.bpm / lesson.sub
        n++
        // listening lessons stop after four bars
        if (!lesson.play.length && n >= stepsPerBar * 4) {
          window.clearInterval(sched.current)
          S.timers.push(window.setTimeout(() => finish(), Math.max(0, (next - audioNow()) * 1000)))
          return
        }
      }
    }
    sched.current = window.setInterval(tick, 25)
    tick()
  }

  const finish = () => {
    stop()
    setStatus('done')
    if (lesson) save({ done: { ...saved.done, [lesson.id]: true } })
  }

  useEffect(() => {
    if (lesson && lesson.goal && status === 'running' && good >= lesson.goal) finish()
  })

  // taps: the big pad, or the space bar
  const tap = () => {
    if (status !== 'running' || saved.input !== 'tap') return
    onHit(audioNow())
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && status === 'running' && saved.input === 'tap') {
        e.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!lesson)
    return (
      <div className="rhythm">
        <p className="hint">
          Eight short lessons, from counting with the click to keeping time when it stops. Tap the screen, or play your guitar and let the mic judge your timing.
        </p>
        <div className="level-grid">
          {LESSONS.map((l, i) => (
            <button key={l.id} className={`level-card${saved.done[l.id] ? ' done' : ''}`} onClick={() => open(i)}>
              <span className="level-num">{i + 1}</span>
              <span className="level-title">{l.title}</span>
              <span className="level-blurb">{l.how}</span>
              <span className="level-foot">
                <span className="game-best">{saved.done[l.id] ? 'Done ✓' : l.goal ? `${l.goal} notes on time` : 'Just listen'}</span>
                <span className="level-tag">Start</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    )

  const latest = [...hits].reverse().find((h) => h.offsetMs !== null)
  const missed = hits.filter((h) => h.verdict === 'missed').length
  const clickNow = pos.step >= 0 ? clickAt(lesson.clicks, pos.bar, pos.step, lesson.sub) : 0
  const silent = lesson.clicks === 'gap' && pos.bar % 4 >= 2

  return (
    <div className="rhythm">
      <div className="rhythm-head">
        <button className="ghost" onClick={() => { stop(); setLessonIdx(null) }}>
          ← Lessons
        </button>
        <span className="quiz-round-title">
          {lessonIdx! + 1}. {lesson.title}
        </span>
      </div>
      <div className="rhythm-why">
        <p>{lesson.why}</p>
        <p>
          <strong>{lesson.how}</strong>
        </p>
      </div>

      {lesson.play.length > 0 && status !== 'running' && (
        <div className="row rhythm-options">
          <div className="segmented" role="radiogroup" aria-label="How you play">
            <button className={saved.input === 'tap' ? 'active' : ''} onClick={() => save({ input: 'tap' })}>
              Tap the screen
            </button>
            <button className={saved.input === 'guitar' ? 'active' : ''} onClick={() => save({ input: 'guitar' })}>
              Play my guitar
            </button>
          </div>
          <label className="field">
            Timing
            <select value={saved.windowIdx} onChange={(e) => save({ windowIdx: Number(e.target.value) })}>
              {WINDOWS.map((w, i) => (
                <option key={w.id} value={i}>
                  {w.label} (±{w.ms} ms)
                </option>
              ))}
            </select>
          </label>
          {saved.input === 'guitar' && (
            <button className="link" onClick={() => save({ micDelay: null })}>
              {saved.micDelay === null ? 'Mic delay is checked when you start' : `Mic delay ${Math.round(saved.micDelay * 1000)} ms · check again`}
            </button>
          )}
        </div>
      )}

      <div className="row rhythm-options">
        <label className="field">
          Tempo {bpm} BPM
          <input type="range" min={40} max={160} step={2} value={bpm} disabled={status === 'running'} onChange={(e) => setBpm(Number(e.target.value))} />
        </label>
        {status === 'running' ? (
          <button onClick={() => { stop(); setStatus('ready') }}>Stop</button>
        ) : (
          <button className="primary" onClick={() => void start()} disabled={status === 'checking'}>
            {status === 'checking' ? 'Checking the mic…' : status === 'done' ? 'Again' : 'Start'}
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}

      <div className={`rhythm-count${silent ? ' silent' : ''}`} aria-hidden="true">
        {lesson.count.map((c, i) => (
          <span key={i} className={`${pos.step === i ? 'now' : ''}${lesson.play.includes(i) ? ' play' : ''}${i % lesson.sub ? ' and' : ''}${pos.step === i && clickNow ? ' click' : ''}`}>
            {c}
          </span>
        ))}
      </div>
      <p className="hint rhythm-note">
        {note ??
          (status === 'running'
            ? silent
              ? 'Silence: keep counting and playing, the click comes back.'
              : lesson.play.length
                ? 'Play on the highlighted numbers.'
                : 'Count out loud with each click.'
            : lesson.play.length
              ? `The underlined numbers are where you ${saved.input === 'tap' ? 'tap' : 'play'}. A one-bar count-in starts it.`
              : 'Press Start and count along.')}
      </p>

      {lesson.play.length > 0 && (
        <>
          {saved.input === 'tap' && (
            <button className={`rhythm-pad${status === 'running' ? ' live' : ''}`} onPointerDown={tap} disabled={status !== 'running'}>
              Tap here <small>or press space</small>
            </button>
          )}
          <div className="rhythm-meter" aria-label={latest ? `Last note ${latest.offsetMs} ms` : 'No notes yet'}>
            <div className="rhythm-zone" style={{ left: `${50 - (win.ms / METER_MS) * 50}%`, width: `${(win.ms / METER_MS) * 100}%` }} />
            <span className="rhythm-label early">Early</span>
            <span className="rhythm-label late">Late</span>
            <div className="rhythm-center" />
            {hits
              .filter((h) => h.offsetMs !== null)
              .map((h, i, all) => (
                <i
                  key={h.id}
                  className={`rhythm-dot ${h.verdict}${i === all.length - 1 ? ' last' : ''}`}
                  style={{ left: `${50 + (Math.max(-METER_MS, Math.min(METER_MS, h.offsetMs!)) / METER_MS) * 50}%`, opacity: 0.25 + (0.75 * (i + 1)) / all.length }}
                />
              ))}
          </div>
          <div className="rhythm-last">
            {latest ? (
              <strong className={latest.verdict}>
                {latest.verdict === 'on' ? 'On time' : latest.verdict === 'early' ? 'Early' : 'Late'} · {latest.offsetMs! > 0 ? '+' : ''}
                {latest.offsetMs} ms
              </strong>
            ) : (
              <span className="hint">Your timing shows here.</span>
            )}
          </div>
          <div className="rhythm-progress">
            <div style={{ width: `${Math.min(100, (good / lesson.goal) * 100)}%` }} />
          </div>
          <p className="hint">
            {good} of {lesson.goal} on time{missed ? ` · ${missed} missed` : ''}. {tendency(offsets.slice(-16), win.ms)}
          </p>
        </>
      )}

      {status === 'done' && (
        <div className="rhythm-done">
          <strong>Lesson done.</strong>
          {lesson.play.length > 0 && <span>{tendency(offsets, win.ms)}</span>}
          <div className="row">
            {lessonIdx! + 1 < LESSONS.length && (
              <button className="primary" onClick={() => open(lessonIdx! + 1)}>
                Next: {LESSONS[lessonIdx! + 1].title}
              </button>
            )}
            <button className="ghost" onClick={() => setLessonIdx(null)}>
              All lessons
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
