import * as alphaTab from '@coderline/alphatab'
import { useEffect, useState } from 'react'
import type { GuitarSound } from './Fretboard'

/** Helpers for the Practice page: the guitar sounds in the sound bank, layout and time. */

// Program numbers inside public/sounds/guitar.sf3
export const PROGRAM: Record<GuitarSound, number> = { steel: 25, nylon: 24, 'steel-dry': 27, 'nylon-dry': 28 }

/**
 * The sound bank holds only guitars, so every pitched track plays
 * one of them, whatever instrument the file asked for. Returns true if anything changed.
 */
export function setGuitarSound(score: alphaTab.model.Score, sound: GuitarSound = 'steel'): boolean {
  let changed = false
  for (const t of score.tracks) {
    if (t.staves.some((st) => st.isPercussion)) continue
    if (t.playbackInfo.program !== PROGRAM[sound]) {
      t.playbackInfo.program = PROGRAM[sound]
      changed = true
    }
    // Instrument changes inside the song would switch back to a sound the bank does not have
    for (const st of t.staves)
      for (const bar of st.bars)
        for (const v of bar.voices)
          for (const b of v.beats)
            for (const a of b.automations)
              if (a.type === alphaTab.model.AutomationType.Instrument && a.value !== PROGRAM[sound]) {
                a.value = PROGRAM[sound]
                changed = true
              }
  }
  return changed
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return matches
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
