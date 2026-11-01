/** Tiny vector and quaternion helpers on plain arrays, so the hand solver runs without three.js. */

export type V3 = [number, number, number]
/** Quaternion as [x, y, z, w]. */
export type Q = [number, number, number, number]

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2])
export const norm = (a: V3): V3 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
export const dist = (a: V3, b: V3) => len(sub(a, b))
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function qMul(a: Q, b: Q): Q {
  const [ax, ay, az, aw] = a
  const [bx, by, bz, bw] = b
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ]
}

/** Rotation of `angle` radians about the unit `axis`. */
export function qAxis(axis: V3, angle: number): Q {
  const s = Math.sin(angle / 2)
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)]
}

/** Rotation from a rotation vector (axis times angle). */
export function qExp(r: V3): Q {
  const a = len(r)
  if (a < 1e-9) return [r[0] / 2, r[1] / 2, r[2] / 2, 1]
  return qAxis(scale(r, 1 / a), a)
}

export function qRot(q: Q, v: V3): V3 {
  // v + 2w(u×v) + 2u×(u×v)
  const u: V3 = [q[0], q[1], q[2]]
  const t = scale(cross(u, v), 2)
  return add(add(v, scale(t, q[3])), cross(u, t))
}

/** Rotation that turns the orthonormal basis (a1, a2, a1×a2) into (b1, b2, b1×b2). */
export function qFromBases(a1: V3, a2: V3, b1: V3, b2: V3): Q {
  const a3 = cross(a1, a2)
  const b3 = cross(b1, b2)
  // R = B * A^T
  const m = (r: number, c: number) => b1[r] * a1[c] + b2[r] * a2[c] + b3[r] * a3[c]
  return qFromMatrix(m(0, 0), m(0, 1), m(0, 2), m(1, 0), m(1, 1), m(1, 2), m(2, 0), m(2, 1), m(2, 2))
}

function qFromMatrix(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Q {
  const tr = m00 + m11 + m22
  if (tr > 0) {
    const s = 0.5 / Math.sqrt(tr + 1)
    return [(m21 - m12) * s, (m02 - m20) * s, (m10 - m01) * s, 0.25 / s]
  }
  if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22)
    return [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]
  }
  if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22)
    return [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s]
  }
  const s = 2 * Math.sqrt(1 + m22 - m00 - m11)
  return [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s]
}

/** Solves A x = b for a small dense symmetric positive definite A (Cholesky). Returns null if it fails. */
export function solveSPD(A: Float64Array, b: Float64Array, n: number): Float64Array | null {
  const L = new Float64Array(n * n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i * n + j]
      for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k]
      if (i === j) {
        if (s <= 0) return null
        L[i * n + i] = Math.sqrt(s)
      } else {
        L[i * n + j] = s / L[j * n + j]
      }
    }
  }
  const y = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    let s = b[i]
    for (let k = 0; k < i; k++) s -= L[i * n + k] * y[k]
    y[i] = s / L[i * n + i]
  }
  const x = new Float64Array(n)
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i]
    for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k]
    x[i] = s / L[i * n + i]
  }
  return x
}
