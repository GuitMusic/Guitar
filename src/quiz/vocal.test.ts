import { describe, expect, it } from 'vitest'
import { HoldTimer, HOLD_MS, offTarget, randomTarget, scaleRun } from './vocal'

describe('offTarget', () => {
  it('measures cents from the target', () => {
    expect(offTarget(60.2, 60).semitones).toBeCloseTo(0.2)
    expect(offTarget(59.7, 60).semitones).toBeCloseTo(-0.3)
  })
  it('counts the same note an octave down as right, and says so', () => {
    const o = offTarget(48.1, 60)
    expect(o.semitones).toBeCloseTo(0.1)
    expect(o.octaves).toBe(-1)
  })
})

it('scale runs go up and back down', () => {
  expect(scaleRun(48, 'major')).toEqual([48, 50, 52, 53, 55, 57, 59, 60, 59, 57, 55, 53, 52, 50, 48])
  expect(scaleRun(50, 'hijaz').slice(0, 8)).toEqual([50, 51, 54, 55, 57, 58, 60, 62])
})

it('hold timer fills when in tune and forgives a short wobble', () => {
  const t = new HoldTimer()
  expect(t.push(10, HOLD_MS / 2)).toBeCloseTo(0.5)
  expect(t.push(80, 100)).toBeLessThan(0.5)
  expect(t.push(0, HOLD_MS)).toBe(1)
})

it('random targets stay in range, are natural when asked, and change', () => {
  for (let i = 0; i < 50; i++) {
    const m = randomTarget('low', true, 48)
    expect(m).toBeGreaterThanOrEqual(48)
    expect(m).toBeLessThanOrEqual(60)
    expect(m).not.toBe(48)
    expect([0, 2, 4, 5, 7, 9, 11]).toContain(m % 12)
  }
})
