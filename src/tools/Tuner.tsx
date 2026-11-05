import { listenForPitch, micErrorMessage, playTone } from '../audio/pitch'
import { useEffect, useRef, useState } from 'react'
import { noteName, TUNINGS } from '../music/notes'

interface Reading {
  midi: number
  cents: number
  freq: number
  /** string number (1 = highest) of the closest string in the chosen tuning */
  string: number
  centsFromString: number
}

/** Mic tuner: McLeod pitch detection on the live input, compared with the chosen tuning. */
export function Tuner({ initialTuningId = 'standard', heading = 'Tuner' }: { initialTuningId?: string; heading?: string } = {}) {
  const [tuningId, setTuningId] = useState(initialTuningId)
  const [listening, setListening] = useState(false)
  const [reading, setReading] = useState<Reading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const tuning = TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0]
  const tuningRef = useRef(tuning)
  useEffect(() => {
    tuningRef.current = tuning
  }, [tuning])

  const start = async () => {
    setError(null)
    try {
      const listener = await listenForPitch((r) => {
        if (!r) return
        const strings = tuningRef.current.strings
        let best = 0
        strings.forEach((s, i) => {
          if (Math.abs(s - r.midi) < Math.abs(strings[best] - r.midi)) best = i
        })
        const nearest = Math.round(r.midi)
        setReading({
          midi: nearest,
          cents: Math.round((r.midi - nearest) * 100),
          freq: r.freq,
          string: best + 1,
          centsFromString: Math.round((r.midi - strings[best]) * 100),
        })
      })
      setListening(true)
      stopRef.current = () => {
        listener.stop()
        setListening(false)
      }
    } catch (e) {
      setError(micErrorMessage(e))
    }
  }

  useEffect(() => () => stopRef.current?.(), [])

  const playReference = (midi: number) => playTone(midi, 2)

  const inTune = reading && Math.abs(reading.centsFromString) <= 5
  const needle = reading ? Math.max(-50, Math.min(50, reading.centsFromString)) : 0

  return (
    <div className="tool">
      <h1>{heading}</h1>
      <label className="field">
        Tuning
        <select value={tuningId} onChange={(e) => setTuningId(e.target.value)}>
          {TUNINGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <div className={`tuner-display${inTune ? ' in-tune' : ''}`}>
        <div className="tuner-note">{reading ? noteName(reading.midi) : '–'}</div>
        <div className="tuner-meter" aria-hidden="true">
          <div className="tuner-center" />
          <div className="tuner-needle" style={{ left: `${50 + needle}%` }} />
        </div>
        <div className="tuner-text">
          {reading
            ? `String ${reading.string} (${noteName(tuning.strings[reading.string - 1])}): ${
                inTune ? 'in tune' : reading.centsFromString < 0 ? `${-reading.centsFromString} cents flat, tighten` : `${reading.centsFromString} cents sharp, loosen`
              }`
            : listening
              ? 'Play one string at a time'
              : 'Start the tuner and allow the microphone'}
        </div>
      </div>

      <div className="row">
        {listening ? (
          <button onClick={() => stopRef.current?.()}>Stop listening</button>
        ) : (
          <button className="primary" onClick={start}>
            Start tuner
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}

      <h2>Reference notes</h2>
      <div className="row">
        {[...tuning.strings].reverse().map((m, i) => (
          <button key={i} className={reading?.string === tuning.strings.length - i ? 'chip active' : 'chip'} onClick={() => playReference(m)}>
            {tuning.strings.length - i}: {noteName(m)}
          </button>
        ))}
      </div>
      <p className="hint">If a song uses a capo, tune to standard first, then put the capo on.</p>
    </div>
  )
}
