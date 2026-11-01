import { add, cross, dot, norm, qAxis, qFromBases, qMul, qRot, scale, sub, type Q, type V3 } from './math'

/**
 * Kinematic model of a hand, built from the rest pose of a WebXR hand model (25 joints,
 * every bone a direct child of the armature). Joint orientations follow the WebXR
 * convention: -Z points along the bone towards the fingertip, +Y out of the back of the hand.
 *
 * Pose parameters (all angles in radians):
 *   0-2   wrist position (world, mm)
 *   3-5   wrist rotation, as a rotation vector applied on top of the base orientation
 *   6-21  index, middle, ring, little: [spread, knuckle bend, middle-joint bend, end-joint bend]
 *   22-25 thumb: [swing across the palm, roll, base-joint bend, end-joint bend]
 */

export const FINGER_NAMES = ['index', 'middle', 'ring', 'pinky'] as const
export const PARAMS = 26
export const P_WRIST = 0
export const P_ROT = 3
export const fingerParam = (finger: number) => 6 + (finger - 1) * 4
export const P_THUMB = 22

export interface BindJoint {
  p: V3
  q: Q
}

export type BindPose = Record<string, BindJoint>

interface FingerRig {
  /** Bone names from knuckle to tip: proximal, intermediate, distal, tip. */
  names: string[]
  meta: string
  /** Knuckle (MCP) position in rest pose, metres from the wrist. */
  mcp: V3
  /** Rest-pose segment vectors: knuckle→middle joint, middle→end joint, end joint→tip. */
  seg: [V3, V3, V3]
  bendAxis: V3
  spreadAxis: V3
}

interface ThumbRig {
  names: string[]
  base: V3
  seg: [V3, V3, V3]
  bendAxis: V3
}

export interface HandRig {
  bind: BindPose
  wrist: V3
  fingers: FingerRig[]
  thumb: ThumbRig
  /** Hand axes in the rest pose: towards the fingers, out of the back of the hand, towards the thumb. */
  forward: V3
  dorsal: V3
  lateral: V3
  /** Rotation from the rest-pose hand axes to the base world orientation used by the solver. */
  base: Q
}

/** Reads the rest pose of every joint from a .glb file (no three.js needed). */
export function bindFromGlb(buffer: ArrayBuffer): BindPose {
  const view = new DataView(buffer)
  const jsonLength = view.getUint32(12, true)
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)))
  const bind: BindPose = {}
  for (const n of json.nodes as { name?: string; translation?: number[]; rotation?: number[] }[]) {
    if (!n.name || !n.translation || !n.rotation) continue
    bind[n.name] = { p: n.translation as V3, q: n.rotation as Q }
  }
  return bind
}

const axisOf = (q: Q, a: V3) => qRot(q, a)

/**
 * Builds the rig. `worldForward` and `worldDorsal` say how the hand sits with no extra
 * rotation: the direction the fingers point and the direction the back of the hand faces.
 */
export function makeRig(bind: BindPose, worldForward: V3, worldDorsal: V3): HandRig {
  const wrist = bind.wrist.p
  const forward = norm(sub(bind['middle-finger-phalanx-proximal'].p, wrist))
  let dorsal = axisOf(bind.wrist.q, [0, 1, 0])
  dorsal = norm(sub(dorsal, scale(forward, dot(dorsal, forward))))
  let lateral = cross(dorsal, forward)
  // Make "lateral" point towards the thumb
  if (dot(lateral, sub(bind['thumb-tip'].p, wrist)) < 0) lateral = scale(lateral, -1)

  const fingers = FINGER_NAMES.map((f): FingerRig => {
    const names = ['phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'].map((s) => `${f}-finger-${s}`)
    const [a, b, c, d] = names.map((n) => bind[n].p)
    const seg: [V3, V3, V3] = [sub(b, a), sub(c, b), sub(d, c)]
    const q = bind[names[0]].q
    let bendAxis = axisOf(q, [1, 0, 0])
    // Bending must curl the finger towards the palm
    const moved = qRot(qAxis(bendAxis, 0.2), seg[0])
    if (dot(sub(moved, seg[0]), dorsal) > 0) bendAxis = scale(bendAxis, -1)
    let spreadAxis = axisOf(q, [0, 1, 0])
    // Positive spread turns the finger towards the thumb
    const turned = qRot(qAxis(spreadAxis, 0.2), seg[0])
    if (dot(sub(turned, seg[0]), lateral) < 0) spreadAxis = scale(spreadAxis, -1)
    return { names, meta: `${f}-finger-metacarpal`, mcp: sub(a, wrist), seg, bendAxis, spreadAxis }
  })

  const tn = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip']
  const [ta, tb, tc, td] = tn.map((n) => bind[n].p)
  const tseg: [V3, V3, V3] = [sub(tb, ta), sub(tc, tb), sub(td, tc)]
  // The thumb bends in the plane of its bones, towards the palm side
  let thumbBend = norm(cross(tseg[0], dorsal))
  const tm = qRot(qAxis(thumbBend, 0.2), tseg[1])
  if (dot(sub(tm, tseg[1]), dorsal) > 0) thumbBend = scale(thumbBend, -1)

  const base = qFromBases(forward, dorsal, norm(worldForward), norm(worldDorsal))
  return {
    bind,
    wrist,
    fingers,
    thumb: { names: tn, base: sub(ta, wrist), seg: tseg, bendAxis: thumbBend },
    forward,
    dorsal,
    lateral,
    base,
  }
}

export interface Pose {
  /** World position (mm) and rotation of every joint, by joint name. */
  joints: Record<string, { p: V3; q: Q }>
  /** Handy points for the solver: finger joints from knuckle to tip, in mm. */
  finger: V3[][]
  thumb: V3[]
  metacarpals: V3[]
  wrist: V3
}

/**
 * Forward kinematics. `mm` scales the rig (metres) to world millimetres.
 * When `withJoints` is false only the points the solver needs are computed.
 */
export function forward(rig: HandRig, p: ArrayLike<number>, mm = 1000, withJoints = true): Pose {
  const t: V3 = [p[0], p[1], p[2]]
  const qw = qMul(qExpSafe([p[3], p[4], p[5]]), rig.base)
  const toWorld = (local: V3): V3 => add(t, scale(qRot(qw, local), mm))
  const joints: Pose['joints'] = {}
  const put = (name: string, local: V3, delta: Q | null) => {
    if (!withJoints) return
    const q = delta ? qMul(qw, qMul(delta, rig.bind[name].q)) : qMul(qw, rig.bind[name].q)
    joints[name] = { p: toWorld(local), q }
  }
  put('wrist', [0, 0, 0], null)
  const finger: V3[][] = []
  const metacarpals: V3[] = []
  rig.fingers.forEach((f, i) => {
    const o = 6 + i * 4
    const spread = qAxis(f.spreadAxis, p[o])
    const axis = qRot(spread, f.bendAxis)
    const d1 = qMul(qAxis(axis, p[o + 1]), spread)
    const d2 = qMul(qAxis(axis, p[o + 1] + p[o + 2]), spread)
    const d3 = qMul(qAxis(axis, p[o + 1] + p[o + 2] + p[o + 3]), spread)
    const j0 = f.mcp
    const j1 = add(j0, qRot(d1, f.seg[0]))
    const j2 = add(j1, qRot(d2, f.seg[1]))
    const j3 = add(j2, qRot(d3, f.seg[2]))
    const metaLocal = sub(rig.bind[f.meta].p, rig.wrist)
    put(f.meta, metaLocal, null)
    put(f.names[0], j0, d1)
    put(f.names[1], j1, d2)
    put(f.names[2], j2, d3)
    put(f.names[3], j3, d3)
    finger.push([toWorld(j0), toWorld(j1), toWorld(j2), toWorld(j3)])
    metacarpals.push(toWorld(metaLocal))
  })
  const th = rig.thumb
  const o = P_THUMB
  const cmc = qMul(qAxis(rig.forward, p[o + 1]), qAxis(rig.dorsal, p[o]))
  const bend = qRot(cmc, th.bendAxis)
  const t1 = qMul(qAxis(bend, p[o + 2]), cmc)
  const t2 = qMul(qAxis(bend, p[o + 2] + p[o + 3]), cmc)
  const k0 = th.base
  const k1 = add(k0, qRot(cmc, th.seg[0]))
  const k2 = add(k1, qRot(t1, th.seg[1]))
  const k3 = add(k2, qRot(t2, th.seg[2]))
  put(th.names[0], k0, cmc)
  put(th.names[1], k1, t1)
  put(th.names[2], k2, t2)
  put(th.names[3], k3, t2)
  return { joints, finger, thumb: [toWorld(k0), toWorld(k1), toWorld(k2), toWorld(k3)], metacarpals, wrist: t }
}

function qExpSafe(r: V3): Q {
  const a = Math.hypot(r[0], r[1], r[2])
  if (a < 1e-9) return [0, 0, 0, 1]
  return qAxis([r[0] / a, r[1] / a, r[2] / a], a)
}
