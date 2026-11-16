/**
 * Quick fretboard games, answered by tapping: no microphone, no guitar needed.
 * Every game lasts one minute and is scored, so you can try to beat your best.
 */

import type { Difficulty } from '../components/DifficultySlider'

export type GameId = 'rush' | 'hunt' | 'octave' | 'climb'

export interface GameInfo {
  id: GameId
  title: string
  blurb: string
  how: string
}

export const GAMES: GameInfo[] = [
  { id: 'rush', title: 'Note rush', blurb: 'Name as many dots as you can in a minute. Keep a run going for bigger points.', how: 'Tap the name of the note under the dot.' },
  { id: 'hunt', title: 'Note hunt', blurb: 'One note, every place it lives on the neck. Find them all.', how: 'Tap every spot of the named note.' },
  { id: 'octave', title: 'Octave jump', blurb: 'From a dot, find its octave or the same pitch on another string. The shapes that link the neck together.', how: 'Tap the spot the prompt asks for.' },
  { id: 'climb', title: 'String climb', blurb: 'Walk up one string through the natural notes, from the open string. Learn each string as a line.', how: 'Tap the natural notes in order, going up the string.' },
]

export const GAME_SECONDS = 60
export const GAME_FRETS = 12

/** What the difficulty slider changes in a game. */
export interface GameLevel {
  /** Highest fret used. */
  frets: number
  /** Sharps and flats: never, once you have a few right, or from the start. */
  sharps: 'never' | 'later' | 'always'
  /** Points lost for a wrong tap. */
  penalty: number
}

/** Easy keeps to the first frets and the natural notes; Hard adds sharps from the start and costs points for a miss. */
export function gameLevel(game: GameId, d: Difficulty): GameLevel {
  if (d === 0) return { frets: game === 'octave' || game === 'climb' ? 7 : 5, sharps: 'never', penalty: 0 }
  if (d === 2) return { frets: GAME_FRETS, sharps: 'always', penalty: 5 }
  return { frets: GAME_FRETS, sharps: 'later', penalty: 0 }
}

/** One line for the slider: what this difficulty means. */
export const GAME_LEVEL_DETAIL = [
  'Frets 0 to 5 (to 7 in Octave jump and String climb), natural notes only, octaves but no same-pitch jumps.',
  'The neck up to fret 12. Sharps and flats join once you have a few right.',
  'The neck up to fret 12 with sharps and flats from the start. String climb takes every fret. A wrong tap costs 5 points.',
]

const MEDIUM: GameLevel = { frets: GAME_FRETS, sharps: 'later', penalty: 0 }
const sharpsOn = (level: GameLevel, right: number, after: number) => level.sharps === 'always' || (level.sharps === 'later' && right >= after)

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

/** Note rush: a dot to name. Naturals first; on Medium, sharps and flats join once you have 8 right. */
export function rushTurn(tuning: number[], right: number, previous: Spot | null, random: () => number = Math.random, level: GameLevel = MEDIUM): Spot {
  const all = neckSpots(tuning, level.frets).filter((s) => sharpsOn(level, right, 8) || isNatural(s.midi))
  const choices = all.filter((s) => !previous || s.midi % 12 !== previous.midi % 12)
  return pick(choices.length ? choices : all, random)
}

/** Note hunt: a pitch class and every place it is on the neck. */
export function huntTurn(
  tuning: number[],
  right: number,
  previous: number | null,
  random: () => number = Math.random,
  level: GameLevel = MEDIUM,
): { pc: number; spots: Spot[] } {
  const pcs = Array.from({ length: 12 }, (_, i) => i).filter((pc) => (sharpsOn(level, right, 3) || NATURAL.has(pc)) && pc !== previous)
  const pc = pick(pcs, random)
  return { pc, spots: neckSpots(tuning, level.frets).filter((s) => s.midi % 12 === pc) }
}

export interface OctaveTurn {
  from: Spot
  kind: 'octave' | 'unison'
  /** Every spot that answers it. */
  targets: Spot[]
}

/** Octave jump: from a dot, its octave (up or down) or the same pitch on another string. Easy asks octaves of natural notes only. */
export function octaveTurn(tuning: number[], previous: Spot | null, random: () => number = Math.random, level: GameLevel = MEDIUM): OctaveTurn {
  const all = neckSpots(tuning, level.frets)
  const starts = level.sharps === 'never' ? all.filter((s) => isNatural(s.midi)) : all
  for (let tries = 0; tries < 50; tries++) {
    const from = pick(starts, random)
    if (previous && from.string === previous.string && from.fret === previous.fret) continue
    const kind = level.sharps === 'never' || random() < 0.6 ? 'octave' : 'unison'
    const targets =
      kind === 'octave'
        ? all.filter((s) => Math.abs(s.midi - from.midi) === 12)
        : all.filter((s) => s.midi === from.midi && s.string !== from.string)
    if (targets.length) return { from, kind, targets }
  }
  // the open bass string always has its octave within the first frets
  const from = all.find((s) => s.string === tuning.length && s.fret === 0)!
  return { from, kind: 'octave', targets: all.filter((s) => s.midi === from.midi + 12) }
}

/** String climb: the natural notes on one string from the open string up, low to high. Hard climbs every fret. */
export function climbTurn(tuning: number[], previous: number | null, random: () => number = Math.random, level: GameLevel = MEDIUM): { string: number; steps: Spot[] } {
  const strings = tuning.map((_, i) => i + 1).filter((s) => s !== previous)
  const string = pick(strings, random)
  return { string, steps: neckSpots(tuning, level.frets).filter((s) => s.string === string && (level.sharps === 'always' || isNatural(s.midi))) }
}

/** Best scores are kept per difficulty. Medium keeps the original key, so scores from before the slider stay there. */
const bestKey = (d: Difficulty) => (d === 1 ? 'games-best' : d === 0 ? 'games-best-easy' : 'games-best-hard')

/** Best scores per game at one difficulty, kept in this browser. */
export function loadBest(d: Difficulty = 1): Partial<Record<GameId, number>> {
  try {
    return JSON.parse(localStorage.getItem(bestKey(d)) ?? '{}')
  } catch {
    return {}
  }
}

export function saveBest(best: Partial<Record<GameId, number>>, d: Difficulty = 1): void {
  try {
    localStorage.setItem(bestKey(d), JSON.stringify(best))
  } catch {
    // storage unavailable: the best score only lasts this visit
  }
}
