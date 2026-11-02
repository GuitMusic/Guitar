import { chooseFingers } from './fingering'
import type { FingeringOverrides, FretFinger, FretNote } from './types'

/** One moment in the music: the notes that start together, in time order. */
export interface FingerEvent {
  bar: number
  notes: FretNote[]
}

/** A stretch of music played from one hand shape (a "grip"), like a chord held through an arpeggio. */
export interface Grip {
  /** First and last event (inclusive) played from this grip. */
  start: number
  end: number
  /** Index-finger fret. */
  position: number | null
  /** Every fretted note of the grip, with its finger. */
  notes: FretNote[]
}

export interface SongFingering {
  /** Finger for every fretted note, by note key. */
  fingers: Map<string, FretFinger>
  grips: Grip[]
  /** Grip index of each event. */
  gripOf: number[]
}

/** How much harder a grip may get by adding a note before the hand rather moves to a new one. */
const MAX_EXTRA_COST = 2.5
/** More notes than this in one grip and the search gets slow, so the hand starts a new one. */
const MAX_GRIP_NOTES = 8

const fretted = (n: FretNote) => n.tabFret > 0 && !n.isDead
const spot = (n: FretNote) => `${n.string}.${n.fret}`

/**
 * Fingers a whole song the way a player thinks about it: in hand shapes, not note by note.
 *
 * Notes are gathered into a grip for as long as they can all be played from one hand
 * shape without it getting much harder: the notes of an arpeggiated C chord get the C
 * chord's fingers, even the ones that sound alone. When the next note doesn't fit, or a
 * bar starts, the hand takes a new grip (keeping fingers that are already on a note
 * where they are, and staying in place when it can).
 */
export function fingerSong(events: FingerEvent[], overrides: FingeringOverrides = {}): SongFingering {
  const withOverrides = (n: FretNote): FretNote => {
    const o = overrides[n.key]
    return o && o.lh !== undefined ? { ...n, lh: o.lh, lhInferred: false } : n
  }
  const evs = events.map((e) => ({ bar: e.bar, notes: e.notes.map(withOverrides) }))

  const grips: Grip[] = []
  const gripOf: number[] = []
  const fingers = new Map<string, FretFinger>()
  let position: number | null = null
  let hint: Map<string, number> | undefined

  // The grip being built
  let start = 0
  let spots = new Map<string, FretNote>()
  let open = new Set<number>()
  let solved: ReturnType<typeof chooseFingers> | null = null

  const solve = (s: Map<string, FretNote>, o: Set<number>) => chooseFingers([...s.values()], position, [...o].sort(), hint)

  const close = (end: number) => {
    if (end < start) return
    const notes: FretNote[] = []
    const result = solved
    for (const n of spots.values()) {
      const lh = (n.lh ?? result?.fingers.get(n) ?? null) as FretFinger | null
      notes.push({ ...n, lh })
    }
    const gi = grips.length
    grips.push({ start, end, position: result?.position ?? position, notes })
    for (let i = start; i <= end; i++) gripOf[i] = gi
    const bySpot = new Map(notes.map((n) => [spot(n), n.lh]))
    for (let i = start; i <= end; i++)
      for (const n of evs[i].notes) {
        if (!fretted(n)) continue
        const lh = n.lh ?? bySpot.get(spot(n)) ?? null
        if (lh !== null && lh > 0) fingers.set(n.key, lh as FretFinger)
      }
    if (result && result.position !== null) position = result.position
    hint = new Map(notes.filter((n) => n.lh !== null && n.lh > 0).map((n) => [spot(n), n.lh as number]))
  }

  evs.forEach((ev, i) => {
    const newSpots = new Map(spots)
    const newOpen = new Set(open)
    // The file (or the player) asks for another finger on a note the grip already holds: a shift
    let shifts = false
    for (const n of ev.notes) {
      if (n.isDead) continue
      const had = spots.get(spot(n))
      if (n.lh !== null && had?.lh != null && had.lh !== n.lh) shifts = true
      if (n.tabFret === 0) newOpen.add(n.string)
      else if (!newSpots.has(spot(n)) || (n.lh !== null && newSpots.get(spot(n))!.lh === null)) newSpots.set(spot(n), n)
    }
    const startsBar = i > start && ev.bar !== evs[i - 1].bar
    let fits = !startsBar && !shifts && i > start && newSpots.size <= MAX_GRIP_NOTES
    let next: ReturnType<typeof chooseFingers> | null = null
    if (fits) {
      next = newSpots.size === spots.size && newOpen.size === open.size ? solved : solve(newSpots, newOpen)
      const before = solved?.cost ?? 0
      fits = next !== null && next.cost !== Infinity && next.cost <= before + MAX_EXTRA_COST
    }
    if (i === start || fits) {
      spots = newSpots
      open = newOpen
      solved = i === start ? solve(spots, open) : next
      return
    }
    close(i - 1)
    start = i
    spots = new Map()
    open = new Set()
    for (const n of ev.notes) {
      if (n.isDead) continue
      if (n.tabFret === 0) open.add(n.string)
      else spots.set(spot(n), n)
    }
    solved = solve(spots, open)
  })
  close(evs.length - 1)

  // A grip says which finger plays each note, but notes that come one after another can share
  // a finger at the same fret (it hops across). When two of them sound together that would be
  // a barre: use another free finger instead when one fits, like the middle finger next to the index
  evs.forEach((ev, i) => {
    // Fingers written in the file (or chosen by the player) stay as they are
    const chosen = new Set(ev.notes.filter((n) => n.lh !== null).map((n) => n.key))
    const sounding = ev.notes.filter(fretted).map((n) => ({ ...n, lh: n.lh ?? fingers.get(n.key) ?? null }))
    const barred = sounding.filter((n) => sounding.some((m) => m !== n && m.lh === n.lh && m.fret === n.fret && m.string !== n.string))
    const free = barred.filter((n) => !chosen.has(n.key))
    if (free.length === 0) return
    const freeKeys = new Set(free.map((n) => n.key))
    const notes = sounding.map((n) => (freeKeys.has(n.key) ? { ...n, lh: null } : n))
    const open = ev.notes.filter((n) => n.tabFret === 0 && !n.isDead).map((n) => n.string)
    const refit = chooseFingers(notes, grips[gripOf[i]].position, open, undefined, true)
    if (refit.cost === Infinity) return
    for (const n of notes) {
      const f = refit.fingers.get(n)
      if (freeKeys.has(n.key) && f) fingers.set(n.key, f)
    }
  })
  return { fingers, grips, gripOf }
}
