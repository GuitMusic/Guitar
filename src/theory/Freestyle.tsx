import { useEffect, useRef, useState } from 'react'
import { audioNow, listenForPitch, micErrorMessage, playToneAt, type PitchListener } from '../audio/pitch'
import { Fretboard, type FretboardOptions, type FretMark } from '../components/Fretboard'
import { NoteEvents } from '../quiz/quiz'
import { dot } from './neck'
import { degreeOf, nameIn, progressionChords, scale, scaleNames, spotsOf, toneLabel, type Chord, type Key, type Progression } from './theory'

interface Props {
  tuning: number[]
  keyInfo: Key
  progressions: Progression[]
  progression: Progression
  onProgression: (id: string) => void
  options: FretboardOptions
}

const BEATS = 4

/** Bass note for a chord: its root between E2 and D#3. */
const bassOf = (pc: number) => 40 + ((((pc - 4) % 12) + 12) % 12)

/** The chord's tones from G3 up, in close position. */
function voicing(c: Chord): number[] {
  const r = 55 + ((((c.root - 7) % 12) + 12) % 12)
  return c.tones.map((pc) => r + ((((pc - c.root) % 12) + 12) % 12))
}

/**
 * Improvise over a looping progression: the app plays bass and chords, the neck shows
 * the key's notes, with the current chord's notes lit. With the mic on, what you play
 * lights up too: green in the chord, orange in the key, red outside it.
 */
export function Freestyle({ tuning, keyInfo, progressions, progression, onProgression, options }: Props) {
  const [bpm, setBpm] = useState(80)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState({ bar: 0, beat: 0 })
  const [listen, setListen] = useState(false)
  const [heard, setHeard] = useState<FretMark[]>([])
  const [error, setError] = useState<string | null>(null)
  const chords = progressionChords(keyInfo, progression)
  const chord = chords[pos.bar % chords.length]
  const next = chords[(pos.bar + 1) % chords.length]
  const names = scaleNames(keyInfo)

  // The loop: schedules a little ahead on the audio clock, and moves the display on each beat
  const sched = useRef({ next: 0, beat: 0, timer: 0, shows: [] as number[] })
  const live = useRef({ chords, bpm })
  useEffect(() => {
    live.current = { chords, bpm }
  })
  useEffect(() => {
    if (!playing) return
    const S = sched.current
    S.next = audioNow() + 0.15
    S.beat = 0
    const tick = () => {
      const { chords: cs, bpm: tempo } = live.current
      const spb = 60 / tempo
      while (S.next < audioNow() + 0.2) {
        const bar = Math.floor(S.beat / BEATS)
        const beat = S.beat % BEATS
        const c = cs[bar % cs.length]
        const v = voicing(c)
        // bass on 1 and 3 (root, then fifth), chord on every beat, accented on 1
        if (beat === 0) playToneAt(bassOf(c.root), S.next, spb * 1.9, 0.42)
        if (beat === 2) playToneAt(bassOf(c.tones[2]), S.next, spb * 1.9, 0.32)
        v.forEach((m, i) => playToneAt(m, S.next + i * 0.012, spb * 0.9, beat === 0 ? 0.2 : 0.11))
        const at = (S.next - audioNow()) * 1000
        const id = window.setTimeout(() => setPos({ bar, beat }), Math.max(0, at))
        S.shows.push(id)
        S.next += spb
        S.beat++
      }
    }
    tick()
    S.timer = window.setInterval(tick, 40)
    return () => {
      window.clearInterval(S.timer)
      S.shows.forEach((t) => window.clearTimeout(t))
      S.shows = []
      setPos({ bar: 0, beat: 0 })
    }
  }, [playing])

  // Optional mic: light up each note you play
  const mic = useRef<PitchListener | null>(null)
  const chordRef = useRef(chord)
  useEffect(() => {
    chordRef.current = chord
  })
  useEffect(() => {
    if (!listen) return
    let stopped = false
    const events = new NoteEvents(5)
    let n = 0
    listenForPitch((reading) => {
      const note = events.push(reading ? reading.midi : null)
      if (note === null) return
      const pc = note % 12
      const result: FretMark['result'] = chordRef.current.tones.includes(pc) ? 'hit' : degreeOf(keyInfo, pc) ? 'late' : 'miss'
      const spots = spotsOf(tuning, [pc]).filter((s) => s.midi === note || s.midi === note - 12 || s.midi === note + 12)
      n++
      setHeard(spots.map((s) => ({ key: `h${n}-${s.string}:${s.fret}`, string: s.string, fret: s.fret, result, fade: true })))
    })
      .then((l) => {
        if (stopped) l.stop()
        else mic.current = l
      })
      .catch((e) => {
        setError(micErrorMessage(e))
        setListen(false)
      })
    return () => {
      stopped = true
      mic.current?.stop()
      mic.current = null
      setHeard([])
    }
  }, [listen, keyInfo, tuning])

  const pcs = scale(keyInfo)
  const shownPcs = [...new Set([...pcs, ...chord.tones])]
  const dots = spotsOf(tuning, shownPcs).map((s) => {
    const i = chord.tones.indexOf(s.midi % 12)
    return i < 0
      ? dot(tuning, s.string, s.fret, { label: nameIn(keyInfo, s.midi % 12), tone: 'scale' })
      : dot(tuning, s.string, s.fret, { label: chord.toneNames[i], tone: i === 0 ? 'root' : 'chord' })
  })

  return (
    <section className="theory-section freestyle">
      <div className="row theory-controls">
        <label className="field">
          Loop
          <select value={progression.id} onChange={(e) => onProgression(e.target.value)}>
            {progressions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Tempo {bpm}
          <input type="range" min={50} max={140} step={5} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
        </label>
        <button className={playing ? '' : 'primary'} onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Stop' : 'Start the loop'}
        </button>
        <label className="check">
          <input type="checkbox" checked={listen} onChange={(e) => { setError(null); setListen(e.target.checked) }} /> Listen to me
        </label>
      </div>
      {error && <div className="error">{error}</div>}

      <div className="freestyle-now">
        <div className="freestyle-chords">
          {chords.map((c, i) => (
            <span key={i} className={i === pos.bar % chords.length && playing ? 'on' : ''}>
              <small>{c.roman}</small>
              {c.name}
            </span>
          ))}
        </div>
        <div className="freestyle-beats" aria-hidden="true">
          {Array.from({ length: BEATS }, (_, b) => (
            <i key={b} className={playing && pos.beat === b ? (b === 0 ? 'on one' : 'on') : ''} />
          ))}
        </div>
        <p className="hint">
          {playing
            ? `Now ${chord.name}: aim for ${chord.toneNames.map((n, i) => `${n} (${toneLabel(chord.quality, i)})`).join(', ')}. Next: ${next.name}.`
            : `${progression.about} Start the loop and play along in ${names[0]} ${keyInfo.mode}.`}
        </p>
      </div>

      <Fretboard notes={dots} ghosts={[]} tuning={tuning} capo={0} maxFret={12} showPickZone={false} options={options} marks={heard} />

      <div className="freestyle-tips">
        <strong>How to start improvising</strong>
        <ol>
          <li>Play only the coloured notes (the chord) for a few rounds. Change when the chord changes.</li>
          <li>Pick one area of the neck and find the nearest coloured note for each new chord.</li>
          <li>Walk between them with the grey notes. Every note shown fits the key.</li>
          <li>Leave space, repeat little ideas, and end phrases on the pink root.</li>
        </ol>
        {listen && <p className="hint">Your notes light up: green fits the chord, orange is in the key, red is outside it.</p>}
      </div>
    </section>
  )
}
