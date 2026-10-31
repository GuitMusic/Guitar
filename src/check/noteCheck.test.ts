import { describe, expect, it } from 'vitest'
import { midiToFrequency } from '../music/notes'
import { accuracy, judgeNote, nextTrainerSpeed, notesPlayedSince, type SpectrumFrame } from './noteCheck'

const info = { sampleRate: 48000, fftSize: 8192 }
const BINS = info.fftSize / 2

/** A frame with background noise and the given notes at a level (dB). */
function frame(t: number, notes: Record<number, number> = {}): SpectrumFrame {
  const db = new Float32Array(BINS).fill(-95)
  for (const [midi, level] of Object.entries(notes)) {
    const bin = Math.round(midiToFrequency(Number(midi)) / (info.sampleRate / info.fftSize))
    db[bin] = level
  }
  return { t, db }
}

/** Frames every 16 ms from `from` to `to`, with notes switched on at given times. */
function timeline(from: number, to: number, events: { midi: number; at: number; level?: number }[]): SpectrumFrame[] {
  const frames: SpectrumFrame[] = []
  for (let t = from; t <= to; t += 16) {
    const notes: Record<number, number> = {}
    for (const e of events) if (t >= e.at) notes[e.midi] = e.level ?? -45
    frames.push(frame(t, notes))
  }
  return frames
}

describe('judgeNote', () => {
  it('finds a note played on the beat', () => {
    const frames = timeline(0, 1000, [{ midi: 57, at: 510 }])
    expect(judgeNote(frames, 57, 500, info)).toBe('hit')
  })

  it('calls a note late when it comes well after the beat', () => {
    const frames = timeline(0, 1200, [{ midi: 57, at: 760 }])
    expect(judgeNote(frames, 57, 500, info)).toBe('late')
  })

  it('misses a note that was never played', () => {
    const frames = timeline(0, 1000, [{ midi: 60, at: 500 }])
    expect(judgeNote(frames, 57, 500, info)).toBe('miss')
  })

  it('does not count a string that was already ringing before the beat', () => {
    const frames = timeline(0, 1000, [{ midi: 57, at: 100 }])
    expect(judgeNote(frames, 57, 500, info)).toBe('miss')
  })

  it('hears a new note while another string keeps ringing', () => {
    const frames = timeline(0, 1000, [
      { midi: 40, at: 100 },
      { midi: 64, at: 505 },
    ])
    expect(judgeNote(frames, 64, 500, info)).toBe('hit')
  })

  it('ignores the click of a knock that raises every frequency', () => {
    const frames = timeline(0, 1000, []).map((f) => (f.t >= 505 && f.t < 560 ? { t: f.t, db: new Float32Array(BINS).fill(-40) } : f))
    expect(judgeNote(frames, 57, 500, info)).toBe('miss')
  })

  it('ignores notes that are too quiet', () => {
    const frames = timeline(0, 1000, [{ midi: 57, at: 505, level: -85 }])
    expect(judgeNote(frames, 57, 500, info)).toBe('miss')
  })
})

describe('notesPlayedSince', () => {
  it('reports each expected note once it is plucked after the pause', () => {
    const frames = timeline(0, 2000, [
      { midi: 45, at: 900 },
      { midi: 57, at: 1500 },
    ])
    expect([...notesPlayedSince(frames, [45, 57, 64], 500, info)].sort()).toEqual([45, 57])
  })

  it('hears a string plucked again while it is still ringing', () => {
    const frames: SpectrumFrame[] = []
    for (let t = 0; t <= 2000; t += 16) {
      const sincePluck = t % 600
      frames.push(frame(t, { 48: -30 - sincePluck * 0.06 }))
    }
    expect([...notesPlayedSince(frames, [48], 700, info)]).toEqual([48])
  })
})

describe('accuracy and speed trainer', () => {
  it('counts late notes as half', () => {
    expect(accuracy(['hit', 'late', 'miss', 'hit'])).toBe(0.625)
  })

  it('speeds up only after a clean pass and stops at the target', () => {
    expect(nextTrainerSpeed(0.6, 0.95)).toBe(0.65)
    expect(nextTrainerSpeed(0.6, 0.5)).toBe(0.6)
    expect(nextTrainerSpeed(0.98, 1)).toBe(1)
    expect(nextTrainerSpeed(0.7, null)).toBe(0.75)
  })
})
