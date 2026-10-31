import { useEffect, useRef, useState } from 'react'

const SUBDIVISIONS = [
  { value: 1, label: 'Quarter notes' },
  { value: 2, label: 'Eighth notes' },
  { value: 3, label: 'Triplets' },
  { value: 4, label: 'Sixteenth notes' },
]

/** Web Audio metronome with a look-ahead scheduler so the clicks stay steady. */
export function Metronome() {
  const [bpm, setBpm] = useState(80)
  const [beatsPerBar, setBeatsPerBar] = useState(4)
  const [subdivision, setSubdivision] = useState(1)
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(-1)
  const settings = useRef({ bpm, beatsPerBar, subdivision })
  useEffect(() => {
    settings.current = { bpm, beatsPerBar, subdivision }
  }, [bpm, beatsPerBar, subdivision])
  const taps = useRef<number[]>([])

  useEffect(() => {
    if (!running) return
    const ctx = new AudioContext()
    let next = ctx.currentTime + 0.1
    let step = 0
    const timers: number[] = []
    const click = (time: number, level: 0 | 1 | 2) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = level === 2 ? 1600 : level === 1 ? 1000 : 700
      gain.gain.setValueAtTime(level === 0 ? 0.25 : 0.6, time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
      osc.connect(gain).connect(ctx.destination)
      osc.start(time)
      osc.stop(time + 0.06)
    }
    const interval = window.setInterval(() => {
      const { bpm, beatsPerBar, subdivision } = settings.current
      const stepLength = 60 / bpm / subdivision
      while (next < ctx.currentTime + 0.12) {
        const stepsPerBar = beatsPerBar * subdivision
        const pos = step % stepsPerBar
        const onBeat = pos % subdivision === 0
        click(next, pos === 0 ? 2 : onBeat ? 1 : 0)
        if (onBeat) {
          const b = pos / subdivision
          timers.push(window.setTimeout(() => setBeat(b), Math.max(0, (next - ctx.currentTime) * 1000)))
        }
        next += stepLength
        step = (pos + 1) % stepsPerBar
      }
    }, 25)
    return () => {
      window.clearInterval(interval)
      timers.forEach((t) => window.clearTimeout(t))
      void ctx.close()
      setBeat(-1)
    }
  }, [running])

  const tap = () => {
    const now = performance.now()
    taps.current = [...taps.current.filter((t) => now - t < 2500), now].slice(-6)
    if (taps.current.length >= 2) {
      const gaps = taps.current.slice(1).map((t, i) => t - taps.current[i])
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
      setBpm(Math.max(30, Math.min(240, Math.round(60000 / avg))))
    }
  }

  return (
    <div className="tool">
      <h1>Metronome</h1>
      <div className="metro-bpm">
        <button className="chip" onClick={() => setBpm((b) => Math.max(30, b - 5))} aria-label="5 slower">
          −5
        </button>
        <div>
          <div className="metro-value">{bpm}</div>
          <div className="hint">BPM</div>
        </div>
        <button className="chip" onClick={() => setBpm((b) => Math.min(240, b + 5))} aria-label="5 faster">
          +5
        </button>
      </div>
      <input className="wide" type="range" min={30} max={240} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} aria-label="Tempo" />

      <div className="metro-beats" aria-hidden="true">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <span key={i} className={`metro-beat${beat === i ? ' on' : ''}${i === 0 ? ' first' : ''}`} />
        ))}
      </div>

      <div className="row">
        <button className="primary" onClick={() => setRunning((r) => !r)}>
          {running ? 'Stop' : 'Start'}
        </button>
        <button onClick={tap}>Tap tempo</button>
      </div>

      <div className="row">
        <label className="field">
          Beats per bar
          <select value={beatsPerBar} onChange={(e) => setBeatsPerBar(Number(e.target.value))}>
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Clicks
          <select value={subdivision} onChange={(e) => setSubdivision(Number(e.target.value))}>
            {SUBDIVISIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
