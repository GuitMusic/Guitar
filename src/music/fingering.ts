import type { FingeringOverrides, FretFinger, FretNote, PickFinger } from './types'

export interface FingeringResult {
  notes: FretNote[]
  /** Fret under the index finger after this beat, used as context for the next beat. */
  position: number | null
}

/**
 * Applies user overrides, then fills in missing fingers with simple, predictable rules:
 *
 * Fretting hand: one finger per fret from the current hand position. The hand stays where
 * it was while the new notes fit in the four-fret box, otherwise it moves so the lowest
 * fretted note gets the index finger.
 *
 * Picking hand: the thumb (p) plays the bass strings (4 and lower on a six-string), and
 * i, m, a play strings 3, 2 and 1.
 */
export function applyFingering(
  notes: FretNote[],
  numStrings: number,
  previousPosition: number | null,
  overrides: FingeringOverrides = {},
): FingeringResult {
  const withOverrides = notes.map((n) => {
    const o = overrides[n.key]
    if (!o) return n
    return {
      ...n,
      lh: o.lh !== undefined ? o.lh : n.lh,
      rh: o.rh !== undefined ? o.rh : n.rh,
      lhInferred: o.lh !== undefined ? false : n.lhInferred,
      rhInferred: o.rh !== undefined ? false : n.rhInferred,
    }
  })

  const fretted = withOverrides.filter((n) => n.tabFret > 0 && !n.isDead)
  const open = withOverrides.filter((n) => n.tabFret === 0 && !n.isDead).map((n) => n.string)
  const { fingers, position } = chooseFingers(fretted, previousPosition, open)
  const bassFrom = numStrings >= 6 ? 4 : Math.max(2, numStrings - 2)

  const result = withOverrides.map((n): FretNote => {
    let { lh, rh, lhInferred, rhInferred } = n
    if (lh === null && fingers.has(n)) {
      lh = fingers.get(n)!
      lhInferred = true
    }
    if (rh === null && !n.isTieContinuation) {
      rh = n.string >= bassFrom ? 'p' : trebleFinger(n.string)
      rhInferred = true
    }
    return { ...n, lh, rh, lhInferred, rhInferred }
  })

  return { notes: result, position }
}

function clampFinger(f: number): FretFinger {
  return Math.min(4, Math.max(1, f)) as FretFinger
}

/**
 * Picks fingers for the fretted notes that sound together, the way a player would:
 * every possible fingering is scored and the most natural playable one wins.
 *
 * Rules (hard): a finger can't be on two frets at once; a higher finger never sits on a
 * lower fret than a lower finger; the hand spans at most six frets.
 * Preferences (soft): one finger per fret; no stretching; stay where the hand already is,
 * and when it has to move, lean towards the index finger on the lowest fret; at one fret, the lower
 * finger takes the lower-pitched string (like A minor: middle on D, ring on G); barres only
 * when needed (index barres are fine, others less so); go easy on the little finger.
 *
 * Fingers already known (from the file or the player) are kept and shape the choice.
 */
export function chooseFingers(
  fretted: FretNote[],
  previous: number | null,
  open: number[] = [],
  hint?: Map<string, number>,
): { fingers: Map<FretNote, FretFinger>; position: number | null; cost: number } {
  const fingers = new Map<FretNote, FretFinger>()
  const pinned = fretted.filter((n) => n.lh !== null && n.lh > 0)
  const free = fretted.filter((n) => n.lh === null)
  if (fretted.length === 0) return { fingers, position: previous, cost: 0 }
  if (free.length > 8 || (free.length === 0 && pinned.length > 8)) {
    // Nothing to choose (or too many notes to search): the old rule, one finger per fret
    const minFret = Math.min(...fretted.map((n) => n.fret))
    const maxFret = Math.max(...fretted.map((n) => n.fret))
    let position = previous
    const pin = pinned[0]
    if (pin) position = Math.max(1, pin.fret - (pin.lh! - 1))
    else if (position === null || minFret < position || maxFret > position + 3) position = minFret
    for (const n of free) fingers.set(n, clampFinger(n.fret - position + 1))
    return { fingers, position, cost: Infinity }
  }

  const minFret = Math.min(...fretted.map((n) => n.fret))
  // The same chord comes back again and again in a song, so remember the answers
  const hintKey = hint ? [...hint].map(([k, f]) => `${k}=${f}`).join(',') : ''
  const cacheKey = `${previous}|${open.join('.')}|${hintKey}|${pinned.map((n) => `${n.string}.${n.fret}.${n.lh}`).join(',')}|${free.map((n) => `${n.string}.${n.fret}`).join(',')}`
  let solved = chordCache.get(cacheKey)
  if (!solved) {
    solved = searchFingers(
      pinned.map((n) => ({ string: n.string, fret: n.fret, f: n.lh as number })),
      free.map((n) => ({ string: n.string, fret: n.fret, f: 1 })),
      previous,
      minFret,
      open,
      hint,
    )
    if (chordCache.size > 2000) chordCache.clear()
    chordCache.set(cacheKey, solved)
  }
  const known = knownGrip(pinned, free, previous, minFret, open, hint)
  if (known && known.cost < solved.cost) solved = known
  const { best, cost: bestCost, position: bestPos } = solved
  if (bestCost === Infinity) {
    // Nothing playable (e.g. the file's fingers clash): fall back to one finger per fret
    const position = previous !== null && minFret >= previous && Math.max(...fretted.map((n) => n.fret)) <= previous + 3 ? previous : minFret
    for (const n of free) fingers.set(n, clampFinger(n.fret - position + 1))
    return { fingers, position, cost: Infinity }
  }
  free.forEach((n, i) => fingers.set(n, best[i] as FretFinger))
  return { fingers, position: bestPos, cost: bestCost }
}

/**
 * Chord shapes as most players finger them (low E string first, x = not played, 0 = open,
 * then fret:finger). Notes that all belong to one of these get its usual fingers, unless
 * that would be clearly harder: an intermediate player reaches for the shape they know.
 */
const GRIP_SHAPES: string[] = [
  'x 3:3 2:2 0 1:1 0', // C
  'x 3:3 2:2 0 0 0', // Cmaj7
  'x 3:3 2:2 3:4 1:1 0', // C7
  'x 3:2 2:1 0 3:3 0', // Cadd9
  '3:2 2:1 0 0 0 3:3', // G
  '3:2 2:1 0 0 3:3 3:4', // G, rock G
  '3:3 2:2 0 0 0 1:1', // G7
  'x x 0 2:1 3:3 2:2', // D
  'x x 0 2:2 1:1 2:3', // D7
  'x x 0 2:2 3:3 1:1', // Dm
  'x x 0 2:1 3:3 3:4', // Dsus4
  'x x 0 2:1 3:3 0', // Dsus2
  'x x 0 2:1 2:2 2:3', // Dmaj7
  'x 0 2:1 2:2 2:3 0', // A
  'x 0 2:2 0 2:3 0', // A7
  'x 0 2:2 2:3 1:1 0', // Am
  'x 0 2:2 0 1:1 0', // Am7
  'x 0 2:2 2:3 0 0', // Asus2
  '0 2:2 2:3 1:1 0 0', // E
  '0 2:2 2:3 0 0 0', // Em
  '0 2:2 0 1:1 0 0', // E7
  '0 2:2 2:3 0 3:4 0', // Em7
  'x x 3:3 2:2 1:1 1:1', // F (small)
  'x x 3:3 2:2 1:1 0', // Fmaj7
  '1:1 3:3 3:4 2:2 1:1 1:1', // F barre
  'x 2:2 1:1 2:3 0 2:4', // B7
  'x 2:1 4:3 4:4 3:2 2:1', // Bm
]
const GRIPS: Map<string, number>[] = GRIP_SHAPES.map((shape) => {
  const m = new Map<string, number>()
  shape.split(' ').forEach((cell, i) => {
    if (cell === 'x' || cell === '0') return
    const [fret, finger] = cell.split(':').map(Number)
    m.set(`${6 - i}.${fret}`, finger)
  })
  return m
})
/** How much easier a familiar chord shape feels than its score says. */
const GRIP_BONUS = 2.5

function knownGrip(pinned: FretNote[], free: FretNote[], previous: number | null, minFret: number, open: number[], hint?: Map<string, number>) {
  const all = [...pinned, ...free]
  if (all.length < 2) return null
  let found: { best: number[]; cost: number; position: number } | null = null
  for (const grip of GRIPS) {
    // Shapes are written as tab, so they work with a capo too
    const at = (n: FretNote) => `${n.string}.${n.tabFret}`
    if (!all.every((n) => grip.has(at(n)))) continue
    if (!pinned.every((n) => grip.get(at(n)) === n.lh)) continue
    // An open string the shape frets can't ring
    if (open.some((s) => [...grip.keys()].some((k) => k.startsWith(`${s}.`)))) continue
    const placed = all.map((n) => ({ string: n.string, fret: n.fret, f: grip.get(at(n))! }))
    const scored = scoreFingering(placed, previous, minFret, open, hint)
    const cost = scored.cost - GRIP_BONUS
    if (!found || cost < found.cost) found = { best: free.map((n) => grip.get(at(n))!), cost, position: scored.position }
  }
  return found
}

const chordCache = new Map<string, { best: number[]; cost: number; position: number }>()

/**
 * Tries the fingers note by note and stops early on anything unplayable (one finger on two
 * frets, crossed fingers, too wide a stretch), so only playable fingerings get scored.
 */
function searchFingers(known: Placed[], free: Placed[], previous: number | null, minFret: number, open: number[], hint?: Map<string, number>) {
  const all = known.concat(free)
  const k = known.length
  let best: number[] = []
  let cost = Infinity
  let position = 1
  const fits = (i: number) => {
    const a = all[i]
    for (let j = 0; j < i; j++) {
      const b = all[j]
      if (a.f === b.f && a.fret !== b.fret) return false
      if (a.f < b.f && a.fret > b.fret) return false
      if (a.f > b.f && a.fret < b.fret) return false
      if (Math.abs(a.fret - b.fret) > 5) return false
    }
    return true
  }
  for (let i = 1; i < k; i++) if (!fits(i)) return { best, cost, position }
  const step = (i: number) => {
    if (i === all.length) {
      const scored = scoreFingering(all, previous, minFret, open, hint)
      if (scored.cost < cost) {
        cost = scored.cost
        best = free.map((n) => n.f)
        position = scored.position
      }
      return
    }
    for (let f = 1; f <= 4; f++) {
      all[i].f = f
      if (fits(i)) step(i + 1)
    }
  }
  step(k)
  return { best, cost, position }
}

interface Placed {
  string: number
  fret: number
  f: number
}

function scoreFingering(notes: Placed[], previous: number | null, minFret: number, open: number[] = [], hint?: Map<string, number>): { cost: number; position: number } {
  let cost = 0
  // A finger already on a note (from the shape before) stays on it
  if (hint) for (const n of notes) {
    const f = hint.get(`${n.string}.${n.fret}`)
    if (f !== undefined && f !== n.f) cost += 1.2
  }
  // The hand sits where the index finger is; without the index, where it would be
  const index = notes.find((n) => n.f === 1)
  let position = Infinity
  if (index) position = index.fret
  else for (const n of notes) position = Math.min(position, n.fret - n.f + 1)
  position = Math.max(1, position)
  const maxFret = Math.max(...notes.map((n) => n.fret))
  if (maxFret - minFret > 5) return { cost: Infinity, position }
  const byFinger = new Map<number, Placed[]>()
  for (const n of notes) {
    const list = byFinger.get(n.f) ?? []
    list.push(n)
    byFinger.set(n.f, list)
  }
  for (const [f, list] of byFinger) {
    if (list.length < 2) continue
    if (list.some((n) => n.fret !== list[0].fret)) return { cost: Infinity, position }
    // One finger on several strings: a barre
    const strings = list.map((n) => n.string)
    const spread = Math.max(...strings) - Math.min(...strings) + 1
    // A finger lying across the strings would stop an open string ringing in between
    if (open.some((s) => s > Math.min(...strings) && s < Math.max(...strings))) return { cost: Infinity, position }
    // Short index barres compete with separate fingers; long ones are the only way
    if (f === 1) cost += spread === 2 ? 1.2 : spread === 3 ? 2.8 : 1.8
    else if (spread === list.length && list.length <= 3) cost += 1.6 * (list.length - 1)
    else return { cost: Infinity, position }
    // Nothing on a lower fret may sit inside the barre's reach for index barres
    if (f === 1 && notes.some((n) => n.f !== 1 && n.fret <= list[0].fret)) return { cost: Infinity, position }
  }
  for (let i = 0; i < notes.length; i++) {
    const a = notes[i]
    // Fingers bunched onto fewer frets are easy; reaching past one finger per fret is not
    const off = a.fret - (position + a.f - 1)
    cost += off > 0 ? off : -off * 0.5
    if (a.f === 4) cost += 0.25
    for (let j = 0; j < notes.length; j++) {
      const b = notes[j]
      if (a.f >= b.f) continue
      if (a.fret > b.fret) return { cost: Infinity, position }
      const stretch = b.fret - a.fret - (b.f - a.f)
      if (stretch > 0) cost += stretch * 1.5
      // Same fret: the lower finger should take the lower-pitched (higher-numbered) string
      if (a.fret === b.fret && a.string < b.string) cost += 2.5
    }
  }
  if (previous !== null && position !== previous) cost += 1.5 + 0.25 * Math.abs(position - previous)
  cost += 0.3 * Math.abs(position - minFret)
  return { cost, position }
}

function trebleFinger(stringNumber: number): PickFinger {
  if (stringNumber <= 1) return 'a'
  if (stringNumber === 2) return 'm'
  return 'i'
}

/** alphaTab Fingers enum value (Thumb = 0 … Little = 4, negatives = none) to a fretting finger. */
export function fretFingerFromAlphaTab(value: number): FretFinger | null {
  return value >= 0 && value <= 4 ? (value as FretFinger) : null
}

/** alphaTab Fingers enum value to a picking finger. */
export function pickFingerFromAlphaTab(value: number): PickFinger | null {
  const map: PickFinger[] = ['p', 'i', 'm', 'a', 'c']
  return value >= 0 && value <= 4 ? map[value] : null
}

export function fretFingerLabel(f: FretFinger): string {
  return f === 0 ? 'T' : String(f)
}
