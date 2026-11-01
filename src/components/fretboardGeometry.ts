/** Layout of the fretboard drawing, in SVG units. Shared by the SVG and the 3D hand on top of it. */
export const W = 1000
/** Room left of the nut for string-name chips and open-string bubbles. */
export const NUT_X = 92
export const NUT_W = 9
export const PICK_W = 96
export const NECK_END = W - PICK_W - 18
/** Fret numbers sit in a strip above the neck. */
export const TOP = 62
export const STRING_GAP = 38
/** How far the fingerboard reaches past the outer strings. */
export const NECK_MARGIN = 20

/** Scale factor of the fret formula, in SVG units: fretX(n) = NUT_X + fretScale * (1 - 2^(-n/12)). */
export function fretScale(frets: number) {
  return (NECK_END - NUT_X) / (1 - Math.pow(2, -frets / 12))
}

/** Distance from the nut using real guitar fret spacing, scaled to fit the visible frets. */
export function makeFretX(frets: number) {
  const scale = fretScale(frets)
  return (n: number) => NUT_X + scale * (1 - Math.pow(2, -n / 12))
}

/** Height of the drawing for a number of strings. */
export function fretboardHeight(strings: number) {
  return TOP + (strings - 1) * STRING_GAP + 58
}
