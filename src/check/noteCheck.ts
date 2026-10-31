import { midiToFrequency } from '../music/notes'

/** One snapshot of the microphone spectrum (dB per FFT bin). */
export interface SpectrumFrame {
  /** performance.now() when the frame was taken */
  t: number
  db: Float32Array
}

export interface SpectrumInfo {
  sampleRate: number
  fftSize: number
}

export type NoteResult = 'hit' | 'late' | 'miss'

export const CHECK = {
  /** A note must get this much louder than just before the beat. */
  riseDb: 8,
  /** …and be at least this loud. */
  floorDb: -72,
  /** …and stand out this much from the frequencies next to it (rules out clicks and knocks). */
  salienceDb: 10,
  /** "Before" = the quietest the note was in this window before the frame. */
  lookbackMinMs: 40,
  lookbackMaxMs: 220,
  /** Played this early still counts (people often rush a little). */
  earlyMs: -80,
  /** On time up to here, late up to lateMs, missed after. */
  onTimeMs: 180,
  lateMs: 380,
}

/**
 * Loudness of a note in one frame, ±1 bin (low notes also use their second harmonic).
 */
export function noteLevel(frame: SpectrumFrame, midi: number, info: SpectrumInfo): number {
  return measure(frame, midi, info).level
}

/**
 * Level of the note and how much it stands out from the bins around it. A real note is
 * a narrow peak; the click of a pluck or a knock raises every bin, so it stands out little.
 */
export function measure(frame: SpectrumFrame, midi: number, info: SpectrumInfo): { level: number; salience: number } {
  const binHz = info.sampleRate / info.fftSize
  let level = -Infinity
  let salience = -Infinity
  // Low strings have a weak fundamental, so also look at the octave above. Higher
  // notes use the fundamental only, so a note's overtones don't count as other notes.
  const harmonics = midi < 52 ? [1, 2] : [1]
  for (const h of harmonics) {
    const bin = Math.round((midiToFrequency(midi) * h) / binHz)
    let peak = -Infinity
    for (let b = bin - 1; b <= bin + 1; b++) {
      if (b > 0 && b < frame.db.length && frame.db[b] > peak) peak = frame.db[b]
    }
    const around: number[] = []
    for (let d = 3; d <= 8; d++) {
      if (bin - d > 0) around.push(frame.db[bin - d])
      if (bin + d < frame.db.length) around.push(frame.db[bin + d])
    }
    around.sort((a, b) => a - b)
    const floor = around.length ? around[Math.floor(around.length / 2)] : -120
    level = Math.max(level, peak)
    salience = Math.max(salience, peak - floor)
  }
  return { level, salience }
}

/**
 * True when the note starts (is plucked) in frame i: it is loud, stands out as a note,
 * and is clearly louder than its quietest moment just before. Comparing with "just
 * before" rather than a fixed moment also catches a string that is plucked again
 * while still ringing.
 */
function onsetAt(frames: SpectrumFrame[], i: number, midi: number, info: SpectrumInfo): boolean {
  const f = frames[i]
  const { level, salience } = measure(f, midi, info)
  if (level < CHECK.floorDb || salience < CHECK.salienceDb) return false
  let before = Infinity
  for (let j = i - 1; j >= 0; j--) {
    const dt = f.t - frames[j].t
    if (dt < CHECK.lookbackMinMs) continue
    if (dt > CHECK.lookbackMaxMs) break
    before = Math.min(before, noteLevel(frames[j], midi, info))
  }
  if (!Number.isFinite(before)) return false
  return level - before >= CHECK.riseDb
}

/** Was this note played around beatTime? On time, late, or missed. */
export function judgeNote(frames: SpectrumFrame[], midi: number, beatTime: number, info: SpectrumInfo): NoteResult {
  for (let i = 0; i < frames.length; i++) {
    const dt = frames[i].t - beatTime
    if (dt < CHECK.earlyMs || dt > CHECK.lateMs) continue
    if (onsetAt(frames, i, midi, info)) return dt <= CHECK.onTimeMs ? 'hit' : 'late'
  }
  return 'miss'
}

/** Wait mode: which of these notes have been plucked since playback paused at `since`? */
export function notesPlayedSince(frames: SpectrumFrame[], midis: number[], since: number, info: SpectrumInfo): Set<number> {
  const played = new Set<number>()
  for (const midi of midis) {
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].t <= since + 60) continue
      if (onsetAt(frames, i, midi, info)) {
        played.add(midi)
        break
      }
    }
  }
  return played
}

/** Share of notes hit (late counts half). */
export function accuracy(results: NoteResult[]): number {
  if (results.length === 0) return 0
  const score = results.reduce((s, r) => s + (r === 'hit' ? 1 : r === 'late' ? 0.5 : 0), 0)
  return score / results.length
}

/** Speed trainer step: after a clean pass go up, never past the target. */
export function nextTrainerSpeed(current: number, passAccuracy: number | null, opts = { step: 0.05, target: 1, cleanAt: 0.9 }): number {
  const clean = passAccuracy === null || passAccuracy >= opts.cleanAt
  if (!clean) return current
  return Math.min(opts.target, Math.round((current + opts.step) * 100) / 100)
}
