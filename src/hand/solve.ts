import { dist, dot, norm, solveSPD, sub, type V3 } from './math'
import { fingerParam, forward, P_THUMB, PARAMS, type HandRig, type Pose } from './rig'

/**
 * The neck in millimetres, as the solver sees it. x runs from the nut towards the body,
 * y across the neck (string 1 at y = 0, the bass strings above it), z out of the
 * fingerboard towards the viewer. The fingerboard surface is z = 0.
 */
export interface Neck {
  /** Distance of fret n from the nut. */
  fretX: (n: number) => number
  /** y of string s (1 = highest string). */
  stringY: (s: number) => number
  strings: number
  /** Edges of the fingerboard: treble side (below string 1) and bass side. */
  edgeLow: number
  edgeHigh: number
  /** How deep the neck is behind the fingerboard. */
  depth: number
}

export type FingerTask =
  /** Fingertip presses one string at a fret. */
  | { kind: 'press'; string: number; fret: number }
  /** The finger lies flat across strings `from` (highest string) to `to` (lowest) at one fret. */
  | { kind: 'barre'; from: number; to: number; fret: number }
  /** Finger hovers just above a note it plays soon. */
  | { kind: 'hover'; string: number; fret: number }
  /** Finger is free: it relaxes above its fret, one finger per fret. */
  | { kind: 'free'; fret: number; string?: number }

export interface HandTask {
  /** Tasks for fingers 1-4 (index 0 = index finger). */
  fingers: FingerTask[]
  /** Thumb behind the neck, or wrapped over to fret the bass string at `fret`. */
  thumb: { kind: 'behind'; fret: number } | { kind: 'over'; string: number; fret: number }
}

/** Fingertip height above the fingerboard when pressing a string (mm). */
const PRESS_Z = 2.5
const HOVER_Z = 13
const FREE_Z = 19

/** Where across a fret the fingertip lands: 0 = previous fret, 1 = the fret wire. Close to the wire, like a real player. */
const ACROSS = 0.62

export function pressX(neck: Neck, fret: number): number {
  if (fret <= 0) return neck.fretX(0)
  const a = neck.fretX(fret - 1)
  const b = neck.fretX(fret)
  return a + (b - a) * ACROSS
}

/** Relaxed angles: a gently curved hand. */
const RELAXED = [0, 0.75, 0.95, 0.55]
const LIMITS: [number, number][] = [
  [-0.32, 0.32], // spread
  [-0.3, 1.55], // knuckle
  [0, 1.85], // middle joint
  [-0.45, 1.35], // end joint (bends backwards a little when flattened in a barre)
]
const THUMB_LIMITS: [number, number][] = [
  [-1.4, 1.4],
  [-1.4, 1.4],
  [-0.4, 1.2],
  [-0.5, 1.4],
]

/** Starting pose for a neck: hand below the treble edge, behind the fingerboard. */
export function initialPose(rig: HandRig, neck: Neck, task: HandTask): Float64Array {
  const p = new Float64Array(PARAMS)
  for (let f = 1; f <= 4; f++) {
    const o = fingerParam(f)
    for (let i = 0; i < 4; i++) p[o + i] = RELAXED[i]
  }
  p[P_THUMB] = 0.3
  p[P_THUMB + 2] = 0.3
  p[P_THUMB + 3] = 0.3
  // Move the hand so the knuckles sit just below the treble edge, level with the fingerboard
  const xs = task.fingers.map((f) => pressX(neck, f.fret))
  const pose = forward(rig, p, 1000, false)
  const k = pose.finger.map((f) => f[0])
  const mid: V3 = [(k[0][0] + k[3][0]) / 2, (k[1][1] + k[2][1]) / 2, (k[1][2] + k[2][2]) / 2]
  p[0] += (xs[0] + xs[3]) / 2 - mid[0]
  p[1] += neck.edgeLow - 10 - mid[1]
  p[2] += 4 - mid[2]
  return p
}

/** Signed distance from point (y, z) to the neck's cross-section (a rounded box). */
function neckDistance(neck: Neck, y: number, z: number): number {
  const r = 6
  const cy = (neck.edgeLow + neck.edgeHigh) / 2
  const cz = -neck.depth / 2
  const hy = (neck.edgeHigh - neck.edgeLow) / 2 - r
  const hz = neck.depth / 2 - r
  const dy = Math.abs(y - cy) - hy
  const dz = Math.abs(z - cz) - hz
  const outside = Math.hypot(Math.max(dy, 0), Math.max(dz, 0))
  return outside + Math.min(Math.max(dy, dz), 0) - r
}

function residuals(rig: HandRig, neck: Neck, task: HandTask, p: Float64Array, out: number[]): void {
  out.length = 0
  const pose: Pose = forward(rig, p, 1000, false)
  const hinge = (v: number, w: number) => out.push(v > 0 ? v * w : 0)
  const push3 = (a: V3, b: V3, w: number) => out.push((a[0] - b[0]) * w, (a[1] - b[1]) * w, (a[2] - b[2]) * w)

  const tasks = task.fingers
  for (let i = 0; i < 4; i++) {
    const t = tasks[i]
    const [mcp, pip, dip, tip] = pose.finger[i]
    const o = fingerParam(i + 1)
    const x = pressX(neck, t.fret)
    const end = norm(sub(tip, dip))
    if (t.kind === 'press') {
      push3(tip, [x, neck.stringY(t.string) - 1.5, PRESS_Z], 1.2)
      // Fingertip comes down almost straight onto the string, so it doesn't touch the next string
      hinge(end[2] + 0.82, 25)
      // Stay on this fret: the finger's middle joints shouldn't drift across the fret wires
      out.push((dip[0] - x) * 0.15)
    } else if (t.kind === 'barre') {
      const top = neck.stringY(t.to)
      const bottom = neck.stringY(t.from)
      const full = t.from === 1
      // Flat finger along the fret: the tip just past the top string, the joints on the strings below
      push3(tip, [x, top + 5, PRESS_Z + 2], 1)
      out.push((dip[0] - x) * 0.8, (dip[2] - 6) * 0.8, (pip[0] - x) * 0.6, (pip[2] - 7) * 0.6)
      // The pad has to reach down to the lowest barred string
      hinge(pip[1] - (full ? bottom - 4 : bottom + 2), 0.6)
    } else if (t.kind === 'hover') {
      push3(tip, [x, neck.stringY(t.string) - 2, HOVER_Z], 0.45)
      hinge(end[2] + 0.6, 6)
    } else {
      const y = neck.stringY(t.string ?? Math.min(neck.strings, 3 + (i === 3 ? 0 : 1)))
      push3(tip, [x, y, FREE_Z], 0.18)
    }
    // Natural joint coupling: the end joint follows the middle joint
    if (t.kind !== 'barre') out.push((p[o + 3] - 0.65 * p[o + 2]) * 6)
    // Comfort: stay near a relaxed hand
    for (let k = 0; k < 4; k++) out.push((p[o + k] - RELAXED[k]) * (k === 0 ? 7 : 2.5))
    for (let k = 0; k < 4; k++) {
      const [lo, hi] = LIMITS[k]
      hinge(lo - p[o + k], 120)
      hinge(p[o + k] - hi, 120)
    }
    // Keep the finger out of the neck (the tip may touch the fingerboard)
    hinge(9 - neckDistance(neck, mcp[1], mcp[2]), 2)
    hinge(7 - neckDistance(neck, pip[1], pip[2]), 2)
    hinge(5.5 - neckDistance(neck, dip[1], dip[2]), 2)
  }

  // Fingers stay apart and in order along the neck
  for (let i = 0; i < 3; i++) {
    const a = pose.finger[i]
    const b = pose.finger[i + 1]
    hinge(15 - dist(a[1], b[1]), 1.5)
    hinge(14 - dist(a[2], b[2]), 1.5)
    hinge(13 - dist(a[3], b[3]), 1.5)
    hinge(a[3][0] - b[3][0] + 6, 0.8)
  }

  // Thumb: behind the neck, roughly behind the index and middle fingers, or wrapped over the top
  const th = pose.thumb
  if (task.thumb.kind === 'behind') {
    const x = (pressX(neck, task.thumb.fret) + pressX(neck, task.thumb.fret + 1)) / 2 - 4
    const y = neck.edgeLow + (neck.edgeHigh - neck.edgeLow) * 0.62
    push3(th[3], [x, y, -neck.depth - 6], 0.35)
  } else {
    push3(th[3], [pressX(neck, task.thumb.fret), neck.stringY(task.thumb.string) + 2, PRESS_Z + 3], 1)
  }
  for (let k = 0; k < 4; k++) {
    const [lo, hi] = THUMB_LIMITS[k]
    hinge(lo - p[P_THUMB + k], 120)
    hinge(p[P_THUMB + k] - hi, 120)
    out.push(p[P_THUMB + k] * 1.2)
  }
  hinge(8 - neckDistance(neck, th[1][1], th[1][2]), 2)
  hinge(7 - neckDistance(neck, th[2][1], th[2][2]), 2)
  hinge(5 - neckDistance(neck, th[3][1], th[3][2]), 2)

  // Palm stays clear of the neck, below and behind it
  for (const m of pose.metacarpals) hinge(14 - neckDistance(neck, m[1], m[2]), 2)
  hinge(22 - neckDistance(neck, pose.wrist[1], pose.wrist[2]), 2)
  // Wrist: a relaxed, slightly bent wrist below the neck
  const r: V3 = [p[3], p[4], p[5]]
  out.push(r[0] * 12, r[1] * 12, r[2] * 12)
    // The palm faces the neck: the knuckle line runs along the neck
  const knuckles = norm(sub(pose.finger[3][0], pose.finger[0][0]))
  out.push(dot(knuckles, [0, 1, 0]) * 20, dot(knuckles, [0, 0, 1]) * 10)
}

export interface SolveResult {
  params: Float64Array
  /** Largest distance (mm) between a pressing fingertip and its target. */
  error: number
}

/** Fits the hand to the task with Levenberg-Marquardt, starting from `start`. */
export function solveHand(rig: HandRig, neck: Neck, task: HandTask, start?: Float64Array, iterations = 60): SolveResult {
  const n = PARAMS
  const p = start ? Float64Array.from(start) : initialPose(rig, neck, task)
  const r0: number[] = []
  const r1: number[] = []
  residuals(rig, neck, task, p, r0)
  let cost = sumSq(r0)
  let lambda = 1e-2
  const trial = new Float64Array(n)
  for (let it = 0; it < iterations; it++) {
    const m = r0.length
    const J = new Float64Array(m * n)
    for (let j = 0; j < n; j++) {
      const eps = j < 3 ? 0.05 : 1e-4
      const keep = p[j]
      p[j] = keep + eps
      residuals(rig, neck, task, p, r1)
      p[j] = keep
      for (let i = 0; i < m; i++) J[i * n + j] = (r1[i] - r0[i]) / eps
    }
    const JtJ = new Float64Array(n * n)
    const g = new Float64Array(n)
    for (let i = 0; i < m; i++) {
      const ri = r0[i]
      if (ri === 0 && rowIsZero(J, i, n)) continue
      for (let a = 0; a < n; a++) {
        const ja = J[i * n + a]
        if (ja === 0) continue
        g[a] += ja * ri
        for (let b = a; b < n; b++) JtJ[a * n + b] += ja * J[i * n + b]
      }
    }
    for (let a = 0; a < n; a++) for (let b = 0; b < a; b++) JtJ[a * n + b] = JtJ[b * n + a]
    let improved = false
    for (let tries = 0; tries < 8; tries++) {
      const A = Float64Array.from(JtJ)
      for (let a = 0; a < n; a++) A[a * n + a] += lambda * (JtJ[a * n + a] + 1e-3)
      const step = solveSPD(A, g.map((v) => -v), n)
      if (!step) {
        lambda *= 4
        continue
      }
      for (let a = 0; a < n; a++) trial[a] = p[a] + step[a]
      residuals(rig, neck, task, trial, r1)
      const c = sumSq(r1)
      if (c < cost) {
        const gain = cost - c
        p.set(trial)
        r0.length = 0
        r0.push(...r1)
        cost = c
        lambda = Math.max(1e-6, lambda / 3)
        improved = gain > 1e-4 * Math.max(1, cost)
        break
      }
      lambda *= 4
    }
    if (!improved) break
  }
  return { params: p, error: pressError(rig, neck, task, p) }
}

function rowIsZero(J: Float64Array, i: number, n: number) {
  for (let a = 0; a < n; a++) if (J[i * n + a] !== 0) return false
  return true
}

const sumSq = (r: number[]) => r.reduce((s, v) => s + v * v, 0)

/** How far each pressing fingertip is from its string (mm), the largest one. */
export function pressError(rig: HandRig, neck: Neck, task: HandTask, p: Float64Array): number {
  const pose = forward(rig, p, 1000, false)
  let worst = 0
  task.fingers.forEach((t, i) => {
    if (t.kind !== 'press') return
    const tip = pose.finger[i][3]
    worst = Math.max(worst, dist(tip, [pressX(neck, t.fret), neck.stringY(t.string) - 1.5, PRESS_Z]))
  })
  return worst
}
