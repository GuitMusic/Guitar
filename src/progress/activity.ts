import { localDate } from './practiceLog'

/**
 * Days with any practice outside songs (Note finder, games, metronome lessons, theory
 * quizzes), so a day of neck training counts toward the streak like a day of songs.
 */
const KEY = 'active-days'

export type Activity = 'notes' | 'games' | 'rhythm' | 'theory' | 'sing'

function read(): Record<string, Activity[]> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/** Records that something was practised today. */
export function markActive(kind: Activity, today = localDate()): void {
  const days = read()
  const list = days[today] ?? []
  if (list.includes(kind)) return
  days[today] = [...list, kind]
  // keep about four months
  const keep = Object.keys(days).sort().slice(-120)
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep.map((d) => [d, days[d]]))))
  } catch {
    // storage unavailable
  }
}

/** Days with training, as rows the streak counter understands. */
export function activeDays(): { date: string }[] {
  return Object.keys(read()).map((date) => ({ date }))
}
