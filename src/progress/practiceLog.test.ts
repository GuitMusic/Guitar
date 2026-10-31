import { describe, expect, it } from 'vitest'
import type { PracticeDay } from '../library/db'
import { minutesByDay, needsRevisit, streak, summarize } from './practiceLog'

const row = (songId: string, date: string, minutes: number, extra: Partial<PracticeDay> = {}): PracticeDay => ({
  id: `${songId}:${date}`,
  songId,
  title: songId,
  date,
  seconds: minutes * 60,
  topSpeed: 1,
  ...extra,
})

const rows = [
  row('landslide', '2026-10-01', 30, { bestAccuracy: 0.8 }),
  row('landslide', '2026-10-03', 25, { bestAccuracy: 0.9, topSpeed: 0.8 }),
  row('blackbird', '2026-10-30', 20),
  row('blackbird', '2026-10-31', 15),
]

describe('practice log', () => {
  it('totals time per song, most recent first', () => {
    const s = summarize(rows, '2026-10-31')
    expect(s.map((x) => x.songId)).toEqual(['blackbird', 'landslide'])
    expect(s[1]).toMatchObject({ totalSeconds: 55 * 60, days: 2, daysSince: 28, bestAccuracy: 0.9 })
  })

  it('reminds you about songs you know but have not played for a week', () => {
    const due = needsRevisit(summarize(rows, '2026-10-31'))
    expect(due.map((d) => d.songId)).toEqual(['landslide'])
  })

  it('does not nag about songs you only tried once', () => {
    expect(needsRevisit(summarize([row('x', '2026-09-01', 60)], '2026-10-31'))).toEqual([])
  })

  it('lists minutes for each of the last days', () => {
    const days = minutesByDay(rows, 3, '2026-10-31')
    expect(days).toEqual([
      { date: '2026-10-29', minutes: 0 },
      { date: '2026-10-30', minutes: 20 },
      { date: '2026-10-31', minutes: 15 },
    ])
  })

  it('counts a streak that ends today or yesterday', () => {
    expect(streak(rows, '2026-10-31')).toBe(2)
    expect(streak(rows, '2026-11-01')).toBe(2)
    expect(streak(rows, '2026-11-02')).toBe(0)
  })
})
