import { db, type PracticeDay } from '../library/db'

export function localDate(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Adds practice time for a song today. */
export async function logPractice(entry: { songId: string; title: string; seconds: number; speed: number; accuracy?: number }) {
  if (entry.seconds <= 0) return
  const date = localDate()
  const id = `${entry.songId}:${date}`
  await db.transaction('rw', db.practice, async () => {
    const prev = await db.practice.get(id)
    const best = [prev?.bestAccuracy, entry.accuracy].filter((x): x is number => x !== undefined)
    await db.practice.put({
      id,
      songId: entry.songId,
      title: entry.title,
      date,
      seconds: (prev?.seconds ?? 0) + entry.seconds,
      topSpeed: Math.max(prev?.topSpeed ?? 0, entry.speed),
      bestAccuracy: best.length ? Math.max(...best) : undefined,
    })
  })
}

export interface SongProgress {
  songId: string
  title: string
  totalSeconds: number
  days: number
  lastDate: string
  daysSince: number
  topSpeed: number
  bestAccuracy?: number
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 864e5)
}

/** Totals per song, most recently played first. */
export function summarize(rows: PracticeDay[], today = localDate()): SongProgress[] {
  const bySong = new Map<string, SongProgress>()
  for (const r of rows) {
    const p = bySong.get(r.songId) ?? {
      songId: r.songId,
      title: r.title,
      totalSeconds: 0,
      days: 0,
      lastDate: r.date,
      daysSince: 0,
      topSpeed: 0,
    }
    p.totalSeconds += r.seconds
    p.days += 1
    if (r.date >= p.lastDate) {
      p.lastDate = r.date
      p.title = r.title
    }
    p.topSpeed = Math.max(p.topSpeed, r.topSpeed)
    if (r.bestAccuracy !== undefined) p.bestAccuracy = Math.max(p.bestAccuracy ?? 0, r.bestAccuracy)
    bySong.set(r.songId, p)
  }
  return [...bySong.values()]
    .map((p) => ({ ...p, daysSince: daysBetween(p.lastDate, today) }))
    .sort((a, b) => a.daysSince - b.daysSince || b.totalSeconds - a.totalSeconds)
}

/** Songs you have put real time into (20+ minutes over 2+ days) but not played for a week or more. */
export function needsRevisit(songs: SongProgress[], minDays = 7): SongProgress[] {
  return songs.filter((s) => s.totalSeconds >= 20 * 60 && s.days >= 2 && s.daysSince >= minDays).sort((a, b) => b.daysSince - a.daysSince)
}

/** Minutes per day for the last n days, oldest first. */
export function minutesByDay(rows: PracticeDay[], n = 14, today = localDate()): { date: string; minutes: number }[] {
  const out: { date: string; minutes: number }[] = []
  const end = Date.parse(today)
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(end - i * 864e5).toISOString().slice(0, 10)
    const seconds = rows.filter((r) => r.date === date).reduce((s, r) => s + r.seconds, 0)
    out.push({ date, minutes: Math.round(seconds / 60) })
  }
  return out
}

/** Days in a row with practice, ending today or yesterday. */
export function streak(rows: PracticeDay[], today = localDate()): number {
  const days = new Set(rows.map((r) => r.date))
  let d = Date.parse(today)
  if (!days.has(today)) d -= 864e5
  let count = 0
  while (days.has(new Date(d).toISOString().slice(0, 10))) {
    count++
    d -= 864e5
  }
  return count
}
