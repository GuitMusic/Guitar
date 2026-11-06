import { useEffect, useRef, useState } from 'react'
import { listenForPitch, micErrorMessage, playChime, playTone, type PitchListener } from '../audio/pitch'
import { noteName, pitchClassName, solfegeName } from '../music/notes'
import { HoldTimer, offTarget, RANGE_BASE, randomTarget, scaleRun, SCALES, VOCAL_LEVELS, type ScaleKind, type VocalLevel, type VoiceRange } from './vocal'

type Exercise = 'match' | 'scale' | 'free'

interface Prefs {
  exercise: Exercise
  range: VoiceRange
  scale: ScaleKind
  /** Tonic of the scale, semitones above the range base (0 = Do) */
  tonic: number
  naturalsOnly: boolean
  level: VocalLevel
  playFirst: boolean
}

const KEY = 'vocal-prefs-v1'
const DEFAULTS: Prefs = { exercise: 'match', range: 'low', scale: 'major', tonic: 0, naturalsOnly: true, playFirst: true, level: 'beginner' }

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

const EXERCISES: { id: Exercise; label: string; hint: string }[] = [
  { id: 'match', label: 'Match the note', hint: 'The app plays a note. Sing it back and hold it steady until the ring fills up.' },
  { id: 'scale', label: 'Sing the scale', hint: 'Sing the scale one note at a time, up and back down. Each note is played first if you like.' },
  { id: 'free', label: 'Free singing', hint: 'Sing anything. See the note you are on, how in tune it is, and the range of your voice.' },
]

const TONICS = [0, 2, 4, 5, 7, 9]
/** How long the trace shows, in readings (about 60 a second) */
const TRACE = 240
/** Ignore the microphone while the reference note plays, so the app doesn't hear itself */
const REF_SECONDS = 1.3

const name = (m: number) => `${pitchClassName(m)} · ${solfegeName(m)}`

/**
 * Singing practice with the microphone: match notes, sing scales (major, minor, Hijaz)
 * in do-ré-mi, or sing freely and find your range. A trace shows your pitch over time
 * against the target, so you can see whether you are sharp, flat or wobbling.
 */
export function VocalTrainer() {
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs)
  const setPrefs = (p: Prefs) => {
    setPrefsState(p)
    try {
      localStorage.setItem(KEY, JSON.stringify(p))
    } catch {
      // not remembered
    }
  }
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sung, setSung] = useState<number | null>(null)
  const [trace, setTrace] = useState<(number | null)[]>([])
  const [target, setTarget] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const [hold, setHold] = useState(0)
  const [score, setScore] = useState({ right: 0, streak: 0 })
  const [message, setMessage] = useState<string | null>(null)
  const [range, setRange] = useState<{ low: number; high: number } | null>(null)

  const listener = useRef<PitchListener | null>(null)
  const muteUntil = useRef(0)
  const timer = useRef(new HoldTimer())
  const last = useRef(0)
  const targetRef = useRef<number | null>(null)
  const done = useRef(false)
  const steady = useRef<{ midi: number; since: number } | null>(null)
  const onHit = useRef<() => void>(() => {})
  const aimedAt = useRef(0)
  const replayed = useRef(false)
  const [helped, setHelped] = useState(false)
  const levelRef = useRef(VOCAL_LEVELS[prefs.level])
  levelRef.current = VOCAL_LEVELS[prefs.level]

  const run = prefs.exercise === 'scale' ? scaleRun(RANGE_BASE[prefs.range] + prefs.tonic, prefs.scale) : []

  const playRef = (m: number) => {
    muteUntil.current = performance.now() + REF_SECONDS * 1000
    playTone(m, REF_SECONDS)
  }

  const aim = (m: number | null, play: boolean) => {
    targetRef.current = m
    aimedAt.current = performance.now()
    replayed.current = false
    setHelped(false)
    setTarget(m)
    timer.current.reset()
    setHold(0)
    done.current = false
    if (m !== null && play) playRef(m)
  }

  // A new exercise or setting starts from its first note
  const restart = (p: Prefs) => {
    setMessage(null)
    setStep(0)
    setScore({ right: 0, streak: 0 })
    if (p.exercise === 'match') aim(randomTarget(p.range, p.naturalsOnly, null, Math.random, VOCAL_LEVELS[p.level].span), listener.current !== null)
    else if (p.exercise === 'scale') aim(scaleRun(RANGE_BASE[p.range] + p.tonic, p.scale)[0], listener.current !== null && p.playFirst)
    else aim(null, false)
  }
  const change = (p: Prefs) => {
    setPrefs(p)
    restart(p)
  }

  onHit.current = () => {
    playChime('right')
    setScore((s) => ({ right: s.right + 1, streak: s.streak + 1 }))
    if (prefs.exercise === 'match') {
      setMessage(`Yes, ${name(targetRef.current!)}!`)
      const next = randomTarget(prefs.range, prefs.naturalsOnly, targetRef.current, Math.random, VOCAL_LEVELS[prefs.level].span)
      window.setTimeout(() => aim(next, true), 700)
    } else if (prefs.exercise === 'scale') {
      const next = step + 1
      if (next >= run.length) {
        setMessage('Whole scale sung. Beautiful! Again, or try another scale.')
        setStep(0)
        window.setTimeout(() => aim(run[0], prefs.playFirst), 1600)
      } else {
        setMessage(null)
        setStep(next)
        window.setTimeout(() => aim(run[next], prefs.playFirst), 350)
      }
    }
  }

  const start = async () => {
    setError(null)
    try {
      listener.current = await listenForPitch(
        (r) => {
          const now = performance.now()
          const dt = last.current ? Math.min(100, now - last.current) : 16
          last.current = now
          const midi = r && now > muteUntil.current ? r.midi : null
          setSung(midi)
          setTrace((t) => [...t.slice(-(TRACE - 1)), midi])
          // The range: notes held for half a second, so a crack or a breath doesn't count
          if (midi !== null) {
            const n = Math.round(midi)
            if (steady.current?.midi !== n) steady.current = { midi: n, since: now }
            else if (now - steady.current.since > 500) setRange((g) => ({ low: Math.min(g?.low ?? n, n), high: Math.max(g?.high ?? n, n) }))
          } else steady.current = null
          const t = targetRef.current
          if (t === null || done.current) return
          const cents = midi === null ? null : offTarget(midi, t).semitones * 100
          const lv = levelRef.current
          const trying = now - aimedAt.current
          // Beginners get the note played again, then a wider window, if it is taking a while
          if (lv.helpAfterMs !== null && trying > lv.helpAfterMs * 0.6 && !replayed.current) {
            replayed.current = true
            playRef(t)
          }
          const help = lv.helpAfterMs !== null && trying > lv.helpAfterMs
          if (help) setHelped(true)
          const h = timer.current.push(cents, dt, help ? lv.helpTolerance : lv.tolerance, lv.holdMs)
          setHold(h)
          if (h >= 1) {
            done.current = true
            onHit.current()
          }
        },
        { minClarity: 0.85, octaveFix: false },
      )
      setListening(true)
      if (targetRef.current !== null) playRef(targetRef.current)
      else restart(prefs)
    } catch (e) {
      setError(micErrorMessage(e))
    }
  }
  const stop = () => {
    listener.current?.stop()
    listener.current = null
    setListening(false)
    setSung(null)
  }
  useEffect(() => () => listener.current?.stop(), [])
  // Pick the first note once, without playing it until the mic is on
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    restart(prefs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const off = sung !== null && target !== null ? offTarget(sung, target) : null
  const cents = off ? Math.round(off.semitones * 100) : null
  const level = VOCAL_LEVELS[prefs.level]
  const tolerance = helped ? level.helpTolerance : level.tolerance
  const inTune = cents !== null && Math.abs(cents) <= tolerance
  const beginner = prefs.level === 'beginner'
  // The trace is drawn around the target, or around the sung note when singing freely
  const centre = target ?? (sung !== null ? Math.round(sung) : RANGE_BASE[prefs.range] + 7)
  const fold = (m: number) => (target !== null ? target + offTarget(m, target).semitones : m)

  const W = 600
  const H = 220
  const SPAN = 5 // semitones above and below the centre
  const yOf = (m: number) => H / 2 - ((m - centre) / SPAN) * (H / 2 - 12)
  const path = trace
    .map((m, i) => (m === null || Math.abs(fold(m) - centre) > SPAN + 1 ? null : `${(i / (TRACE - 1)) * W},${yOf(fold(m)).toFixed(1)}`))
    .reduce<string[]>((segs, p, i, all) => {
      if (p) segs.push(`${i > 0 && all[i - 1] ? 'L' : 'M'}${p}`)
      return segs
    }, [])
    .join(' ')

  const ex = EXERCISES.find((e) => e.id === prefs.exercise)!

  return (
    <div className="vocal">
      <p className="hint">
        Train your voice with the microphone. Use headphones if you can, or keep the phone a little away so it hears you, not its own
        reference notes.
      </p>
      <div className="row">
        {EXERCISES.map((e) => (
          <button key={e.id} className={prefs.exercise === e.id ? 'chip active' : 'chip'} onClick={() => change({ ...prefs, exercise: e.id })}>
            {e.label}
          </button>
        ))}
      </div>
      <p className="hint">{ex.hint}</p>
      <div className="row">
        <label className="field">
          Level
          <select value={prefs.level} onChange={(e) => change({ ...prefs, level: e.target.value as VocalLevel })}>
            {(Object.keys(VOCAL_LEVELS) as VocalLevel[]).map((l) => (
              <option key={l} value={l}>
                {VOCAL_LEVELS[l].label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Voice
          <select value={prefs.range} onChange={(e) => change({ ...prefs, range: e.target.value as VoiceRange })}>
            <option value="low">Lower voice, most men (from Do3)</option>
            <option value="high">Higher voice, most women (from Do4)</option>
          </select>
        </label>
        {prefs.exercise === 'scale' && (
          <>
            <label className="field">
              Scale
              <select value={prefs.scale} onChange={(e) => change({ ...prefs, scale: e.target.value as ScaleKind })}>
                {(Object.keys(SCALES) as ScaleKind[]).map((k) => (
                  <option key={k} value={k}>
                    {SCALES[k].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Starting on
              <select value={prefs.tonic} onChange={(e) => change({ ...prefs, tonic: Number(e.target.value) })}>
                {TONICS.map((t) => (
                  <option key={t} value={t}>
                    {name(RANGE_BASE[prefs.range] + t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={prefs.playFirst} onChange={(e) => setPrefs({ ...prefs, playFirst: e.target.checked })} /> Play each note first
            </label>
          </>
        )}
        {prefs.exercise === 'match' && (
          <label className="check">
            <input type="checkbox" checked={prefs.naturalsOnly} onChange={(e) => change({ ...prefs, naturalsOnly: e.target.checked })} /> Natural notes only
          </label>
        )}
      </div>

      {prefs.exercise === 'scale' && (
        <div className="vocal-steps" aria-label="Scale">
          {run.map((m, i) => (
            <span key={i} className={i < step ? 'done' : i === step ? 'now' : ''}>
              {solfegeName(m)}
            </span>
          ))}
        </div>
      )}

      <div className={`vocal-card${inTune ? ' in-tune' : ''}`}>
        <div className="vocal-target">
          {target !== null ? (
            <>
              <span className="vocal-label">Sing</span>
              <span className="vocal-big">
                {solfegeName(target)}
                <small>
                  {pitchClassName(target)}
                  <sub>{Math.floor(target / 12) - 1}</sub>
                </small>
              </span>
              <button className="ghost" onClick={() => playRef(target)}>
                ▶ Hear it again
              </button>
            </>
          ) : (
            <>
              <span className="vocal-label">You are singing</span>
              <span className="vocal-big">
                {sung !== null ? solfegeName(Math.round(sung)) : '–'}
                {sung !== null && (
                  <small>
                    {pitchClassName(Math.round(sung))}
                    <sub>{Math.floor(Math.round(sung) / 12) - 1}</sub>
                  </small>
                )}
              </span>
            </>
          )}
        </div>
        <div className="vocal-ring" style={{ ['--hold' as string]: `${Math.round(hold * 100)}%` }} aria-label={target !== null ? `Held ${Math.round(hold * 100)}%` : undefined}>
          <span>
            {cents === null
              ? sung !== null && target === null
                ? `${Math.round((sung - Math.round(sung)) * 100) >= 0 ? '+' : ''}${Math.round((sung - Math.round(sung)) * 100)}`
                : '…'
              : inTune
                ? '✓'
                : beginner
                  ? cents > 0
                    ? 'A bit lower ↓'
                    : 'A bit higher ↑'
                  : cents > 0
                    ? `${cents}¢ high`
                    : `${-cents}¢ low`}
          </span>
        </div>
      </div>

      <svg className="vocal-trace" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Your pitch over the last few seconds">
        {Array.from({ length: SPAN * 2 + 1 }, (_, k) => {
          const m = centre - SPAN + k
          return (
            <g key={k}>
              <line x1={0} x2={W} y1={yOf(m)} y2={yOf(m)} className={m === centre && target !== null ? 'vt-target' : 'vt-line'} />
              <text x={6} y={yOf(m) - 2} className="vt-label">
                {solfegeName(m)}
              </text>
            </g>
          )
        })}
        {target !== null && <rect x={0} width={W} y={yOf(centre + tolerance / 100)} height={yOf(centre - tolerance / 100) - yOf(centre + tolerance / 100)} className="vt-band" />}
        <path d={path} className="vt-path" />
      </svg>

      <div className="row">
        {listening ? (
          <button onClick={stop}>Stop listening</button>
        ) : (
          <button className="primary" onClick={() => void start()}>
            Start singing
          </button>
        )}
        {prefs.exercise === 'match' && listening && (
          <button className="ghost" onClick={() => aim(randomTarget(prefs.range, prefs.naturalsOnly, target, Math.random, VOCAL_LEVELS[prefs.level].span), true)}>
            Skip this note
          </button>
        )}
        {prefs.exercise !== 'free' && score.right > 0 && (
          <span className="quiz-pill">
            {score.right} sung{score.streak >= 3 ? ` · ${score.streak} in a row` : ''}
          </span>
        )}
      </div>
      {off && off.octaves !== 0 && inTune && <p className="hint">Right note, sung {Math.abs(off.octaves) === 1 ? 'an octave' : `${Math.abs(off.octaves)} octaves`} {off.octaves < 0 ? 'lower' : 'higher'}. That counts.</p>}
      {helped && target !== null && !message && <p className="hint">Taking a while? No problem: close enough counts now. Hum it softly first, then sing “la”.</p>}
      {message && <div className="notice">{message}</div>}
      {error && <div className="error">{error}</div>}
      {range && (
        <p className="vocal-range">
          Your range so far: <b>{noteName(range.low)}</b> ({solfegeName(range.low)}) to <b>{noteName(range.high)}</b> ({solfegeName(range.high)}), {range.high - range.low} semitones.{' '}
          <button className="link" onClick={() => setRange(null)}>
            Reset
          </button>
        </p>
      )}
    </div>
  )
}
