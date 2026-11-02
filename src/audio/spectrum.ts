import type { SpectrumFrame, SpectrumInfo } from '../check/noteCheck'
import { registerAudioContext } from './unlock'

export interface SpectrumListener {
  info: SpectrumInfo
  /** Frames from the last ~2 seconds, oldest first. */
  frames: () => SpectrumFrame[]
  /** Called after every new frame. */
  onFrame: (cb: (() => void) | null) => void
  stop: () => void
}

const KEEP_MS = 2000

/**
 * Records the microphone's spectrum about 60 times a second so the app can check
 * which notes were played, even several at once.
 */
export async function listenToSpectrum(): Promise<SpectrumListener> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const ctx = new AudioContext()
  // Made after the microphone prompt, so outside the click: Safari can start it suspended
  const unregister = registerAudioContext(ctx)
  void ctx.resume().catch(() => {})
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 8192
  analyser.smoothingTimeConstant = 0
  source.connect(analyser)
  const info = { sampleRate: ctx.sampleRate, fftSize: analyser.fftSize }
  let frames: SpectrumFrame[] = []
  let callback: (() => void) | null = null
  let raf = 0

  const tick = () => {
    const db = new Float32Array(analyser.frequencyBinCount)
    analyser.getFloatFrequencyData(db)
    const now = performance.now()
    frames.push({ t: now, db })
    if (frames.length > 0 && now - frames[0].t > KEEP_MS) frames = frames.filter((f) => now - f.t <= KEEP_MS)
    callback?.()
    raf = requestAnimationFrame(tick)
  }
  tick()

  return {
    info,
    frames: () => frames,
    onFrame: (cb) => {
      callback = cb
    },
    stop: () => {
      cancelAnimationFrame(raf)
      unregister()
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}
