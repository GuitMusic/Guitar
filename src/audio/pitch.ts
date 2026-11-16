import { PitchDetector } from 'pitchy'
import { frequencyToMidi, midiToFrequency } from '../music/notes'
import { correctOctave } from './octave'
import { registerAudioContext, sharedAudioContext } from './unlock'

export interface PitchReading {
  freq: number
  /** Fractional MIDI number, smoothed. */
  midi: number
  clarity: number
}

export interface PitchListener {
  stop: () => void
}

/**
 * Listens to the microphone and reports the pitch of single notes (McLeod pitch method).
 * Calls onReading with null when nothing clear is heard. `level` is the loudness
 * (RMS, 0 to 1) of every frame, pitched or not, so callers can spot a fresh pluck.
 */
export async function listenForPitch(
  onReading: (r: PitchReading | null, level: number) => void,
  /** For the voice: a looser clarity bar (vibrato, breath) and no guitar octave fix */
  options: { minClarity?: number; octaveFix?: boolean } = {},
): Promise<PitchListener> {
  const minClarity = options.minClarity ?? 0.92
  const octaveFix = options.octaveFix ?? true
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const ctx = new AudioContext()
  // Made after the microphone prompt, so outside the click: Safari can start it suspended
  const unregister = registerAudioContext(ctx)
  void ctx.resume().catch(() => {})
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 4096
  source.connect(analyser)
  const buffer = new Float32Array(analyser.fftSize)
  const detector = PitchDetector.forFloat32Array(analyser.fftSize)
  detector.minVolumeDecibels = -45
  let frame = 0
  let smoothed: number | null = null

  const tick = () => {
    analyser.getFloatTimeDomainData(buffer)
    let sum = 0
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
    const level = Math.sqrt(sum / buffer.length)
    const [raw, clarity] = detector.findPitch(buffer, ctx.sampleRate)
    if (clarity > minClarity && raw > 60 && raw < 1400) {
      // low strings are often heard an octave too high (see octave.ts)
      const freq = octaveFix ? correctOctave(buffer, ctx.sampleRate, raw) : raw
      const m = frequencyToMidi(freq)
      smoothed = smoothed === null || Math.abs(smoothed - m) > 0.5 ? m : smoothed * 0.7 + m * 0.3
      onReading({ freq, midi: smoothed, clarity }, level)
    } else {
      smoothed = null
      onReading(null, level)
    }
    frame = requestAnimationFrame(tick)
  }
  tick()

  return {
    stop: () => {
      cancelAnimationFrame(frame)
      unregister()
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}

export function micErrorMessage(e: unknown): string {
  if (e instanceof Error && e.name === 'NotAllowedError') return 'Microphone access was blocked. Allow it in your browser and try again.'
  if (e instanceof Error && e.name === 'NotFoundError') return 'No microphone was found.'
  return e instanceof Error ? e.message : String(e)
}

/** Plays a plucked-sounding reference tone. */
export function playTone(midi: number, seconds = 1.6): void {
  // A little ahead, so the attack is not cut off while the context wakes up
  playToneAt(midi, sharedAudioContext().currentTime + 0.02, seconds)
}

/** The audio clock, in seconds, for scheduling notes with playToneAt. */
export function audioNow(): number {
  return sharedAudioContext().currentTime
}

/**
 * A plucked guitar string, synthesised with the Karplus-Strong method: a burst of noise
 * circulating in a delay line one period long, softened a little on every pass, the way a
 * real string loses its high overtones first. The loop is one whole sample long and the
 * playback rate makes up the fraction, so the pitch is exact (it is also a reference tone).
 */
const plucks = new Map<string, { buffer: AudioBuffer; rate: number }>()
function pluck(ctx: BaseAudioContext, midi: number, seconds: number) {
  const key = `${ctx.sampleRate}:${midi}:${seconds}`
  const hit = plucks.get(key)
  if (hit) return hit
  const sr = ctx.sampleRate
  const period = sr / midiToFrequency(midi)
  // Averaging each sample with the next one out shortens the loop by half a sample
  const n = Math.max(3, Math.round(period + 0.5))
  const length = Math.ceil(seconds * sr)
  const buffer = ctx.createBuffer(1, length, sr)
  const out = buffer.getChannelData(0)
  // Seeded noise, smoothed once so the attack sounds like a finger rather than a pick
  let seed = 1234567 + midi * 7919
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1
  const ring = new Float32Array(n)
  let prev = 0
  for (let i = 0; i < n; i++) {
    const r = rand()
    ring[i] = (r + prev) / 2
    prev = r
  }
  // Higher strings ring shorter, as on a guitar
  const loss = midi > 64 ? 0.994 : 0.997
  let peak = 0
  for (let i = 0; i < length; i++) {
    const k = i % n
    const v = ring[k]
    out[i] = v
    peak = Math.max(peak, Math.abs(v))
    ring[k] = loss * 0.5 * (v + ring[(k + 1) % n])
  }
  // Even out loudness between notes, and fade the tail so nothing clicks
  const fade = Math.min(length, Math.round(sr * 0.08))
  for (let i = 0; i < length; i++) {
    out[i] /= peak || 1
    if (i > length - fade) out[i] *= (length - i) / fade
  }
  const entry = { buffer, rate: (n - 0.5) / period }
  plucks.set(key, entry)
  return entry
}

/** Plays a plucked guitar note at a time on the audio clock (see audioNow), e.g. for a backing loop. */
export function playToneAt(midi: number, t: number, seconds = 1.6, volume = 0.5): void {
  const ctx = sharedAudioContext()
  const { buffer, rate } = pluck(ctx, midi, Math.round(seconds * 10) / 10)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = rate
  // A gentle low-pass takes the edge off, like a guitar body
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = Math.min(9000, midiToFrequency(midi) * 9)
  const g = ctx.createGain()
  g.gain.value = volume * 0.9
  src.connect(tone).connect(g).connect(ctx.destination)
  src.start(t)
  src.onended = () => g.disconnect()
}

/** A short, quiet two-note chime for a right answer ('right'), or one low tone for a miss. */
export function playChime(kind: 'right' | 'late' | 'miss'): void {
  const ctx = sharedAudioContext()
  const notes = kind === 'right' ? [88, 95] : kind === 'late' ? [88] : [52]
  notes.forEach((midi, i) => {
    const t = ctx.currentTime + 0.02 + i * 0.09
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = kind === 'miss' ? 'triangle' : 'sine'
    osc.frequency.value = midiToFrequency(midi)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(kind === 'miss' ? 0.12 : 0.08, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'miss' ? 0.35 : 0.5))
    osc.connect(g).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.6)
    osc.onended = () => g.disconnect()
  })
}
