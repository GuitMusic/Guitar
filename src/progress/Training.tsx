import { GAMES, loadBest } from '../quiz/games'
import { LEVELS } from '../quiz/quiz'
import { LESSONS } from '../rhythm/rhythm'

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

/** Everything practised outside songs: Note finder, games and metronome lessons, plus the streak. */
export function Training({ streakDays }: { streakDays: number }) {
  const stars = load<Record<string, number>>('quiz-path', {})
  const starCount = Object.values(stars).reduce((a, b) => a + b, 0)
  const neck = load<Record<string, { n: number; ok: number }>>('quiz-neck', {})
  const known = Object.values(neck).filter((t) => t.n >= 2 && t.ok / t.n >= 0.75).length
  const best = loadBest()
  const rhythm = load<{ done?: Record<string, boolean> }>('rhythm-trainer', {})
  const lessonsDone = LESSONS.filter((l) => rhythm.done?.[l.id]).length
  const quizDays = load<string[]>('quiz-days', []).length

  return (
    <>
      <div className="quiz-stats">
        <div>
          <strong>{streakDays}</strong>
          <span>days in a row (songs or training)</span>
        </div>
        <div>
          <strong>
            {starCount}
            <small> / {LEVELS.length * 3}</small>
          </strong>
          <span>Note finder stars</span>
        </div>
        <div>
          <strong>{known}</strong>
          <span>neck spots you know (of 78 up to fret 12)</span>
        </div>
        <div>
          <strong>
            {lessonsDone}
            <small> / {LESSONS.length}</small>
          </strong>
          <span>metronome lessons done</span>
        </div>
      </div>
      <h2>Game best scores</h2>
      <ul className="best-list">
        {GAMES.map((g) => (
          <li key={g.id}>
            <span>{g.title}</span>
            <strong>{best[g.id] ?? '–'}</strong>
          </li>
        ))}
        <li>
          <span>Days of Note finder practice</span>
          <strong>{quizDays}</strong>
        </li>
      </ul>
    </>
  )
}
