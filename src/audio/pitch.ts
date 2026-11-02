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
export async function listenForPitch(onReading: (r: PitchReading | null, level: number) => void): Promise<PitchListener> {
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
    if (clarity > 0.92 && raw > 60 && raw < 1400) {
      // low strings are often heard an octave too high (see octave.ts)
      const freq = correctOctave(buffer, ctx.sampleRate, raw)
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
  const ctx = sharedAudioContext()
  // A little ahead, so the attack is not cut off while the context wakes up
  const t = ctx.currentTime + 0.02
  const out = ctx.createGain()
  out.gain.setValueAtTime(0.0001, t)
  out.gain.exponentialRampToValueAtTime(0.5, t + 0.01)
  out.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
  out.connect(ctx.destination)
  // fundamental plus two quiet overtones so it sounds less like a beep
  ;[1, 2, 3].forEach((h, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = i === 0 ? 'triangle' : 'sine'
    osc.frequency.value = midiToFrequency(midi) * h
    g.gain.value = [1, 0.3, 0.12][i]
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + seconds + 0.05)
    if (i === 0) osc.onended = () => out.disconnect()
  })
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
