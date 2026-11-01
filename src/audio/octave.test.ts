import { PitchDetector } from 'pitchy'
import { describe, expect, it } from 'vitest'
import { frequencyToMidi, midiToFrequency } from '../music/notes'
import { correctOctave } from './octave'

const RATE = 48000
const N = 4096

/** Seeded random, so the tests are repeatable. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/**
 * A plucked string as a mic hears it: given harmonic levels (index 0 = fundamental),
 * slight inharmonicity, a decay, a little noise, taken `offset` seconds after the pluck.
 */
function pluck(midi: number, harmonics: number[], seed = 1, offset = 0.15, noise = 0.01): Float32Array {
  const r = rng(seed)
  const f0 = midiToFrequency(midi)
  const phases = harmonics.map(() => r() * 2 * Math.PI)
  const out = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const t = offset + i / RATE
    let v = 0
    harmonics.forEach((a, h) => {
      const n = h + 1
      const f = f0 * n * Math.sqrt(1 + 0.00008 * n * n)
      v += a * Math.exp(-t * (1.5 + n * 0.4)) * Math.sin(2 * Math.PI * f * t + phases[h])
    })
    out[i] = v * 0.3 + (r() - 0.5) * noise
  }
  return out
}

function detect(buf: Float32Array): number {
  const [freq] = PitchDetector.forFloat32Array(N).findPitch(buf, RATE)
  return Math.round(frequencyToMidi(correctOctave(buf, RATE, freq)))
}

// Low E through a phone mic: almost no fundamental, strong even harmonics, quiet odd
// ones. This is what makes the detector lock onto the octave above.
const PHONE_LOW = [0.02, 1, 0.2, 0.6, 0.15, 0.3, 0.08, 0.1]
// Odd harmonics quieter still (about -26 dB).
const PHONE_FAINT = [0, 1, 0.06, 0.5, 0.05, 0.25, 0.03, 0.1]
// The same string close to a good mic.
const FULL = [1, 0.8, 0.5, 0.4, 0.3, 0.2, 0.12, 0.08]

describe('correctOctave', () => {
  it('without it, low E with a weak fundamental reads as E3 (the bug)', () => {
    const buf = pluck(40, PHONE_LOW)
    const [freq] = PitchDetector.forFloat32Array(N).findPitch(buf, RATE)
    expect(Math.round(frequencyToMidi(freq))).toBe(52)
  })

  it('hears low strings in the right octave even when the mic misses the fundamental', () => {
    for (const midi of [38, 40, 41, 43, 45, 47, 48, 50]) {
      for (let seed = 1; seed <= 5; seed++) {
        expect(detect(pluck(midi, PHONE_LOW, seed)), `midi ${midi} seed ${seed}`).toBe(midi)
        expect(detect(pluck(midi, PHONE_FAINT, seed)), `faint midi ${midi} seed ${seed}`).toBe(midi)
      }
    }
  })

  it('leaves full-sounding notes alone', () => {
    for (let midi = 40; midi <= 76; midi++) {
      for (let seed = 1; seed <= 3; seed++) expect(detect(pluck(midi, FULL, seed)), `midi ${midi} seed ${seed}`).toBe(midi)
    }
  })

  it('does not drop a real E3 or A3 an octave, even with random harmonic levels', () => {
    for (const midi of [50, 52, 55, 57, 59, 62, 64]) {
      for (let seed = 1; seed <= 20; seed++) {
        const r = rng(seed * 7)
        const h = [1, ...Array.from({ length: 7 }, () => r() * 0.9)]
        expect(detect(pluck(midi, h, seed, 0.1, 0.03)), `midi ${midi} seed ${seed}`).toBe(midi)
      }
    }
  })

  it('also corrects late in the note, when it has faded', () => {
    expect(detect(pluck(40, PHONE_LOW, 3, 1.2))).toBe(40)
    expect(detect(pluck(45, PHONE_LOW, 3, 1.2))).toBe(45)
  })
})
