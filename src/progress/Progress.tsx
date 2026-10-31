import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../library/db'
import { BUILT_IN_SONGS, toOpenSong, type OpenSong } from '../library/songs'
import { minutesByDay, needsRevisit, streak, summarize } from './practiceLog'

interface Props {
  onOpen: (song: OpenSong) => void
}

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
}

function ago(days: number): string {
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export async function findSong(songId: string): Promise<OpenSong | null> {
  const builtIn = BUILT_IN_SONGS.find((s) => s.id === songId)
  if (builtIn) return builtIn
  const rec = await db.songs.get(songId)
  return rec ? toOpenSong(rec) : null
}

/** Practice log: time per day, streak, and per-song progress with revisit reminders. */
export function Progress({ onOpen }: Props) {
  const rows = useLiveQuery(() => db.practice.toArray(), [])
  if (!rows) return null
  const songs = summarize(rows)
  const due = needsRevisit(songs)
  const days = minutesByDay(rows, 14)
  const maxMin = Math.max(10, ...days.map((d) => d.minutes))
  const week = days.slice(-7).reduce((s, d) => s + d.minutes, 0)
  const open = async (songId: string) => {
    const song = await findSong(songId)
    if (song) onOpen(song)
  }

  return (
    <div className="progress">
      <h1>Progress</h1>
      {rows.length === 0 ? (
        <p className="empty">Nothing logged yet. Time counts automatically while a song is playing.</p>
      ) : (
        <>
          <div className="quiz-stats">
            <div>
              <strong>{week} min</strong>
              <span>played in the last 7 days</span>
            </div>
            <div>
              <strong>{streak(rows)}</strong>
              <span>days in a row</span>
            </div>
            <div>
              <strong>{songs.length}</strong>
              <span>songs practiced</span>
            </div>
          </div>

          <h2>Minutes per day, last 2 weeks</h2>
          <div className="day-chart" role="img" aria-label={`Minutes per day: ${days.map((d) => `${d.date} ${d.minutes}`).join(', ')}`}>
            {days.map((d) => (
              <div key={d.date} className="day-col" title={`${d.date}: ${d.minutes} min`}>
                <span className="day-val">{d.minutes > 0 ? d.minutes : ''}</span>
                <div className="day-bar" style={{ height: `${(d.minutes / maxMin) * 100}%` }} />
                <span className="day-label">{Number(d.date.slice(8))}</span>
              </div>
            ))}
          </div>

          {due.length > 0 && (
            <>
              <h2>Time to revisit</h2>
              <p className="hint">Songs you know but haven't played for a week. A quick run-through keeps them in your fingers.</p>
              <ul className="song-list">
                {due.map((s) => (
                  <li key={s.songId}>
                    <button className="song-card" onClick={() => open(s.songId)}>
                      <strong>{s.title}</strong>
                      <span className="hint">Last played {ago(s.daysSince)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2>Songs</h2>
          <table className="progress-table">
            <thead>
              <tr>
                <th>Song</th>
                <th>Last played</th>
                <th>Total</th>
                <th>Top speed</th>
                <th>Best score</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((s) => (
                <tr key={s.songId}>
                  <td>
                    <button className="link" onClick={() => open(s.songId)}>
                      {s.title}
                    </button>
                  </td>
                  <td>{ago(s.daysSince)}</td>
                  <td>{formatMinutes(s.totalSeconds)}</td>
                  <td>{Math.round(s.topSpeed * 100)}%</td>
                  <td>{s.bestAccuracy !== undefined ? `${Math.round(s.bestAccuracy * 100)}%` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
