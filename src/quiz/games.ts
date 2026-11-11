/**
 * Quick fretboard games, answered by tapping: no microphone, no guitar needed.
 * Every game lasts one minute and is scored, so you can try to beat your best.
 */

export type GameId = 'rush' | 'hunt' | 'octave' | 'climb'

export interface GameInfo {
  id: GameId
  title: string
  blurb: string
  how: string
}

export const GAMES: GameInfo[] = [
  { id: 'rush', title: 'Note rush', blurb: 'Name as many dots as you can in a minute. Keep a run going for bigger points.', how: 'Tap the name of the note under the dot.' },
  { id: 'hunt', title: 'Note hunt', blurb: 'One note, every place it lives on the neck up to fret 12. Find them all.', how: 'Tap every spot of the named note.' },
  { id: 'octave', title: 'Octave jump', blurb: 'From a dot, find its octave or the same pitch on another string. The shapes that link the neck together.', how: 'Tap the spot the prompt asks for.' },
  { id: 'climb', title: 'String climb', blurb: 'Walk up one string through the natural notes, open to fret 12. Learn each string as a line.', how: 'Tap the natural notes in order, going up the string.' },
]

export const GAME_SECONDS = 60
export const GAME_FRETS = 12

const NATURAL = new Set([0, 2, 4, 5, 7, 9, 11])
export const isNatural = (midi: number) => NATURAL.has(((midi % 12) + 12) % 12)

export interface Spot {
  string: number
  fret: number
  midi: number
}

/** Every spot on the neck from the open string to `frets`. String 1 is the highest. */
export function neckSpots(tuning: number[], frets = GAME_FRETS): Spot[] {
  return tuning.flatMap((open, i) => Array.from({ length: frets + 1 }, (_, fret) => ({ string: i + 1, fret, midi: open + fret })))
}

const pick = <T>(items: T[], random: () => number): T => items[Math.min(items.length - 1, Math.floor(random() * items.length))]

/** Points for a right answer: 10, times 1 to 4 as the run of right answers grows (every 5 in a row). */
export function multiplier(run: number): number {
  return Math.min(4, 1 + Math.floor(run / 5))
}

/** Note rush: a dot to name. Naturals first; sharps and flats join once you have 8 right. */
export function rushTurn(tuning: number[], right: number, previous: Spot | null, random: () => number = Math.random): Spot {
  const all = neckSpots(tuning).filter((s) => right >= 8 || isNatural(s.midi))
  const choices = all.filter((s) => !previous || s.midi % 12 !== previous.midi % 12)
  return pick(choices.length ? choices : all, random)
}

/** Note hunt: a pitch class and every place it is on the neck. */
export function huntTurn(tuning: number[], right: number, previous: number | null, random: () => number = Math.random): { pc: number; spots: Spot[] } {
  const pcs = Array.from({ length: 12 }, (_, i) => i).filter((pc) => (right >= 3 || NATURAL.has(pc)) && pc !== previous)
  const pc = pick(pcs, random)
  return { pc, spots: neckSpots(tuning).filter((s) => s.midi % 12 === pc) }
}

export interface OctaveTurn {
  from: Spot
  kind: 'octave' | 'unison'
  /** Every spot that answers it. */
  targets: Spot[]
}

/** Octave jump: from a dot, its octave (up or down) or the same pitch on another string. */
export function octaveTurn(tuning: number[], previous: Spot | null, random: () => number = Math.random): OctaveTurn {
  const all = neckSpots(tuning)
  for (let tries = 0; tries < 50; tries++) {
    const from = pick(all, random)
    if (previous && from.string === previous.string && from.fret === previous.fret) continue
    const kind = random() < 0.6 ? 'octave' : 'unison'
    const targets =
      kind === 'octave'
        ? all.filter((s) => Math.abs(s.midi - from.midi) === 12)
        : all.filter((s) => s.midi === from.midi && s.string !== from.string)
    if (targets.length) return { from, kind, targets }
  }
  const from = all.find((s) => s.string === 1 && s.fret === 0)!
  return { from, kind: 'octave', targets: all.filter((s) => s.midi === from.midi + 12) }
}

/** String climb: the natural notes on one string from open to fret 12, low to high. */
export function climbTurn(tuning: number[], previous: number | null, random: () => number = Math.random): { string: number; steps: Spot[] } {
  const strings = tuning.map((_, i) => i + 1).filter((s) => s !== previous)
  const string = pick(strings, random)
  return { string, steps: neckSpots(tuning).filter((s) => s.string === string && isNatural(s.midi)) }
}

/** Best scores per game, kept in this browser. */
export function loadBest(): Partial<Record<GameId, number>> {
  try {
    return JSON.parse(localStorage.getItem('games-best') ?? '{}')
  } catch {
    return {}
  }
}

export function saveBest(best: Partial<Record<GameId, number>>): void {
  try {
    localStorage.setItem('games-best', JSON.stringify(best))
  } catch {
    // storage unavailable: the best score only lasts this visit
  }
}
