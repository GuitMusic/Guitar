import { useEffect, useRef, useState } from 'react'
import { listenForPitch, micErrorMessage, playTone, type PitchListener } from '../audio/pitch'
import { Fretboard, type FretMark } from '../components/Fretboard'
import { setView, useFretboardView } from '../components/fretboardView'
import { noteName, pitchClassName, solfegeName } from '../music/notes'
import type { FretNote } from '../music/types'
import { NoteEvents } from './quiz'

const FRETS = 12
/** How long a note stays lit after the mic stops hearing it clearly, in ms. */
const HOLD_MS = 1400
const HISTORY = 10

type Names = 'all' | 'naturals' | 'off'

const NAME_CHOICES: { id: Names; label: string }[] = [
  { id: 'all', label: 'All notes' },
  { id: 'naturals', label: 'Naturals' },
  { id: 'off', label: 'Hidden' },
]

const NATURAL = new Set([0, 2, 4, 5, 7, 9, 11])

interface Heard {
  midi: number
  /** How far off the note, in cents (-50 to 50). */
  cents: number
}

interface Played {
  id: number
  midi: number
}

function loadNames(): Names {
  try {
    const v = localStorage.getItem('live-neck-names')
    return v === 'naturals' || v === 'off' ? v : 'all'
  } catch {
    return 'all'
  }
}

const ordinal = (n: number) => ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][n] ?? `${n}th`

/** Every spot on the neck, up to FRETS, as fretboard notes. */
function allSpots(tuning: number[]): FretNote[] {
  return tuning.flatMap((open, i) =>
    Array.from({ length: FRETS + 1 }, (_, fret) => ({
      key: `${i + 1}:${fret}`,
      string: i + 1,
      fret,
      tabFret: fret,
      midi: open + fret,
      lh: null,
      rh: null,
      lhInferred: false,
      rhInferred: false,
    })),
  )
}

function tuneText(cents: number): string {
  const c = Math.round(cents)
  if (Math.abs(c) <= 8) return 'In tune'
  return c > 0 ? `${c} cents sharp` : `${-c} cents flat`
}

/**
 * Live neck: the whole fretboard with its note names. Play any note on your guitar
 * and the microphone lights up every spot where that exact note lives.
 */
export function LiveNeck({ tuning }: { tuning: number[] }) {
  const view = useFretboardView()
  const [names, setNames] = useState<Names>(loadNames)
  const [listening, setListening] = useState(false)
  const [starting, setStarting] = useState(false)
  const [heard, setHeard] = useState<Heard | null>(null)
  const [history, setHistory] = useState<Played[]>([])
  const [error, setError] = useState<string | null>(null)

  const listener = useRef<PitchListener | null>(null)
  const events = useRef(new NoteEvents(5))
  const S = useRef({ midi: null as number | null, lastClear: 0, cents: 0, ignoreUntil: 0, nextId: 1, lastPaint: 0 })

  useEffect(() => {
    try {
      localStorage.setItem('live-neck-names', names)
    } catch {
      /* storage may be unavailable */
    }
  }, [names])

  const stop = () => {
    listener.current?.stop()
    listener.current = null
    S.current.midi = null
    setListening(false)
    setHeard(null)
  }

  useEffect(() => () => listener.current?.stop(), [])

  const start = async () => {
    setError(null)
    setStarting(true)
    events.current.reset()
    try {
      listener.current = await listenForPitch((reading) => {
        const st = S.current
        const now = performance.now()
        if (now < st.ignoreUntil) return
        const note = events.current.push(reading ? reading.midi : null)
        if (reading && st.midi !== null && Math.round(reading.midi) === st.midi) {
          st.lastClear = now
          // a slow average, so the tuning readout does not flicker
          st.cents = st.cents * 0.8 + (reading.midi - st.midi) * 100 * 0.2
        }
        if (note !== null) {
          st.midi = note
          st.lastClear = now
          st.cents = reading ? (reading.midi - note) * 100 : 0
          const id = st.nextId++
          setHistory((h) => [...h.slice(-(HISTORY - 1)), { id, midi: note }])
          st.lastPaint = now
          setHeard({ midi: note, cents: st.cents })
          return
        }
        if (st.midi !== null && now - st.lastClear > HOLD_MS) {
          st.midi = null
          events.current.reset()
          setHeard(null)
          return
        }
        // refresh the tuning readout a few times a second, not every frame
        if (st.midi !== null && reading && now - st.lastPaint > 150) {
          st.lastPaint = now
          setHeard({ midi: st.midi, cents: st.cents })
        }
      })
      setListening(true)
    } catch (e) {
      setError(micErrorMessage(e))
    } finally {
      setStarting(false)
    }
  }

  // Tapping the neck plays the note; the mic ignores it so it does not light up by itself
  const onFretClick = (_s: number, _f: number, midi: number) => {
    S.current.ignoreUntil = performance.now() + 1700
    playTone(midi)
  }

  const spots = allSpots(tuning)
  const lit = heard ? spots.filter((n) => n.midi === heard.midi) : []
  const litKeys = new Set(lit.map((n) => n.key))
  const shownNames = spots.filter((n) => n.fret > 0 && !litKeys.has(n.key) && (names === 'all' || (names === 'naturals' && NATURAL.has(n.midi % 12))))
  // The same note name in other octaves, ringed more quietly
  const octaves: FretMark[] = heard
    ? spots
        .filter((n) => n.midi !== heard.midi && (n.midi - heard.midi) % 12 === 0)
        .map((n) => ({ key: `o${n.key}`, string: n.string, fret: n.fret, result: 'octave' as const }))
    : []
  const where = [...lit]
    .sort((a, b) => a.fret - b.fret)
    .map((n) => (n.fret === 0 ? `${ordinal(n.string)} string open` : `${ordinal(n.string)} string, fret ${n.fret}`))

  return (
    <div className="live-neck">
      <p className="hint">
        Every note on the neck, up to the 12th fret. Start listening and play any single note: it lights up everywhere it lives on the neck. Tap a spot to hear it.
      </p>

      <div className={`live-card${heard ? ' on' : ''}`}>
        <div className="live-note" aria-live="polite">
          {heard ? (
            <span key={history[history.length - 1]?.id} className="live-name">
              {pitchClassName(heard.midi)}
              <sub>{Math.floor(heard.midi / 12) - 1}</sub>
              <span className="solfa">{solfegeName(heard.midi)}</span>
            </span>
          ) : (
            <span className="live-name idle">{listening ? '…' : '–'}</span>
          )}
        </div>
        <div className="live-info">
          {heard ? (
            <>
              <div className="live-where">{where.length ? where.join(' · ') : `${noteName(heard.midi)} is past the 12th fret`}</div>
              <div className="live-tune" aria-label={tuneText(heard.cents)}>
                <div className="live-tune-bar">
                  <i style={{ left: `${50 + Math.max(-50, Math.min(50, heard.cents))}%` }} className={Math.abs(heard.cents) <= 8 ? 'ok' : ''} />
                </div>
                <span>{tuneText(heard.cents)}</span>
              </div>
            </>
          ) : (
            <div className="live-where muted">{listening ? 'Listening. Play one note at a time.' : 'The mic is off.'}</div>
          )}
          <div className="row live-actions">
            {listening ? (
              <button onClick={stop}>Stop listening</button>
            ) : (
              <button className="primary" onClick={() => void start()} disabled={starting}>
                {starting ? 'Starting…' : 'Start listening'}
              </button>
            )}
            {listening && <span className="live-dot" aria-hidden="true" />}
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="row live-options">
        <div className="segmented" role="radiogroup" aria-label="Note names">
          {NAME_CHOICES.map((c) => (
            <button key={c.id} role="radio" aria-checked={names === c.id} className={names === c.id ? 'active' : ''} onClick={() => setNames(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={view.leftHanded} onChange={(e) => setView({ ...view, leftHanded: e.target.checked })} /> Left-handed
        </label>
      </div>

      <Fretboard
        notes={lit}
        ghosts={[]}
        names={shownNames}
        tuning={tuning}
        capo={0}
        maxFret={FRETS}
        showPickZone={false}
        marks={octaves}
        onFretClick={onFretClick}
        options={{ ...view, labelMode: 'note', showGhosts: false }}
      />

      <div className="live-history">
        <span className="field-label">Last notes</span>
        {history.length ? (
          history.map((p) => (
            <span key={p.id} className="live-chip">
              {noteName(p.midi)}
            </span>
          ))
        ) : (
          <span className="hint">The notes you play show up here.</span>
        )}
        {history.length > 0 && (
          <button className="link" onClick={() => setHistory([])}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
