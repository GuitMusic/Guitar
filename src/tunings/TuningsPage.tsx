import { useState } from 'react'
import { Fretboard } from '../components/Fretboard'
import { setView, useFretboardView } from '../components/fretboardView'
import { playTone } from '../audio/pitch'
import { noteName, parsePitchClass } from '../music/notes'
import type { FretNote } from '../music/types'
import { BUILT_IN_SONGS, type OpenSong } from '../library/songs'
import { Tuner } from '../tools/Tuner'
import { presetNoteFinder } from '../quiz/preset'
import { ChordDiagram } from './ChordDiagram'
import { GUIDES, retuneSteps, type AltTuningId, type ChordShape } from './guide'

const KEY = 'tunings-page-v1'
const LEVELS = { 1: 'Beginner', 2: 'Easy', 3: 'Intermediate', 4: 'Intermediate+' } as const
const NECK_FRETS = 12

function loadTuning(): AltTuningId {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'dadgad' || v === 'open-d') return v
  } catch {
    // storage unavailable
  }
  return 'dadgad'
}

/** Strums a chord from the low string up, the way a thumb brush sounds. */
function strum(open: number[], frets: (number | null)[]) {
  frets.forEach((f, i) => {
    if (f !== null) window.setTimeout(() => playTone(open[i] + f, 2.4), i * 45)
  })
}

const ordinal = (n: number) => ['', '1st', '2nd', '3rd', '4th', '5th', '6th'][n]

function stepText(semitones: number): string {
  if (semitones === 0) return 'stays'
  const size = Math.abs(semitones) === 1 ? 'a half step (1 fret)' : Math.abs(semitones) === 2 ? 'a whole step (2 frets)' : `${Math.abs(semitones)} frets`
  return `${semitones < 0 ? 'down' : 'up'} ${size}`
}

interface Props {
  onOpen: (song: OpenSong) => void
  onGo: (page: 'quiz') => void
}

/** Lessons, tuning help, a note map, chord charts and a practice path for DADGAD and Open D. */
export function TuningsPage({ onOpen, onGo }: Props) {
  const [id, setId] = useState<AltTuningId>(loadTuning)
  const choose = (next: AltTuningId) => {
    setId(next)
    setScale('all')
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // not remembered
    }
  }
  const guide = GUIDES.find((g) => g.id === id)!
  const view = useFretboardView()
  const [scale, setScale] = useState('all')
  const [tunerOpen, setTunerOpen] = useState(false)
  const [lesson, setLesson] = useState(0)
  const steps = retuneSteps(guide.strings)
  // string 6 first, as the chord charts list frets
  const openLowFirst = [...guide.strings].reverse()

  const scaleView = guide.scales.find((s) => s.id === scale) ?? guide.scales[0]
  const { lit, names } = (() => {
    const pcs = new Set(scaleView.notes.map((n) => parsePitchClass(n)))
    const spots: FretNote[] = guide.strings.flatMap((open, i) =>
      Array.from({ length: NECK_FRETS + 1 }, (_, fret) => ({
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
    return pcs.size === 0 ? { lit: [], names: spots } : { lit: spots.filter((s) => pcs.has(s.midi % 12)), names: [] }
  })()

  const pieces = BUILT_IN_SONGS.filter((s) => s.tuning === id)
  const studies = pieces.filter((s) => s.kind === 'study')
  const songs = pieces.filter((s) => s.kind === 'song').sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
  const groups = [...new Set(guide.chords.map((c) => c.group))]

  const piece = (s: OpenSong, i?: number) => (
    <li key={s.id}>
      <button className="tn-piece" onClick={() => onOpen(s)}>
        {i !== undefined && <span className="tn-step">{i + 1}</span>}
        <span className="tn-piece-text">
          <strong>{s.title.replace(/^(DADGAD|Open D) \d: /, '')}</strong>
          <small>{s.description}</small>
        </span>
        {s.level && <span className={`tile-level level-${s.level}`}>{LEVELS[s.level]}</span>}
      </button>
    </li>
  )

  return (
    <div className="tunings">
      <header className="tn-head">
        <p className="eyebrow">Alternate tunings</p>
        <h1>Play in DADGAD and Open D</h1>
        <p className="tn-intro">
          New tunings make the guitar ring in a new way. Here is everything you need to start: how to tune, what changes, where the
          notes are, the chord shapes, and a path from first exercises to full songs.
        </p>
        <div className="segmented tn-switch" role="tablist" aria-label="Tuning">
          {GUIDES.map((g) => (
            <button key={g.id} role="tab" aria-selected={g.id === id} className={g.id === id ? 'active' : ''} onClick={() => choose(g.id)}>
              {g.name}
            </button>
          ))}
        </div>
      </header>

      <section className="tn-hero">
        <div className="tn-hero-text">
          <h2>{guide.name}</h2>
          <p>{guide.tagline}</p>
          <button className="primary" onClick={() => strum(openLowFirst, [0, 0, 0, 0, 0, 0])}>
            Hear the open strings
          </button>
        </div>
        <ol className="tn-strings" aria-label="Open strings, low to high">
          {steps.map((s) => (
            <li key={s.string} className={s.semitones ? 'changed' : ''}>
              <button onClick={() => playTone(s.to, 2)} title={`Play string ${s.string}: ${noteName(s.to)}`}>
                <span className="tn-letter">{noteName(s.to).replace(/\d/, '')}</span>
                <small>{s.string}</small>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="tn-card">
        <h2>
          <span className="tn-num">1</span> Tune your guitar
        </h2>
        <ul className="tn-retune">
          {steps.map((s) => (
            <li key={s.string} className={s.semitones ? 'changed' : ''}>
              <span className="tn-retune-string">{ordinal(s.string)} string</span>
              <span className="tn-retune-notes">
                {noteName(s.from).replace(/\d/, '')} {s.semitones ? '→' : ''} {s.semitones ? <b>{noteName(s.to).replace(/\d/, '')}</b> : ''}
              </span>
              <span className="tn-retune-how">{stepText(s.semitones)}</span>
              <button className="chip" onClick={() => playTone(s.to, 2)} aria-label={`Play ${noteName(s.to)}`}>
                ▶ {noteName(s.to)}
              </button>
            </li>
          ))}
        </ul>
        <p className="hint">
          Turn the tuning pegs slowly and check every string twice: lowering some strings lets the neck relax a little, which pulls the
          others slightly flat. To go back, tune to standard the same way.
        </p>
        <button className={tunerOpen ? 'ghost' : 'primary'} onClick={() => setTunerOpen((o) => !o)}>
          {tunerOpen ? 'Hide the tuner' : `Open the tuner in ${guide.name}`}
        </button>
        {tunerOpen && (
          <div className="tn-tuner">
            <Tuner key={id} initialTuningId={id} heading={`Tuner: ${guide.name}`} />
          </div>
        )}
      </section>

      <section className="tn-card">
        <h2>
          <span className="tn-num">2</span> How it works
        </h2>
        <div className="tn-lessons">
          <div className="tn-lesson-tabs" role="tablist" aria-label="Lessons">
            {guide.lessons.map((l, i) => (
              <button key={l.title} role="tab" aria-selected={lesson === i} className={lesson === i ? 'on' : ''} onClick={() => setLesson(i)}>
                <span className="tn-lesson-n">{i + 1}</span> {l.title}
              </button>
            ))}
          </div>
          <article className="tn-lesson" role="tabpanel">
            <h3>{guide.lessons[lesson]?.title}</h3>
            {guide.lessons[lesson]?.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <div className="row">
              <button className="ghost" disabled={lesson === 0} onClick={() => setLesson((l) => l - 1)}>
                Back
              </button>
              <button className="ghost" disabled={lesson >= guide.lessons.length - 1} onClick={() => setLesson((l) => l + 1)}>
                Next lesson
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="tn-card">
        <h2>
          <span className="tn-num">3</span> Notes on the neck
        </h2>
        <div className="row tn-scales">
          {guide.scales.map((s) => (
            <button key={s.id} className={s.id === scale ? 'chip active' : 'chip'} onClick={() => setScale(s.id)}>
              {s.label}
            </button>
          ))}
          <label className="check">
            <input type="checkbox" checked={view.leftHanded} onChange={(e) => setView({ leftHanded: e.target.checked })} /> Left-handed
          </label>
        </div>
        <p className="hint">{scaleView.hint} Tap any spot to hear it.</p>
        <div className="tn-neck">
          <Fretboard
            notes={lit}
            ghosts={[]}
            names={names}
            tuning={guide.strings}
            capo={0}
            maxFret={NECK_FRETS}
            showPickZone={false}
            highlightStrings={steps.filter((s) => s.semitones).map((s) => s.string)}
            onFretClick={(_, __, midi) => playTone(midi, 1.4)}
            options={{ ...view, labelMode: 'note', showGhosts: false }}
          />
        </div>
        <div className="row">
          <button
            className="ghost"
            onClick={() => {
              presetNoteFinder(id, 'live')
              onGo('quiz')
            }}
          >
            Find notes live with the mic in {guide.name}
          </button>
          <button
            className="ghost"
            onClick={() => {
              presetNoteFinder(id, 'free')
              onGo('quiz')
            }}
          >
            Quiz yourself in {guide.name}
          </button>
        </div>
      </section>

      <section className="tn-card">
        <h2>
          <span className="tn-num">4</span> Chord shapes
        </h2>
        <p className="hint">
          Numbers in the dots are fretting fingers: 1 index, 2 middle, 3 ring, 4 little. ○ = open string, × = don’t play it. Charts are
          drawn {view.leftHanded ? 'for the left hand: low string on the right' : 'for the right hand: low string on the left'}. Tap a chord
          to hear it.
        </p>
        {groups.map((g) => (
          <div key={g}>
            <h3 className="tn-group">{g}</h3>
            <ul className="tn-chords">
              {guide.chords
                .filter((c) => c.group === g)
                .map((c: ChordShape) => (
                  <li key={c.name}>
                    <button className="tn-chord" onClick={() => strum(openLowFirst, c.frets)}>
                      <strong>{c.name}</strong>
                      <ChordDiagram chord={c} leftHanded={view.leftHanded} />
                      <small className="tn-chord-frets">{c.frets.map((f) => (f === null ? '×' : f)).join(' ')}</small>
                      {c.tip && <small className="tn-chord-tip">{c.tip}</small>}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="tn-card">
        <h2>
          <span className="tn-num">5</span> Practice path
        </h2>
        <p className="hint">{guide.practiceTip}</p>
        <h3 className="tn-group">Exercises</h3>
        <ol className="tn-pieces">{studies.map((s, i) => piece(s, i))}</ol>
        <h3 className="tn-group">Songs in {guide.name}</h3>
        <ul className="tn-pieces">{songs.map((s) => piece(s))}</ul>
      </section>
    </div>
  )
}
