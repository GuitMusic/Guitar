/**
 * Guitar-aware octave correction for a pitch detector's answer.
 *
 * The low strings of a guitar have a weak fundamental, and phone and laptop mics
 * barely pick up anything under 100 Hz. So for low E (82 Hz) the loudest, clearest
 * periodicity is often the second harmonic (165 Hz), and an autocorrelation detector
 * reports E3 instead of E2.
 *
 * A real E3 only has harmonics at 165, 330, 494… Hz. An E2 heard "as E3" still has
 * the odd harmonics of E2 at 1.5x and 2.5x the reported frequency (247, 412 Hz),
 * quiet but clearly there. If either stands out, the note is really an octave lower.
 * (E2's fundamental itself is not used: the mic often misses it, and mains hum
 * sits right there.)
 */

/** Only these reported pitches are checked: low notes, where this mistake happens. */
export const OCTAVE_CHECK = {
  /** The true pitch is at least this (just under drop D, 73 Hz). */
  minTrueHz: 68,
  /** Reported pitches above this are left alone (E4 is 330 Hz). */
  maxReportedHz: 340,
  /** An odd harmonic must stand this many times above the gaps next to it (about 12 dB). */
  overFloor: 4,
  /** …and be at least this fraction of the reported note's own level (about -30 dB). */
  ofMain: 0.03,
}

/** Hann-windowed magnitude of one frequency in a block of samples (Goertzel). */
export function magnitudeAt(buffer: Float32Array, sampleRate: number, freq: number, window: Float32Array = hann(buffer.length)): number {
  const w = (2 * Math.PI * freq) / sampleRate
  const coeff = 2 * Math.cos(w)
  let s1 = 0
  let s2 = 0
  for (let i = 0; i < buffer.length; i++) {
    const s0 = buffer[i] * window[i] + coeff * s1 - s2
    s2 = s1
    s1 = s0
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2
  return Math.sqrt(Math.max(0, power)) / buffer.length
}

const windows = new Map<number, Float32Array>()
function hann(n: number): Float32Array {
  let w = windows.get(n)
  if (!w) {
    w = new Float32Array(n)
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))
    windows.set(n, w)
  }
  return w
}

/**
 * Returns the frequency to use: the reported one, or half of it when the sound
 * is really the octave below.
 */
export function correctOctave(buffer: Float32Array, sampleRate: number, freq: number): number {
  const c = OCTAVE_CHECK
  if (freq / 2 < c.minTrueHz || freq > c.maxReportedHz) return freq
  const w = hann(buffer.length)
  const m = (f: number) => magnitudeAt(buffer, sampleRate, f, w)
  const main = m(freq)
  // Odd harmonics of the lower note sit at 1.5x and 2.5x the reported pitch; the
  // quarter points next to them are where a real note at `freq` has nothing.
  const lower = [1.5, 2.5].some((k) => {
    const level = m(freq * k)
    const floor = Math.max(m(freq * (k - 0.25)), m(freq * (k + 0.25)))
    return level > floor * c.overFloor && level > main * c.ofMain
  })
  return lower ? freq / 2 : freq
}
