import type * as alphaTab from '@coderline/alphatab'
import { fretFingerFromAlphaTab, pickFingerFromAlphaTab } from '../music/fingering'
import type { FretNote } from '../music/types'

export function beatKey(beat: alphaTab.model.Beat): string {
  const bar = beat.voice.bar
  return `${bar.staff.track.index}:${bar.index}:${beat.voice.index}:${beat.index}`
}

/** Strings as tab numbers them: 1 = highest. alphaTab counts from the lowest string. */
export function tabString(note: alphaTab.model.Note, stringCount: number): number {
  return stringCount - note.string + 1
}

export function beatToFretNotes(beat: alphaTab.model.Beat): FretNote[] {
  const staff = beat.voice.bar.staff
  const stringCount = staff.tuning.length
  const key = beatKey(beat)
  return beat.notes
    .filter((n) => n.isStringed)
    .map((n) => {
      const string = tabString(n, stringCount)
      const lh = fretFingerFromAlphaTab(n.leftHandFinger)
      const rh = pickFingerFromAlphaTab(n.rightHandFinger)
      return {
        key: `${key}:${string}`,
        string,
        tabFret: n.fret,
        fret: n.fret + staff.capo,
        midi: n.realValue,
        lh,
        rh,
        lhInferred: false,
        rhInferred: false,
        isDead: n.isDead,
        isTieContinuation: n.isTieDestination,
      }
    })
}

/** The next beat in the same voice that actually has notes. */
export function nextSoundingBeat(beat: alphaTab.model.Beat): alphaTab.model.Beat | null {
  let next = beat.nextBeat
  for (let i = 0; i < 8 && next; i++) {
    if (!next.isRest && next.notes.length > 0) return next
    next = next.nextBeat
  }
  return null
}
