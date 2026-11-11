import { useEffect, useState } from 'react'
import { audioNow, playTone, playToneAt } from '../audio/pitch'
import { Fretboard } from '../components/Fretboard'
import { useFretboardView } from '../components/fretboardView'
import type { FretNote } from '../music/types'
import { STANDARD_TUNING } from '../music/notes'
import { Freestyle } from './Freestyle'
import { TheoryDrills } from './TheoryDrills'
import { chordSound, dot, strum, voice } from './neck'
import {
  degreeOf,
  INVERSIONS,
  keyChords,
  keyName,
  PROGRESSIONS,
  progressionChords,
  scale,
  scaleBoxes,
  scaleNames,
  spotsOf,
  stepPattern,
  toneLabel,
  tonicName,
  triadVoicings,
  type Chord,
  type Key,
  type KeyMode,
} from './theory'

type Tab = 'scale' | 'triads' | 'chords' | 'freestyle' | 'test'

interface Prefs {
  tab: Tab
  tonic: number
  mode: KeyMode
  labels: 'names' | 'degrees'
  box: number
  stringSet: number
  chord: number
  progression: string
}

const DEFAULTS: Prefs = { tab: 'scale', tonic: 7, mode: 'major', labels: 'names', box: -1, stringSet: 3, chord: 1, progression: 'pop' }

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('theory-prefs') ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'scale', label: 'Scale' },
  { id: 'triads', label: 'Triads' },
  { id: 'chords', label: 'Chords in a key' },
  { id: 'freestyle', label: 'Freestyle' },
  { id: 'test', label: 'Test yourself' },
]

const STRING_SETS = [
  { low: 3, label: 'Strings 3 2 1' },
  { low: 4, label: 'Strings 4 3 2' },
  { low: 5, label: 'Strings 5 4 3' },
  { low: 6, label: 'Strings 6 5 4' },
]

/** Scales, triads, the chords of a key, freestyle over a loop, and a quiz: theory on the neck. */
export function TheoryPage() {
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs)
  const setPrefs = (p: Partial<Prefs>) => setPrefsState((old) => ({ ...old, ...p }))
  useEffect(() => {
    try {
      localStorage.setItem('theory-prefs', JSON.stringify(prefs))
    } catch {
      // storage unavailable
    }
  }, [prefs])
  const view = useFretboardView()
  const tuning = STANDARD_TUNING
  const key: Key = { tonic: prefs.tonic, mode: prefs.mode }
  const names = scaleNames(key)
  const pcs = scale(key)
  const chords = keyChords(key)
  const progressions = PROGRESSIONS.filter((p) => p.mode === key.mode)
  const progression = progressions.find((p) => p.id === prefs.progression) ?? progressions[0]
  const fbOptions = { ...view, labelMode: 'note' as const, showGhosts: false }
  const play = (n: FretNote) => playTone(n.midi, 1.2)

  const keyPicker = (
    <div className="theory-keys">
      <div className="theory-tonics" role="radiogroup" aria-label="Key">
        {Array.from({ length: 12 }, (_, t) => (
          <button key={t} role="radio" aria-checked={prefs.tonic === t} className={prefs.tonic === t ? 'chip active' : 'chip'} onClick={() => setPrefs({ tonic: t })}>
            {tonicName({ tonic: t, mode: prefs.mode })}
          </button>
        ))}
      </div>
      <div className="segmented" role="radiogroup" aria-label="Major or minor">
        {(['major', 'minor'] as const).map((m) => (
          <button key={m} role="radio" aria-checked={prefs.mode === m} className={prefs.mode === m ? 'active' : ''} onClick={() => setPrefs({ mode: m, tonic: m === prefs.mode ? prefs.tonic : m === 'minor' ? (prefs.tonic + 9) % 12 : (prefs.tonic + 3) % 12 })}>
            {m === 'major' ? 'Major' : 'Minor'}
          </button>
        ))}
      </div>
    </div>
  )

  // ---- Scale
  const boxes = scaleBoxes(tuning, key)
  const box = boxes[prefs.box]
  const scaleDots = spotsOf(tuning, pcs)
    .filter((s) => !box || (s.fret >= box.from && s.fret <= box.to))
    .map((s) => {
      const d = degreeOf(key, s.midi % 12)!
      return dot(tuning, s.string, s.fret, { label: prefs.labels === 'degrees' ? String(d) : names[d - 1], tone: d === 1 ? 'root' : d === 3 || d === 5 ? 'chord' : 'scale' })
    })
  const playScale = () => {
    const t = audioNow() + 0.05
    const start = voice(key.tonic, 52)
    const up = [...pcs.map((pc) => start + ((((pc - key.tonic) % 12) + 12) % 12)), start + 12]
    ;[...up, ...up.slice(0, -1).reverse()].forEach((m, i) => playToneAt(m, t + i * 0.32, 0.6, 0.4))
  }
  const steps = stepPattern(key.mode)
  const relative = key.mode === 'major' ? `${names[5]} minor` : `${names[2]} major`

  // ---- Triads
  const chord = chords[Math.min(6, Math.max(0, prefs.chord - 1))]
  const set = STRING_SETS.find((s) => s.low === prefs.stringSet) ?? STRING_SETS[0]
  const voicings = ([0, 1, 2] as const).flatMap((inv) => triadVoicings(tuning, chord.root, chord.quality, set.low, inv))
  const triadDots: FretNote[] = []
  for (const v of voicings)
    for (const n of v.notes)
      if (!triadDots.some((d) => d.string === n.string && d.fret === n.fret))
        triadDots.push(dot(tuning, n.string, n.fret, { label: toneLabel(chord.quality, n.tone), tone: n.tone === 0 ? 'root' : 'chord' }))
  const firstOf = (inv: 0 | 1 | 2) => voicings.find((v) => v.inversion === inv)

  // ---- Chords in a key
  const shown = chords[Math.min(6, Math.max(0, prefs.chord - 1))]
  const keyChordDots = spotsOf(tuning, pcs).map((s) => {
    const i = shown.tones.indexOf(s.midi % 12)
    return i < 0
      ? dot(tuning, s.string, s.fret, { label: names[degreeOf(key, s.midi % 12)! - 1], tone: 'scale' })
      : dot(tuning, s.string, s.fret, { label: toneLabel(shown.quality, i), tone: i === 0 ? 'root' : 'chord' })
  })
  const playProgression = (cs: Chord[]) => {
    const t = audioNow() + 0.05
    cs.forEach((c, i) => chordSound(c).forEach((m, j) => playToneAt(m, t + i * 1.1 + j * 0.035, 1.2, 0.3)))
  }

  return (
    <div className="theory">
      <div className="theory-head">
        <h1>Theory</h1>
        <p className="hint">Scales, triads and the chords of a key, shown on your neck. Learn how songs are built, then improvise over a loop.</p>
      </div>
      <div className="segmented quiz-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={prefs.tab === t.id} className={prefs.tab === t.id ? 'active' : ''} onClick={() => setPrefs({ tab: t.id })}>
            {t.label}
          </button>
        ))}
      </div>

      {prefs.tab !== 'test' && keyPicker}

      {prefs.tab === 'scale' && (
        <section className="theory-section">
          <h2>{keyName(key)} scale</h2>
          <div className="degree-strip">
            {names.map((n, i) => (
              <span key={n} className="degree-cell">
                <span className={`degree-note${i === 0 ? ' root' : i === 2 || i === 4 ? ' chord' : ''}`}>
                  <strong>{n}</strong>
                  <small>{i + 1}</small>
                </span>
                <span className="degree-step">{steps[i]}</span>
              </span>
            ))}
            <span className="degree-note root">
              <strong>{names[0]}</strong>
              <small>8</small>
            </span>
          </div>
          <p className="hint">
            {key.mode === 'major'
              ? `Seven notes with the step pattern W W H W W W H (W = 2 frets, H = 1 fret). Number them 1 to 7: musicians talk about notes and chords by these numbers. 1, 3 and 5 (coloured) make the home chord, ${chords[0].name}. ${names[0]} major has the same notes as ${relative}.`
              : `Natural minor: W H W W H W W. It has the same notes as ${relative}, starting from ${names[0]}. 1, b3 and 5 (coloured) make the home chord, ${chords[0].name}.`}
          </p>
          <div className="row theory-controls">
            <div className="segmented" role="radiogroup" aria-label="Labels">
              <button className={prefs.labels === 'names' ? 'active' : ''} onClick={() => setPrefs({ labels: 'names' })}>
                Names
              </button>
              <button className={prefs.labels === 'degrees' ? 'active' : ''} onClick={() => setPrefs({ labels: 'degrees' })}>
                Numbers
              </button>
            </div>
            <label className="field">
              Show
              <select value={prefs.box} onChange={(e) => setPrefs({ box: Number(e.target.value) })}>
                <option value={-1}>Whole neck</option>
                {boxes.map((b, i) => (
                  <option key={b.label} value={i}>
                    Frets {b.from} to {b.to} ({b.label.toLowerCase()})
                  </option>
                ))}
              </select>
            </label>
            <button className="primary" onClick={playScale}>
              Hear it
            </button>
          </div>
          <Fretboard notes={scaleDots} ghosts={[]} tuning={tuning} capo={0} maxFret={12} showPickZone={false} options={fbOptions} onNoteClick={play} />
          <p className="hint">Tap a dot to hear it. Play the scale slowly in one box, up and down, saying the numbers out loud.</p>
        </section>
      )}

      {prefs.tab === 'triads' && (
        <section className="theory-section">
          <h2>Triads: {chord.name}</h2>
          <p className="hint">
            A triad is three notes: a root (R), a 3rd and a 5th. Major is the root, 4 frets up, then 3 more (bright). Minor is 3 then 4 (dark). Diminished is 3 then 3 (tense). On three strings each triad has three shapes, called inversions, and they repeat up the neck.
          </p>
          <div className="row chord-chips">
            {chords.map((c, i) => (
              <button key={c.name} className={prefs.chord === i + 1 ? 'chip active' : 'chip'} onClick={() => { setPrefs({ chord: i + 1 }); strum(chordSound(c)) }}>
                {c.name} <small>{c.roman}</small>
              </button>
            ))}
          </div>
          <div className="row theory-controls">
            <label className="field">
              String set
              <select value={set.low} onChange={(e) => setPrefs({ stringSet: Number(e.target.value) })}>
                {STRING_SETS.map((s) => (
                  <option key={s.low} value={s.low}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="hint">
              {chord.name} = {chord.toneNames.join(' ')}
            </span>
          </div>
          <Fretboard notes={triadDots} ghosts={[]} tuning={tuning} capo={0} maxFret={15} showPickZone={false} options={fbOptions} onNoteClick={play} />
          <div className="inversion-row">
            {([0, 1, 2] as const).map((inv) => {
              const v = firstOf(inv)
              return (
                <button key={inv} className="inversion-card" disabled={!v} onClick={() => v && strum(v.notes.map((n) => n.midi))}>
                  <strong>{INVERSIONS[inv]}</strong>
                  <span>{v ? v.notes.map((n) => toneLabel(chord.quality, n.tone)).join(' ') : 'not on these strings'}</span>
                  <small>{v ? `Frets ${v.notes.map((n) => n.fret).join('-')} · tap to hear` : ''}</small>
                </button>
              )
            })}
          </div>
          <p className="hint">Practise: play the three shapes going up the neck, then switch between two chords (like {chords[0].name} and {chords[3].name}) using the closest shapes.</p>
        </section>
      )}

      {prefs.tab === 'chords' && (
        <section className="theory-section">
          <h2>Chords in {keyName(key)}</h2>
          <p className="hint">
            Build a triad on every note of the scale, using only the key's notes, and you get the seven chords of the key. Upper-case numerals are major, lower-case minor, ° diminished. Songs in {names[0]} {key.mode} mostly use these chords, so the {names[0]} {key.mode} scale fits over all of them.
          </p>
          <div className="key-chords">
            {chords.map((c, i) => (
              <button key={c.name} className={`key-chord q-${c.quality}${prefs.chord === i + 1 ? ' active' : ''}`} onClick={() => { setPrefs({ chord: i + 1 }); strum(chordSound(c)) }}>
                <small>{c.roman}</small>
                <strong>{c.name}</strong>
                <span>{c.toneNames.join(' ')}</span>
              </button>
            ))}
          </div>
          <Fretboard notes={keyChordDots} ghosts={[]} tuning={tuning} capo={0} maxFret={12} showPickZone={false} options={fbOptions} onNoteClick={play} />
          <p className="hint">
            {shown.name} ({shown.roman}) on the neck: R, 3 and 5 are coloured, the other notes of the key are grey.
          </p>
          <h2>Progressions</h2>
          <div className="progressions">
            {progressions.map((p) => {
              const cs = progressionChords(key, p)
              return (
                <div key={p.id} className="progression-card">
                  <strong>{p.name}</strong>
                  <span className="progression-chords">{cs.map((c) => c.name).join('  ')}</span>
                  <small>{p.about}</small>
                  <div className="row">
                    <button onClick={() => playProgression(cs)}>Hear it</button>
                    <button className="primary" onClick={() => setPrefs({ progression: p.id, tab: 'freestyle' })}>
                      Improvise over it
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {prefs.tab === 'freestyle' && (
        <Freestyle
          tuning={tuning}
          keyInfo={key}
          progressions={progressions}
          progression={progression}
          onProgression={(id) => setPrefs({ progression: id })}
          options={fbOptions}
        />
      )}

      {prefs.tab === 'test' && <TheoryDrills current={key} />}
    </div>
  )
}

