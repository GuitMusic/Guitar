import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo } from 'react'
import { db } from '../library/db'
import { localDate, streak } from '../progress/practiceLog'

interface Props {
  songId: string
  title: string
  speed: number
  onAgain: () => void
  onFaster?: () => void
  onClose: () => void
}

const CONFETTI = ['#ff7a45', '#ff4f7b', '#fbbf24', '#2dd4bf', '#a78bfa', '#7cc4ff']

/** Shown when a song plays to the end: a small celebration and what to do next. */
export function SongComplete({ songId, title, speed, onAgain, onFaster, onClose }: Props) {
  const rows = useLiveQuery(() => db.practice.toArray(), [])
  const today = rows?.find((r) => r.songId === songId && r.date === localDate())
  const days = rows ? streak(rows) : 0
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 9) * 0.07,
        color: CONFETTI[i % CONFETTI.length],
        spin: (i * 53) % 360,
      })),
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pct = Math.round(speed * 100)
  return (
    <div className="complete-backdrop" role="dialog" aria-modal="true" aria-label="Song finished" onClick={onClose}>
      <div className="confetti" aria-hidden="true">
        {pieces.map((p, i) => (
          <i key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, background: p.color, rotate: `${p.spin}deg` }} />
        ))}
      </div>
      <div className="complete-card" onClick={(e) => e.stopPropagation()}>
        <div className="complete-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34">
            <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="eyebrow">Song complete</p>
        <h2>{title}</h2>
        <p className="complete-line">
          {pct >= 100 ? 'Full speed. Nicely done.' : `You played it through at ${pct}% speed.`}
          {pct < 100 && ' Try it a little faster next time.'}
        </p>
        <div className="complete-stats">
          <div>
            <strong>{pct}%</strong>
            <span>speed</span>
          </div>
          <div>
            <strong>{today ? Math.max(1, Math.round(today.seconds / 60)) : 1}</strong>
            <span>min on this song today</span>
          </div>
          <div>
            <strong>{Math.max(1, days)}</strong>
            <span>day streak</span>
          </div>
        </div>
        <div className="complete-actions">
          <button className="primary" onClick={onAgain}>
            Play again
          </button>
          {onFaster && pct < 100 && (
            <button className="ghost" onClick={onFaster}>
              Again at {Math.min(150, pct + 10)}%
            </button>
          )}
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
