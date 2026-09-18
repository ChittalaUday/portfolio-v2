/**
 * The bloub face, ported from github.com/jeremy-prt/bloub (MIT).
 *
 * The numbers here are MEASUREMENTS, not settings — the upstream repo fitted
 * them frame-by-frame off a reference video, and its docs/measurements.md is
 * explicit that tidying them breaks the resemblance. Verified traps kept intact:
 *
 *  - the body is a PERFECT CIRCLE, not a squircle (radial deviation < 0.7%),
 *    and the entrance spin only works on a circle
 *  - the eyes lean `\`, never `/`
 *  - transitions are exponential ease-outs; the body never overshoots, and
 *    there is deliberately no spring engine
 *  - at rest the body does not float; the life is gaze drift and blinking
 *
 * Pure — no DOM — so the sphere model can be checked in `bloub.test.ts`.
 */

export const TAU = Math.PI * 2
export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v)

export const easings = {
  easeOutQuint: (t: number) => 1 - (1 - t) ** 5,
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
}

/** Periodic 1D noise — loops seamlessly, used for gaze drift. */
export function loopNoise(t: number, period: number, seed = 0): number {
  const p = (t / period) * TAU
  return (
    0.55 * Math.sin(p + seed) +
    0.3 * Math.sin(2 * p + seed * 1.7 + 1.1) +
    0.15 * Math.sin(3 * p + seed * 2.3 + 2.4)
  )
}

/** mulberry32 — deterministic, so the blink schedule is identical every load. */
function createRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ─────────────────────────── measured geometry ─────────────────────────── */

/** Half-separation of the eyes on the sphere, degrees (total ~31°). */
export const EYE_SPLIT = 15.46
/** Eye size at rest (upstream `neutre`), in units of ball radius. */
export const EYE_W = 0.186
export const EYE_H = 0.412

/**
 * Upstream's `attentif` expression, used here as the default.
 *
 * Not an invented scale-up of the rest values: these are that state's own
 * measured proportions and eye split. It is the right one for a face whose
 * whole job is watching the pointer — gaze.ts picks its rest pitch precisely so
 * the bot reads "attentif plutot qu'absent".
 */
export const ATTENTIF = { w: 0.21, h: 0.44, split: 16 }
/** Head orientation at rest, fitted to the reference frames. */
export const REST_GAZE = { yaw: 28.49, pitch: 28.62, roll: -13 }

/* ─────────────────────────── gaze (chosen, not measured) ───────────────── */

export const YAW_MAX = 16
export const PITCH_MAX = 13
/** Gaze sits slightly above the equator — attentive rather than absent. */
export const PITCH = 10
/** Head turns toward the page content rather than holding its rest pose. */
export const TURN = 26
/** A full turn travelled on the way in. Lands exact: -360° is the same as 0. */
export const SPIN = 360
export const TURN_TIME = 1.1

type Vec3 = [number, number, number]

export interface HeadGaze {
  yaw: number
  pitch: number
  roll: number
}

export interface EyePose {
  x: number
  y: number
  /** tangent 2x2, in the sense of SVG matrix(a,b,c,d,e,f) */
  a: number
  b: number
  c: number
  d: number
  /** z of the normal; > 0 = facing the viewer */
  depth: number
}

const deg = (d: number) => (d * Math.PI) / 180

/** Rotates two vectors of an orthonormal frame within their common plane. */
function spin(u: Vec3, v: Vec3, angle: number): [Vec3, Vec3] {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [
    [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s],
    [v[0] * c - u[0] * s, v[1] * c - u[1] * s, v[2] * c - u[2] * s],
  ]
}

/**
 * Head frame, then each eye's. Screen frame: x right, y down, z toward viewer.
 * Index 0 is the inner eye, 1 the outer. The compression, the tilt and the
 * passage behind the limb all fall out of the projection on their own — which
 * is what gives the volume.
 */
export function eyePoses(gaze: HeadGaze, scale: number, split = EYE_SPLIT): [EyePose, EyePose] {
  let f: Vec3 = [0, 0, 1]
  let right: Vec3 = [1, 0, 0]
  let down: Vec3 = [0, 1, 0]

  ;[f, right] = spin(f, right, deg(gaze.yaw))
  ;[down, f] = spin(down, f, deg(gaze.pitch))
  ;[right, down] = spin(right, down, deg(gaze.roll))

  const build = (side: number): EyePose => {
    const [ef, er] = spin(f, right, deg(split * side))
    return { x: ef[0] * scale, y: ef[1] * scale, a: er[0], b: er[1], c: down[0], d: down[1], depth: ef[2] }
  }
  return [build(-1), build(1)]
}

export function capsulePath(w: number, h: number): string {
  const r2 = (v: number) => Math.round(v * 100) / 100
  const hw = Math.max(w, 0.01) / 2
  const hh = Math.max(h, 0.01) / 2
  const r = Math.min(hw, hh)
  return (
    `M${r2(-hw)} ${r2(-hh + r)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(-hw + r)} ${r2(-hh)}` +
    `L${r2(hw - r)} ${r2(-hh)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(hw)} ${r2(-hh + r)}` +
    `L${r2(hw)} ${r2(hh - r)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(hw - r)} ${r2(hh)}` +
    `L${r2(-hw + r)} ${r2(hh)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(-hw)} ${r2(hh - r)}Z`
  )
}

/* ─────────────────────────── blinking ─────────────────────────── */

const BLINK_RNG = createRng(0x5eed)
/** Pre-drawn blink schedule: deterministic and stateless. */
const BLINKS: number[] = (() => {
  const out: number[] = []
  let t = 1.4
  while (t < 900) {
    out.push(t)
    t += 1.9 + BLINK_RNG() * 2.7
    if (BLINK_RNG() < 0.18) {
      out.push(t)
      t += 0.24
    }
  }
  return out
})()

/** Measured: 1 to 2 frames at 10 fps. */
export const BLINK_DUR = 0.18

export function blinkLid(t: number): number {
  for (let i = 0; i < BLINKS.length; i++) {
    const start = BLINKS[i]!
    if (t < start) break
    const k = (t - start) / BLINK_DUR
    if (k >= 0 && k <= 1) return k < 0.45 ? 1 - k / 0.45 : (k - 0.45) / 0.55
  }
  return 1
}

/**
 * A blink is a VERTICAL squash in screen space around the eye's centre — the
 * bbox width is preserved — not a shrink along the capsule's tilted axis. So it
 * composes after the tangent matrix, touching only the y outputs.
 */
export const blinkScale = (lid: number) => 0.06 + 0.94 * clamp(lid)

/* ─────────────────────────── idle life ─────────────────────────── */

export function liveliness(t: number, wander = 1) {
  return {
    dYaw: (loopNoise(t, 11.3, 0.4) * 5.5 + loopNoise(t, 3.7, 2.1) * 1.6) * wander,
    dPitch: (loopNoise(t, 9.1, 1.3) * 4.2 + loopNoise(t, 4.3, 0.7) * 1.3) * wander,
    dRoll: loopNoise(t, 13.7, 3.2) * 2.2 * wander,
    // the reference video is near-still at rest (centre stable to ±0.003); this
    // is only enough that the image is not completely frozen. Do not add float.
    driftX: loopNoise(t, 7.9, 1.9) * 0.006,
    driftY: loopNoise(t, 5.3, 0.3) * 0.007,
    breath: 1 + Math.sin((t / 3.4) * TAU) * 0.005,
  }
}

/**
 * Where the head points. `tour` drives the entrance: it fades out the travelled
 * spin, so the eyes go round the back of the ball and land exactly on the
 * tracking pose — `-360°` being the same angle as `0`.
 */
export function lookGaze(nx: number, ny: number, tour: number, hasPointer: boolean, t: number): HeadGaze {
  const life = liveliness(t, hasPointer ? 0 : 1)
  return {
    yaw: -TURN + nx * YAW_MAX + SPIN * (1 - tour) + life.dYaw,
    // positive pitch = looking up, while screen y grows downward
    pitch: PITCH - ny * PITCH_MAX + life.dPitch,
    roll: REST_GAZE.roll + life.dRoll,
  }
}
