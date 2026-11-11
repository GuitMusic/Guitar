import { describe, expect, it } from 'vitest'
import { clickAt, LESSONS, matchHit, median, OnsetDetector, tendency, verdict } from './rhythm'

describe('rhythm', () => {
  it('places clicks for each plan', () => {
    expect([0, 1, 2, 3].map((s) => clickAt('every', 0, s, 1))).toEqual([2, 1, 1, 1])
    expect([0, 1, 2, 3].map((s) => clickAt('backbeat', 0, s, 1))).toEqual([0, 1, 0, 1])
    expect([0, 1, 2, 3].map((s) => clickAt('gap', 2, s, 1))).toEqual([0, 0, 0, 0])
    expect([0, 1, 2, 3].map((s) => clickAt('gap', 4, s, 1))).toEqual([2, 1, 1, 1])
    expect([0, 1, 2, 3].map((s) => clickAt('every', 0, s, 2))).toEqual([2, 0, 1, 0])
  })
  it('matches a hit to the nearest unused beat', () => {
    const targets = [1, 1.5, 2]
    const used = new Set<number>([1])
    // 1.5 is taken, so a hit at 1.48 goes to 1 (480 ms late) only if that is within reach
    expect(matchHit(targets, used, 1.48, 0.2)).toBeNull()
    expect(matchHit(targets, new Set(), 1.48, 0.2)).toEqual({ index: 1, offsetMs: -20 })
  })
  it('ignores hits too far from any beat', () => {
    expect(matchHit([1, 2], new Set(), 1.5, 0.2)).toBeNull()
    expect(matchHit([1, 2], new Set(), 1.97, 0.2)).toEqual({ index: 1, offsetMs: -30 })
  })
  it('judges early and late', () => {
    expect(verdict(-60, 45)).toBe('early')
    expect(verdict(30, 45)).toBe('on')
    expect(verdict(80, 45)).toBe('late')
  })
  it('describes rushing and dragging', () => {
    expect(tendency([-40, -50, -45, -55], 45)).toMatch(/rush/)
    expect(tendency([60, 50, 55, 70], 45)).toMatch(/drag/)
    expect(tendency([5, -5, 10, -8], 45)).toMatch(/steady/)
  })
  it('finds plucks in loudness', () => {
    const d = new OnsetDetector()
    const levels = [0.001, 0.001, 0.0012, 0.001, 0.05, 0.04, 0.03, 0.02, 0.06, 0.001]
    const hits = levels.map((l, i) => d.push(l, i * 0.01)).filter((x) => x !== null)
    expect(hits).toEqual([0.04])
  })
  it('has lessons with sensible patterns', () => {
    for (const l of LESSONS) for (const s of l.play) expect(s).toBeLessThan(4 * l.sub)
    expect(median([3, 1, 2])).toBe(2)
  })
})
