import { useEffect, useRef, useState } from 'react'
import { DifficultySlider, loadDifficulty, saveDifficulty, type Difficulty } from '../components/DifficultySlider'
import { markActive } from '../progress/activity'
import { playChime } from '../audio/pitch'
import { makeDrill, type Drill, type DrillKind } from './drills'
import { keyName, type Key } from './theory'

const ROUND = 10
const KIND_LABELS: { id: DrillKind; label: string }[] = [
  { id: 'degree-note', label: 'Note of a degree' },
  { id: 'note-degree', label: 'Degree of a note' },
  { id: 'roman-chord', label: 'Chord numbers' },
  { id: 'spell', label: 'Spell a triad' },
]

/** Seconds per question on Hard. */
const HARD_SECONDS = 10
const LEVEL_DETAIL = [
  'Note answers come from the seven notes of the key, so there are fewer to choose from. No clock.',
  'All twelve notes to choose from. No clock.',
  `All twelve notes, and ${HARD_SECONDS} seconds per question. Running out of time counts as a miss.`,
]

const randomKey = (): Key => ({ tonic: Math.floor(Math.random() * 12), mode: Math.random() < 0.7 ? 'major' : 'minor' })

/** Ten quick theory questions, answered by tapping, with the reason shown after each. */
export function TheoryDrills({ current }: { current: Key }) {
  const [anyKey, setAnyKey] = useState(false)
  const [kinds, setKinds] = useState<DrillKind[]>(KIND_LABELS.map((k) => k.id))
  const [drill, setDrill] = useState<Drill | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [done, setDone] = useState<null | boolean>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>(() => loadDifficulty('theory-drills-difficulty'))
  const [asked, setAsked] = useState(0)
  const pickedRef = useRef(picked)
  pickedRef.current = picked

  // Hard: the question times out
  useEffect(() => {
    if (difficulty !== 2 || !drill || done !== null) return
    const id = window.setTimeout(() => finish(false, pickedRef.current), HARD_SECONDS * 1000)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked, done, difficulty])

  const next = () => {
    setDrill(makeDrill(anyKey ? randomKey() : current, Math.random, kinds, difficulty === 0))
    setPicked([])
    setDone(null)
    setAsked((n) => n + 1)
  }
  const start = () => {
    setResults([])
    next()
  }

  const answer = (choice: string) => {
    if (!drill || done !== null) return
    if (drill.kind === 'spell') {
      const p = picked.includes(choice) ? picked.filter((x) => x !== choice) : [...picked, choice]
      setPicked(p)
      if (p.length === 3) finish(drill.answer.every((a) => p.includes(a)), p)
      return
    }
    finish(drill.answer.includes(choice), [choice])
  }
  const finish = (ok: boolean, p: string[]) => {
    setPicked(p)
    setDone(ok)
    setResults((r) => [...r, ok])
    markActive('theory')
    playChime(ok ? 'right' : 'miss')
  }

  if (!drill)
    return (
      <section className="theory-section">
        <h2>Test yourself</h2>
        <p className="hint">Ten quick questions. After each one you see why, so a wrong answer still teaches you something.</p>
        <div className="row">
          <div className="segmented">
            <button className={!anyKey ? 'active' : ''} onClick={() => setAnyKey(false)}>
              In {keyName(current)}
            </button>
            <button className={anyKey ? 'active' : ''} onClick={() => setAnyKey(true)}>
              Any key
            </button>
          </div>
        </div>
        <div className="row">
          {KIND_LABELS.map((k) => (
            <button
              key={k.id}
              className={kinds.includes(k.id) ? 'chip active' : 'chip'}
              onClick={() => setKinds((ks) => (ks.includes(k.id) ? (ks.length > 1 ? ks.filter((x) => x !== k.id) : ks) : [...ks, k.id]))}
            >
              {k.label}
            </button>
          ))}
        </div>
        <DifficultySlider
          value={difficulty}
          onChange={(d) => {
            setDifficulty(d)
            saveDifficulty('theory-drills-difficulty', d)
          }}
          detail={LEVEL_DETAIL[difficulty]}
        />
        <div className="row">
          <button className="primary" onClick={start}>
            Start
          </button>
        </div>
      </section>
    )

  const finished = results.length >= ROUND && done !== null
  const right = results.filter(Boolean).length

  return (
    <section className="theory-section">
      <div className="quiz-dots" aria-label={`Question ${Math.min(results.length + 1, ROUND)} of ${ROUND}`}>
        {Array.from({ length: ROUND }, (_, i) => (
          <i key={i} className={i < results.length ? (results[i] ? 'ok' : 'bad') : i === results.length ? 'now' : ''} />
        ))}
      </div>
      {difficulty === 2 && done === null && (
        <div className="quiz-timer">
          <div key={asked} className="quiz-timer-fill" style={{ animationDuration: `${HARD_SECONDS}s` }} />
        </div>
      )}
      <div className={`quiz-card drill-card${done === true ? ' is-right' : done === false ? ' is-timeout' : ''}`}>
        <div className="quiz-prompt">{drill.prompt}</div>
        {drill.kind === 'spell' && done === null && <div className="quiz-status">{picked.length} of 3 picked</div>}
        {done !== null && (
          <div className="quiz-status" role="status">
            {done ? 'Right. ' : `${difficulty === 2 && picked.length < (drill.kind === 'spell' ? 3 : 1) ? "Time's up" : 'Not quite'}: ${drill.answer.join(' ')}. `}
            {drill.explain}
          </div>
        )}
      </div>
      <div className={`drill-pad n${drill.choices.length}`}>
        {drill.choices.map((c) => {
          const isAnswer = drill.answer.includes(c)
          const cls = done !== null && isAnswer ? 'right' : done !== null && picked.includes(c) ? 'wrong' : picked.includes(c) ? 'picked' : ''
          return (
            <button key={c} className={`name-key ${cls}`} disabled={done !== null} onClick={() => answer(c)}>
              <strong>{c}</strong>
            </button>
          )
        })}
      </div>
      <div className="row">
        {done !== null && !finished && (
          <button className="primary" onClick={next}>
            Next question
          </button>
        )}
        {finished && (
          <>
            <span className="drill-score">
              {right} of {ROUND} right
            </span>
            <button className="primary" onClick={start}>
              Another round
            </button>
          </>
        )}
        <button className="ghost" onClick={() => setDrill(null)}>
          {finished ? 'Done' : 'Stop'}
        </button>
      </div>
    </section>
  )
}
