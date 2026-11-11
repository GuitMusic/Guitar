import { sharedAudioContext } from '../audio/unlock'
import { OnsetDetector } from './rhythm'

/** Click pitches, so the onset listener can filter the click out of what the mic hears. */
export const CLICK_HZ = { accent: 1760, beat: 1320 }

export interface OnsetListener {
  stop: () => void
  /** Turns the click filter on (while playing) or off (for the delay check, which listens to the clicks). */
  filterClicks: (on: boolean) => void
}

const HOP = 128

/**
 * Listens to the mic on the same audio clock as the clicks and reports each note start,
 * as a time on that clock (before any delay correction). Notch filters take out the
 * click's pitches, so speakers' clicks do not count as your notes.
 */
export async function listenForOnsets(onOnset: (time: number, level: number) => void): Promise<OnsetListener> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const ctx = sharedAudioContext()
  void ctx.resume().catch(() => {})
  const source = ctx.createMediaStreamSource(stream)
  const notches = [CLICK_HZ.accent, CLICK_HZ.beat, CLICK_HZ.accent * 2, CLICK_HZ.beat * 2].map((f) => {
    const n = ctx.createBiquadFilter()
    n.type = 'notch'
    n.frequency.value = f
    n.Q.value = 4
    return n
  })
  // source -> notch -> notch -> notch -> notch -> processor, or source -> processor
  for (let i = 0; i < notches.length - 1; i++) notches[i].connect(notches[i + 1])
  // A script processor gives the samples with their place on the audio clock
  const proc = ctx.createScriptProcessor(512, 1, 1)
  notches[notches.length - 1].connect(proc)
  const mute = ctx.createGain()
  mute.gain.value = 0
  let useFilter = true
  const connect = () => {
    source.disconnect()
    source.connect(useFilter ? notches[0] : proc)
  }
  connect()
  proc.connect(mute).connect(ctx.destination)
  const detector = new OnsetDetector()
  proc.onaudioprocess = (e) => {
    const data = e.inputBuffer.getChannelData(0)
    const sr = e.inputBuffer.sampleRate
    // the input block ends one block before it would be played out
    const start = e.playbackTime - (2 * data.length) / sr
    for (let i = 0; i + HOP <= data.length; i += HOP) {
      let sum = 0
      for (let j = i; j < i + HOP; j++) sum += data[j] * data[j]
      const level = Math.sqrt(sum / HOP)
      const t = detector.push(level, start + i / sr)
      if (t !== null) onOnset(t, level)
    }
  }
  return {
    stop: () => {
      proc.onaudioprocess = null
      proc.disconnect()
      source.disconnect()
      notches.forEach((n) => n.disconnect())
      stream.getTracks().forEach((t) => t.stop())
    },
    filterClicks: (on) => {
      if (on === useFilter) return
      useFilter = on
      detector.reset()
      connect()
    },
  }
}

/** Plays a metronome click at a time on the audio clock. */
export function clickAt(time: number, level: 1 | 2, volume = 0.6): void {
  const ctx = sharedAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = level === 2 ? CLICK_HZ.accent : CLICK_HZ.beat
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
  osc.connect(gain).connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.08)
  osc.onended = () => gain.disconnect()
}

/** How late the speakers play compared with the audio clock, in seconds. */
export function outputDelay(): number {
  const ctx = sharedAudioContext() as AudioContext
  return (ctx.outputLatency || 0) + (ctx.baseLatency || 0)
}
