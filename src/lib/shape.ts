/**
 * Body silhouettes, ported from github.com/jeremy-prt/bloub (MIT).
 *
 * The whole trick, and the reason there is no path-morphing library here:
 * every shape is a radial profile r(theta) sampled at the SAME angles, so any
 * two shapes have points that correspond one to one and a transition reduces
 * to a linear interpolation of radii. Upstream's docs/architecture.md puts it
 * as "every silhouette shares the same angular sampling" — a new shape has to
 * go through a radial profile or it cannot be morphed to.
 *
 * Pure — no DOM, no clock, no imports — so it can be checked in `shape.test.ts`
 * and so `bloub.ts` may depend on it without a cycle.
 */

export const SAMPLES = 64
/** Upstream's `BotEngine.SHAPE_MORPH`: the measured body transition, seconds. */
export const SHAPE_MORPH = 0.45

const TAU = Math.PI * 2
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const r2 = (v: number) => Math.round(v * 100) / 100

const ANGLES = Array.from({ length: SAMPLES }, (_, i) => (i / SAMPLES) * TAU)
const COS = ANGLES.map(Math.cos)
const SIN = ANGLES.map(Math.sin)

/** Brings the widest radius to `max`, so every shape carries the same weight. */
function normalise(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  return peak <= 0 ? radii : radii.map((r) => (r * max) / peak)
}

/** Superellipse |x|^n + |y|^n = 1. n = 2 is an ellipse, n ~ 4 the squircle. */
const superellipse = (n: number) =>
  ANGLES.map((_, i) => (Math.abs(COS[i]!) ** n + Math.abs(SIN[i]!) ** n) ** (-1 / n))

/** Exact regular polygon of circumradius 1: apothem over the cosine of the fan angle. */
const ngon = (sides: number, rotDeg: number) => {
  const seg = TAU / sides
  const rot = (rotDeg * Math.PI) / 180
  return ANGLES.map(
    (a) => Math.cos(seg / 2) / Math.cos((((a + rot) % seg) + seg) % seg - seg / 2),
  )
}

/**
 * Rounds corners by averaging neighbouring samples.
 *
 * Upstream builds a real Minkowski sum with a disc; this is the same effect in
 * five lines and exact along the flats, where the average of a constant is that
 * constant. Only the corners move, and inwards, which is what rounding is.
 */
const soften = (radii: number[], span: number) =>
  radii.map((_, i) => {
    let sum = 0
    for (let k = -span; k <= span; k++) sum += radii[(i + k + SAMPLES) % SAMPLES]!
    return sum / (span * 2 + 1)
  })

/**
 * The shapes the hero cycles through.
 *
 * Index 0 is the perfect circle and is load-bearing: the entrance spin is
 * fitted to a circle, and `randomCycle` holds slot 0 for its first period, so
 * the face lands before anything starts morphing.
 *
 * Every entry here was measured — see `shape.test.ts`. A silhouette is only
 * admissible if, across every expression and the whole gaze range, its eyes
 * overhang it no more than they overhang the circle (on the circle the outer
 * eye grazes the edge on purpose; that crop is what gives the volume). Two
 * upstream shapes were tried and rejected on that measure rather than by eye:
 *
 *  - the narrow ones — capsule, triangle, teardrop — need upstream's solved
 *    offset table (`eyefit.ts`), which is not ported here
 *  - `nuage`, whose profile varies fast enough that the min below bites
 *    discontinuously: a visible kink in the gaze, 0.19 units of frame-to-frame
 *    jerk against 0.08 for the squircle, and the eye pair closing up
 */
export const SHAPES: number[][] = [
  new Array(SAMPLES).fill(1),
  // galet: a circle bent by two low harmonics — irregular, but still smooth
  normalise(
    ANGLES.map((a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1)),
    1.02,
  ),
  // squircle: 1.15 and not 1.02, because a superellipse peaks on its diagonal,
  // so normalising on that peak yields a shape that reads smaller than the circle
  normalise(superellipse(4.2), 1.15),
  // hexagon: 0deg puts vertices left and right, so the top and bottom are flat.
  // Softened by one sample only — at span 5 the corners round so far that the
  // profile deviates by 0.3% and the "hexagon" is a circle wearing a name.
  normalise(soften(ngon(6, 0), 1), 1.06),
]

/** Interpolates two profiles into `out`, which is reused so nothing allocates at 60fps. */
export function blendShape(from: number[], to: number[], t: number, out: number[]): number[] {
  for (let i = 0; i < SAMPLES; i++) out[i] = lerp(from[i] ?? 1, to[i] ?? 1, t)
  out.length = SAMPLES
  return out
}

/**
 * Radius in an arbitrary direction, interpolated between the two neighbouring
 * samples.
 */
export function radiusAt(radii: number[], angle: number): number {
  const t = ((((angle / TAU) % 1) + 1) % 1) * SAMPLES
  const i = Math.floor(t)
  return lerp(radii[i % SAMPLES] ?? 1, radii[(i + 1) % SAMPLES] ?? 1, t - i)
}

/**
 * Narrowest radius across an arc, and the reason the eyes stay ON a body that
 * is not a circle.
 *
 * They live on a sphere of radius 1, so as soon as the silhouette stops being
 * one they have to be brought back pro rata of the real radius or the mask
 * crops them. Upstream does that pro rata at the eye's CENTRE and then carries
 * a solved per-shape offset table (`eyefit.ts`) to mop up what is left. The
 * leftover has a plainer cause: an eye covers an ARC, not a direction, so
 * scaling by the radius under its centre still lets its far end poke through a
 * neighbouring sector that is thinner. Taking the minimum across the span it
 * actually subtends removes the cause instead of correcting the symptom, and
 * needs no table.
 *
 * Upstream warns that a radial retreat can drag the two eyes together, and that
 * `min` is C0 but not C1. Both are real and both are measured in
 * `shape.test.ts`: every shape in the catalogue keeps its eye separation and
 * stays smooth, and the one that did not — `nuage` — was dropped for it. What
 * upstream hit was a solver reading these values inside the render loop with
 * feedback; this is a direct evaluation, so there is nothing to chatter.
 */
export function minRadiusOver(radii: number[], angle: number, half: number, steps = 9): number {
  if (!(half > 0)) return radiusAt(radii, angle)
  let min = Infinity
  for (let i = 0; i <= steps; i++) {
    const r = radiusAt(radii, angle - half + (2 * half * i) / steps)
    if (r < min) min = r
  }
  return min
}

/**
 * Closed profile to Catmull-Rom cubics.
 *
 * At 64 samples centred tangents are ample: the outline is smooth to the pixel
 * even drawn at 700px, and the `d` string stays short enough to rewrite every
 * frame during a morph.
 */
export function shapePath(radii: number[], scale: number, tension = 1 / 6): string {
  const x: number[] = []
  const y: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const r = (radii[i] ?? 1) * scale
    x.push(r * COS[i]!)
    y.push(r * SIN[i]!)
  }
  let d = `M${r2(x[0]!)} ${r2(y[0]!)}`
  for (let i = 0; i < SAMPLES; i++) {
    const a = (i - 1 + SAMPLES) % SAMPLES
    const b = (i + 1) % SAMPLES
    const c = (i + 2) % SAMPLES
    d +=
      `C${r2(x[i]! + (x[b]! - x[a]!) * tension)} ${r2(y[i]! + (y[b]! - y[a]!) * tension)}` +
      ` ${r2(x[b]! - (x[c]! - x[i]!) * tension)} ${r2(y[b]! - (y[c]! - y[i]!) * tension)}` +
      ` ${r2(x[b]!)} ${r2(y[b]!)}`
  }
  return `${d}Z`
}

/** Deterministic hash to [0,1). */
const hash = (n: number) => {
  let h = Math.imul(n ^ 0x9e3779b9, 2654435761) >>> 0
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

/**
 * Which of `n` slots is showing at time `t`, and how far the morph into it has
 * run. This is the idle life for a bloub with no pointer to follow: a touch
 * screen, a keyboard arrival, or a cursor that has left the window.
 *
 * A pure function of time, like the rest of the model — no timers, no state, so
 * every instance with its own `seed` runs its own schedule and they never fall
 * into lockstep. Slot 0 holds for the first period, which is what keeps the
 * hero on its circle until the entrance spin has landed.
 *
 * Two consecutive draws may land on the same slot; that simply reads as a
 * longer hold, and excluding it would cost a recursion for nothing.
 */
export function randomCycle(t: number, seed: number, n: number, hold: number, morph = SHAPE_MORPH) {
  const period = hold * (0.7 + hash(seed) * 0.6)
  const u = t / period
  const step = Math.floor(u)
  const slot = (s: number) => (s <= 0 ? 0 : Math.floor(hash(seed + s * 7919) * n) % n)
  const k = ((u - step) * period) / morph
  return { from: slot(step - 1), to: slot(step), k: k > 1 ? 1 : k }
}
