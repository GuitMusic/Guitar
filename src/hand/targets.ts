import type { FretNote } from '../music/types'
import type { FingerTask, HandTask } from './solve'

/**
 * Works out what each finger of the fretting hand does from the notes on the fretboard:
 * press a string, lie flat across several strings (barre), hover above a note that comes
 * later in the bar, or rest above its own fret.
 *
 * `current` are the notes sounding or still held now, `later` the rest of the bar's shape.
 * Returns null when nothing is fretted and there is no hand position to show.
 */
export function buildHandTask(current: FretNote[], later: FretNote[], handPosition: number | null, strings: number): HandTask | null {
  const fretted = (n: FretNote) => n.fret > 0 && n.tabFret > 0 && !n.isDead && n.lh !== null
  const now = current.filter(fretted)
  const soon = later.filter(fretted)

  const tasks: (FingerTask | null)[] = [null, null, null, null]
  let thumb: HandTask['thumb'] | null = null

  for (let f = 1; f <= 4; f++) {
    const mine = now.filter((n) => n.lh === f)
    if (mine.length === 0) continue
    // Prefer the note being played over one that's only held
    const sorted = [...mine].sort((a, b) => Number(!!a.isHeld) - Number(!!b.isHeld) || a.string - b.string)
    const fret = sorted[0].fret
    const sameFret = mine.filter((n) => n.fret === fret)
    if (sameFret.length > 1) {
      const ss = sameFret.map((n) => n.string)
      tasks[f - 1] = { kind: 'barre', from: Math.min(...ss), to: Math.max(...ss), fret }
    } else {
      tasks[f - 1] = { kind: 'press', string: sorted[0].string, fret }
    }
  }
  const thumbNote = now.find((n) => n.lh === 0)
  // The thumb can only reach over the neck to the two bass strings
  if (thumbNote && thumbNote.string >= strings - 1) thumb = { kind: 'over', string: thumbNote.string, fret: thumbNote.fret }

  for (let f = 1; f <= 4; f++) {
    if (tasks[f - 1]) continue
    const next = soon.find((n) => n.lh === f && !now.some((c) => c.string === n.string))
    if (next) tasks[f - 1] = { kind: 'hover', string: next.string, fret: next.fret }
  }

  // Index-finger fret: from the hand position, or from any finger that has a job
  let base = handPosition
  if (base === null || base <= 0) {
    const known = tasks.findIndex((t) => t !== null)
    if (known < 0) return null
    base = Math.max(1, tasks[known]!.fret - known)
  }
  // Every finger with a job pins where the others can be: frets never go backwards from index to little
  for (let f = 1; f <= 4; f++) {
    if (tasks[f - 1]) continue
    const before = tasks.slice(0, f - 1).filter((t): t is FingerTask => t !== null).map((t) => t.fret)
    const after = tasks.slice(f).filter((t): t is FingerTask => t !== null).map((t) => t.fret)
    let fret = base + f - 1
    if (before.length) fret = Math.max(fret, Math.max(...before))
    if (after.length) fret = Math.min(fret, Math.min(...after))
    fret = Math.max(1, fret)
    // Next to a finger on the same fret, rest on the string beside it instead of crossing it:
    // a lower finger sits towards the bass strings (like the middle finger in A minor)
    const prev = tasks[f - 2]
    const next = tasks[f]
    let string: number | undefined
    if (next && next.kind !== 'free' && next.fret === fret) string = Math.min(strings, (next.kind === 'barre' ? next.to : next.string) + 1)
    else if (prev && prev.kind !== 'free' && prev.fret === fret) string = Math.max(1, (prev.kind === 'barre' ? prev.from : prev.string) - 1)
    tasks[f - 1] = string ? { kind: 'free', fret, string } : { kind: 'free', fret }
  }

  const fingers = tasks as FingerTask[]
  return { fingers, thumb: thumb ?? { kind: 'behind', fret: Math.max(1, Math.min(fingers[0].fret, fingers[1].fret)) } }
}

/** The same hand, lifted off the strings: used while only open strings ring. */
export function liftHand(task: HandTask): HandTask {
  return {
    fingers: task.fingers.map((t) =>
      t.kind === 'press' ? { kind: 'hover', string: t.string, fret: t.fret } : t.kind === 'barre' ? { kind: 'hover', string: t.to, fret: t.fret } : t,
    ),
    thumb: task.thumb.kind === 'over' ? { kind: 'behind', fret: task.thumb.fret } : task.thumb,
  }
}

export function taskKey(task: HandTask): string {
  return JSON.stringify(task)
}
