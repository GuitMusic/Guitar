import { PitchDetector } from 'pitchy'
import { frequencyToMidi, midiToFrequency } from '../music/notes'

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
 * Calls onReading with null when nothing clear is heard.
 */
export async function listenForPitch(onReading: (r: PitchReading | null) => void): Promise<PitchListener> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const ctx = new AudioContext()
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
    const [freq, clarity] = detector.findPitch(buffer, ctx.sampleRate)
    if (clarity > 0.92 && freq > 60 && freq < 1400) {
      const m = frequencyToMidi(freq)
      smoothed = smoothed === null || Math.abs(smoothed - m) > 0.5 ? m : smoothed * 0.7 + m * 0.3
      onReading({ freq, midi: smoothed, clarity })
    } else {
      smoothed = null
      onReading(null)
    }
    frame = requestAnimationFrame(tick)
  }
  tick()

  return {
    stop: () => {
      cancelAnimationFrame(frame)
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
  const ctx = new AudioContext()
  const t = ctx.currentTime
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
    if (i === 0) osc.onended = () => void ctx.close()
  })
}
