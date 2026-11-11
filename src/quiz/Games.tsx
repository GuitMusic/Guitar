import { useEffect, useRef, useState } from 'react'
import { playChime, playTone } from '../audio/pitch'
import { Fretboard, type FretMark } from '../components/Fretboard'
import type { FretboardOptions } from '../components/Fretboard'
import { pitchClassName, solfegeName } from '../music/notes'
import type { FretNote } from '../music/types'
import {
  climbTurn,
  GAME_FRETS,
  GAME_SECONDS,
  GAMES,
  huntTurn,
  loadBest,
  multiplier,
  octaveTurn,
  rushTurn,
  saveBest,
  type GameId,
  type OctaveTurn,
  type Spot,
} from './games'

type Turn =
  | { game: 'rush'; spot: Spot }
  | { game: 'hunt'; pc: number; spots: Spot[]; found: string[] }
  | { game: 'octave'; turn: OctaveTurn }
  | { game: 'climb'; string: number; steps: Spot[]; next: number }

interface Score {
  points: number
  right: number
  wrong: number
  run: number
  bestRun: number
}

const ZERO: Score = { points: 0, right: 0, wrong: 0, run: 0, bestRun: 0 }
const key = (s: { string: number; fret: number }) => `${s.string}:${s.fret}`
const NATURALS = [0, 2, 4, 5, 7, 9, 11]
const CONFETTI = ['#ff7a45', '#ff4f7b', '#fbbf24', '#2dd4bf', '#a78bfa', '#7cc4ff']

function asFretNote(s: Spot): FretNote {
  return { key: key(s), string: s.string, fret: s.fret, tabFret: s.fret, midi: s.midi, lh: null, rh: null, lhInferred: false, rhInferred: false }
}

/** Minute-long tap games for learning the notes on the neck. */
export function Games({ tuning, sounds, view }: { tuning: number[]; sounds: boolean; view: FretboardOptions }) {
  const [game, setGame] = useState<GameId | null>(null)
  const [phase, setPhase] = useState<'pick' | 'play' | 'over'>('pick')
  const [turn, setTurn] = useState<Turn | null>(null)
  const [score, setScore] = useState<Score>(ZERO)
  const [best, setBest] = useState(loadBest)
  const [newBest, setNewBest] = useState(false)
  const [left, setLeft] = useState(GAME_SECONDS)
  const [misses, setMisses] = useState<FretMark[]>([])
  const [note, setNote] = useState<{ id: number; text: string; good: boolean } | null>(null)
  const [hits, setHits] = useState<FretMark[]>([])
  const endsAt = useRef(0)
  const scoreRef = useRef(score)
  const busy = useRef(false)
  useEffect(() => {
    scoreRef.current = score
  })

  const say = (text: string, good: boolean) => setNote((n) => ({ id: (n?.id ?? 0) + 1, text, good }))

  const newTurn = (g: GameId, prev: Turn | null, right: number): Turn => {
    if (g === 'rush') return { game: 'rush', spot: rushTurn(tuning, right, prev?.game === 'rush' ? prev.spot : null) }
    if (g === 'hunt') {
      const t = huntTurn(tuning, right, prev?.game === 'hunt' ? prev.pc : null)
      return { game: 'hunt', ...t, found: [] }
    }
    if (g === 'octave') return { game: 'octave', turn: octaveTurn(tuning, prev?.game === 'octave' ? prev.turn.from : null) }
    const t = climbTurn(tuning, prev?.game === 'climb' ? prev.string : null)
    return { game: 'climb', ...t, next: 0 }
  }

  const start = (g: GameId) => {
    setGame(g)
    setScore(ZERO)
    scoreRef.current = ZERO
    setTurn(newTurn(g, null, 0))
    setMisses([])
    setHits([])
    setNote(null)
    setNewBest(false)
    busy.current = false
    endsAt.current = performance.now() + GAME_SECONDS * 1000
    setLeft(GAME_SECONDS)
    setPhase('play')
    window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  // The clock: ends the game after a minute and keeps the best score
  useEffect(() => {
    if (phase !== 'play' || !game) return
    const id = window.setInterval(() => {
      const ms = endsAt.current - performance.now()
      setLeft(Math.max(0, Math.ceil(ms / 1000)))
      if (ms <= 0) {
        window.clearInterval(id)
        setPhase('over')
        const points = scoreRef.current.points
        const saved = loadBest()
        if (points > 0 && points > (saved[game] ?? 0)) {
          const next = { ...saved, [game]: points }
          saveBest(next)
          setBest(next)
          setNewBest(true)
        }
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, game])

  const right = (bonus = 0, midi?: number) => {
    const s = scoreRef.current
    const gained = 10 * multiplier(s.run) + bonus
    const run = s.run + 1
    const next = { ...s, points: s.points + gained, right: s.right + 1, run, bestRun: Math.max(s.bestRun, run) }
    scoreRef.current = next
    setScore(next)
    if (sounds && midi !== undefined) playTone(midi, 0.7)
    return gained
  }

  const wrong = (spot?: { string: number; fret: number }) => {
    const s = scoreRef.current
    const next = { ...s, wrong: s.wrong + 1, run: 0 }
    scoreRef.current = next
    setScore(next)
    if (sounds) playChime('miss')
    if (spot) setMisses((m) => [...m.slice(-4), { key: `x${key(spot)}-${s.wrong}`, string: spot.string, fret: spot.fret, result: 'miss', fade: true }])
  }

  /** Moves to the next turn after a short look at the answer. */
  const advance = (t: Turn, ms: number) => {
    busy.current = true
    window.setTimeout(() => {
      busy.current = false
      if (performance.now() >= endsAt.current) return
      setTurn(newTurn(t.game, t, scoreRef.current.right))
      setHits([])
    }, ms)
  }

  const onName = (pc: number) => {
    if (phase !== 'play' || turn?.game !== 'rush' || busy.current) return
    if (turn.spot.midi % 12 === pc) {
      const p = right(0, turn.spot.midi)
      say(`${pitchClassName(pc)} +${p}`, true)
      setTurn(newTurn('rush', turn, scoreRef.current.right))
    } else {
      wrong()
      say(`It was ${pitchClassName(turn.spot.midi)}`, false)
      setHits([{ key: `r${key(turn.spot)}`, string: turn.spot.string, fret: turn.spot.fret, result: 'miss' }])
      advance(turn, 700)
    }
  }

  const onSpot = (string: number, fret: number) => {
    if (phase !== 'play' || !turn || busy.current) return
    const midi = tuning[string - 1] + fret
    const here = { string, fret }
    if (turn.game === 'hunt') {
      if (midi % 12 !== turn.pc) return wrong(here)
      if (turn.found.includes(key(here))) return
      const found = [...turn.found, key(here)]
      const done = found.length === turn.spots.length
      const p = right(done ? 20 : 0, midi)
      setTurn({ ...turn, found })
      if (done) {
        say(`All ${found.length} found +${p}`, true)
        advance(turn, 600)
      }
    } else if (turn.game === 'octave') {
      if (!turn.turn.targets.some((t) => t.string === string && t.fret === fret)) return wrong(here)
      const p = right(0, midi)
      say(`${turn.turn.kind === 'octave' ? 'Octave' : 'Same pitch'} +${p}`, true)
      setHits(turn.turn.targets.map((t) => ({ key: `h${key(t)}`, string: t.string, fret: t.fret, result: t.string === string && t.fret === fret ? 'hit' : 'octave' })))
      advance(turn, 650)
    } else if (turn.game === 'climb') {
      const want = turn.steps[turn.next]
      if (!want || want.string !== string || want.fret !== fret) return wrong(here)
      const next = turn.next + 1
      const done = next === turn.steps.length
      const p = right(done ? 20 : 0, midi)
      setTurn({ ...turn, next })
      if (done) {
        say(`String ${turn.string} climbed +${p}`, true)
        advance(turn, 600)
      }
    }
  }

  // Letter keys answer Note rush on a keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'play') return
      if (e.key === 'Escape') setPhase('pick')
      const pc = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[e.key.toLowerCase()]
      if (pc !== undefined) onName(pc)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const info = GAMES.find((g) => g.id === game)

  if (phase === 'pick' || !game || !turn || !info) {
    return (
      <div className="games">
        <p className="hint">One minute each, answered by tapping. No guitar or mic needed, so you can play anywhere. Beat your best score.</p>
        <div className="level-grid">
          {GAMES.map((g) => (
            <button key={g.id} className="level-card game-card" onClick={() => start(g.id)}>
              <span className={`game-icon game-${g.id}`} aria-hidden="true" />
              <span className="level-title">{g.title}</span>
              <span className="level-blurb">{g.blurb}</span>
              <span className="level-foot">
                <span className="game-best">{best[g.id] ? `Best ${best[g.id]}` : 'Not played yet'}</span>
                <span className="level-tag">Play</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'over') {
    const total = score.right + score.wrong
    return (
      <div className={`quiz-summary${newBest ? ' passed' : ''}`}>
        {newBest && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 30 }, (_, i) => (
              <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.07}s`, background: CONFETTI[i % CONFETTI.length], rotate: `${(i * 53) % 360}deg` }} />
            ))}
          </div>
        )}
        <p className="eyebrow">{info.title}</p>
        <div className="quiz-score">{score.points}</div>
        <p className="complete-line">{newBest ? 'New best score!' : best[game] ? `Your best is ${best[game]}.` : 'Time.'}</p>
        <div className="complete-stats">
          <div>
            <strong>{score.right}</strong>
            <span>right</span>
          </div>
          <div>
            <strong>{total ? `${Math.round((score.right / total) * 100)}%` : '–'}</strong>
            <span>accuracy</span>
          </div>
          <div>
            <strong>{score.bestRun}</strong>
            <span>best run</span>
          </div>
        </div>
        <div className="complete-actions">
          <button className="primary" onClick={() => start(game)}>
            Play again
          </button>
          <button className="ghost" onClick={() => setPhase('pick')}>
            All games
          </button>
        </div>
      </div>
    )
  }

  const prompt =
    turn.game === 'rush' ? (
      'Name this note'
    ) : turn.game === 'hunt' ? (
      <>
        Find every {pitchClassName(turn.pc)}
        <span className="solfa-inline">{solfegeName(turn.pc)}</span>
      </>
    ) : turn.game === 'octave' ? (
      turn.turn.kind === 'octave' ? (
        `Tap an octave of this ${pitchClassName(turn.turn.from.midi)}`
      ) : (
        `Same ${pitchClassName(turn.turn.from.midi)}, another string`
      )
    ) : (
      `Climb string ${turn.string}`
    )

  const sub =
    turn.game === 'hunt'
      ? `${turn.found.length} of ${turn.spots.length} found`
      : turn.game === 'climb'
        ? turn.next === 0 && turn.steps[0]
          ? `Start on ${pitchClassName(turn.steps[0].midi)}${turn.steps[0].fret === 0 ? ', the open string' : `, fret ${turn.steps[0].fret}`}`
          : turn.steps.map((s, i) => (i < turn.next ? pitchClassName(s.midi) : '·')).join(' ')
        : info.how

  const dots: FretNote[] =
    turn.game === 'rush' ? [asFretNote(turn.spot)] : turn.game === 'octave' ? [asFretNote(turn.turn.from)] : []
  const found: FretMark[] =
    turn.game === 'hunt'
      ? turn.found.map((k) => {
          const [string, fret] = k.split(':').map(Number)
          return { key: `f${k}`, string, fret, result: 'hit' as const }
        })
      : turn.game === 'climb'
        ? turn.steps.slice(0, turn.next).map((s) => ({ key: `c${key(s)}`, string: s.string, fret: s.fret, result: 'hit' as const }))
        : []
  // a pulsing ring, so the dot to answer is easy to spot on a small screen
  const ring: FretMark[] = dots.length && !hits.length ? [{ key: `q${dots[0].key}`, string: dots[0].string, fret: dots[0].fret, result: 'waiting' }] : []
  const climbNames: FretNote[] = turn.game === 'climb' ? turn.steps.slice(0, turn.next).map(asFretNote) : []
  const mult = multiplier(score.run)
  const sharps = turn.game === 'rush' && score.right >= 8

  return (
    <div className="game-play">
      <div className="game-bar">
        <span className="quiz-round-title">{info.title}</span>
        <span className="game-score" aria-label={`${score.points} points`}>
          {score.points}
        </span>
        {mult > 1 && <span className="quiz-pill hot">×{mult}</span>}
        <span className="game-time">{left}s</span>
        <button className="ghost game-quit" onClick={() => setPhase('pick')}>
          Stop
        </button>
      </div>
      <div className="quiz-timer">
        <div key={game} className="quiz-timer-fill" style={{ animationDuration: `${GAME_SECONDS}s` }} />
      </div>
      <div className="game-prompt">
        <div className="quiz-prompt">{prompt}</div>
        <div className="game-sub">{sub}</div>
        {note && (
          <span key={note.id} className={`game-flash ${note.good ? 'good' : 'bad'}`}>
            {note.text}
          </span>
        )}
      </div>
      <Fretboard
        notes={dots}
        ghosts={[]}
        tuning={tuning}
        capo={0}
        maxFret={GAME_FRETS}
        showPickZone={false}
        highlightStrings={turn.game === 'climb' ? [turn.string] : []}
        marks={[...ring, ...found, ...hits, ...misses]}
        names={climbNames}
        options={{ ...view, labelMode: turn.game === 'rush' ? 'finger' : 'note', showGhosts: false }}
        onFretClick={turn.game === 'rush' ? undefined : onSpot}
      />
      {turn.game === 'rush' && (
        <div className={`name-pad${sharps ? ' all' : ''}`} role="group" aria-label="Note names">
          {(sharps ? Array.from({ length: 12 }, (_, i) => i) : NATURALS).map((pc) => (
            <button key={pc} className="name-key" onClick={() => onName(pc)}>
              <strong>{pitchClassName(pc)}</strong>
              <span>{solfegeName(pc)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
