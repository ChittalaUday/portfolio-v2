// node --test src/lib/shape.test.ts
// Guards the radial-profile morph ported from github.com/jeremy-prt/bloub. The
// whole transition rests on one invariant — every shape sampled at the SAME
// angles — so that is what is asserted here, along with the eye pro-rata that
// stops a non-circular body cropping its own eyes.
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { blendShape, minRadiusOver, radiusAt, randomCycle, SAMPLES, SHAPES, shapePath } from './shape.ts'
import { blinkScale, EXPRESSIONS, eyePoses } from './bloub.ts'

test('every silhouette shares the same angular sampling', () => {
  for (const [i, radii] of SHAPES.entries()) {
    assert.equal(radii.length, SAMPLES, `shape ${i} is not sampled at ${SAMPLES} angles`)
    for (const r of radii) assert.ok(r > 0.5 && r <= 1.24, `shape ${i} has an out-of-range radius ${r}`)
  }
})

test('a morph is a linear interpolation of radii, and lands on its endpoints', () => {
  const [circle, , squircle] = SHAPES
  const out: number[] = []
  assert.deepEqual(blendShape(circle!, squircle!, 0, out), circle)
  assert.deepEqual(blendShape(circle!, squircle!, 1, out), squircle)
  const mid = blendShape(circle!, squircle!, 0.5, out)
  for (let i = 0; i < SAMPLES; i++) {
    assert.ok(Math.abs(mid[i]! - (circle![i]! + squircle![i]!) / 2) < 1e-12)
  }
})

test('radiusAt reads the samples back, and interpolates between them', () => {
  const hex = SHAPES[3]!
  const TAU = Math.PI * 2
  for (let i = 0; i < SAMPLES; i++) {
    assert.ok(Math.abs(radiusAt(hex, (i / SAMPLES) * TAU) - hex[i]!) < 1e-9)
  }
  // halfway between two samples is their mean, and wrapping past TAU is the same angle
  const half = radiusAt(hex, (0.5 / SAMPLES) * TAU)
  assert.ok(Math.abs(half - (hex[0]! + hex[1]!) / 2) < 1e-9)
  assert.ok(Math.abs(radiusAt(hex, TAU + 0.3) - radiusAt(hex, 0.3)) < 1e-9)
})

const R = 100
const TAU = Math.PI * 2
/** The gaze envelope the hero and the marks actually sweep. */
const GAZE: [number, number][] = []
for (let yaw = -50; yaw <= 50; yaw += 5) for (let p = -12; p <= 30; p += 5) GAZE.push([yaw, p])

/**
 * Furthest any point of either eye's outline pokes past the silhouette, over
 * every gaze in the envelope. The eye is a stadium, and it is sampled as one:
 * a bbox-clamped circle overstates its corners by r*(sqrt2-1), which is the
 * same order as the differences being measured here.
 */
function overhang(radii: number[], expr: (typeof EXPRESSIONS)[string]): number {
  let worst = -Infinity
  for (const [yaw, pitch] of GAZE) {
    const poses = eyePoses({ yaw, pitch, roll: expr!.roll }, R, expr!.split)
    for (let i = 0; i < 2; i++) {
      const e = poses[i]!
      if (e.depth <= 0.02) continue
      const cfg = expr!.eyes[i]!
      const dist = Math.hypot(e.x, e.y)
      const half = dist > 1 ? Math.atan2((Math.max(cfg.w, cfg.h) * R) / 2, dist) : 0
      const fit = minRadiusOver(radii, Math.atan2(e.y, e.x), half)
      const phi = (cfg.tilt * Math.PI) / 180
      const cp = Math.cos(phi)
      const sp = Math.sin(phi)
      const ax = e.a * cp + e.c * sp
      const ay = e.b * cp + e.d * sp
      const cx = -e.a * sp + e.c * cp
      const cy = -e.b * sp + e.d * cp
      const k = blinkScale(1)
      const hw = (cfg.w * R) / 2
      const hh = (cfg.h * R) / 2
      const rr = Math.min(hw, hh)
      for (let s = 0; s < 64; s++) {
        const a = (s / 64) * TAU
        const lx = Math.cos(a) * rr + Math.sign(Math.cos(a)) * (hw - rr)
        const ly = Math.sin(a) * rr + Math.sign(Math.sin(a)) * (hh - rr)
        const px = e.x * fit + ax * lx + cx * ly
        const py = e.y * fit + ay * k * lx + cy * k * ly
        worst = Math.max(worst, Math.hypot(px, py) - radiusAt(radii, Math.atan2(py, px)) * R)
      }
    }
  }
  return worst
}

test('no silhouette crops its own eyes worse than the circle does', () => {
  // the circle's own overhang is deliberate — the outer eye grazes the edge and
  // that crop is what gives the volume — so it is the bar, not zero
  const ids = Object.keys(EXPRESSIONS)
  const bar = Math.max(...ids.map((id) => overhang(SHAPES[0]!, EXPRESSIONS[id]!)))
  for (const [i, radii] of SHAPES.entries()) {
    const worst = Math.max(...ids.map((id) => overhang(radii, EXPRESSIONS[id]!)))
    assert.ok(
      worst <= bar + 1,
      `shape ${i} overhangs by ${worst.toFixed(1)} against the circle's ${bar.toFixed(1)}`,
    )
  }
})

test('pulling the eyes back does not merge them, nor make the gaze kink', () => {
  // the two risks upstream names for a radial retreat. A shape that fails
  // either is not admissible — `nuage` failed the second and was dropped.
  const expr = EXPRESSIONS.attentif!
  for (const [si, radii] of SHAPES.entries()) {
    const track: [number, number][][] = [[], []]
    let separation = Infinity
    for (let f = 0; f < 400; f++) {
      const u = f / 400
      const gaze = { yaw: -26 + 16 * Math.sin(u * TAU), pitch: 10 - 13 * Math.sin(u * TAU * 0.7), roll: expr.roll }
      const poses = eyePoses(gaze, R, expr.split)
      const centres: [number, number][] = []
      for (let i = 0; i < 2; i++) {
        const e = poses[i]!
        const cfg = expr.eyes[i]!
        const dist = Math.hypot(e.x, e.y)
        const half = dist > 1 ? Math.atan2((Math.max(cfg.w, cfg.h) * R) / 2, dist) : 0
        const fit = minRadiusOver(radii, Math.atan2(e.y, e.x), half)
        const c: [number, number] = [e.x * fit, e.y * fit]
        centres.push(c)
        track[i]!.push(c)
      }
      separation = Math.min(separation, Math.hypot(centres[0]![0] - centres[1]![0], centres[0]![1] - centres[1]![1]))
    }
    assert.ok(separation > 35, `shape ${si} closed its eyes to ${separation.toFixed(1)} apart`)
    let jerk = 0
    for (const p of track) {
      for (let i = 2; i < p.length; i++) {
        const d1 = [p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]]
        const d0 = [p[i - 1]![0] - p[i - 2]![0], p[i - 1]![1] - p[i - 2]![1]]
        jerk = Math.max(jerk, Math.hypot(d1[0]! - d0[0]!, d1[1]! - d0[1]!))
      }
    }
    assert.ok(jerk < 0.15, `shape ${si} kinks the gaze: ${jerk.toFixed(3)} of per-frame jerk`)
  }
})

test('every shape is visibly not a circle, or it does not earn a slot', () => {
  for (let i = 1; i < SHAPES.length; i++) {
    const r = SHAPES[i]!
    const mean = r.reduce((a, b) => a + b, 0) / r.length
    const deviation = Math.max(...r.map((v) => Math.abs(v - mean))) / mean
    assert.ok(deviation > 0.05, `shape ${i} deviates by only ${(deviation * 100).toFixed(1)}% — it reads as a circle`)
    assert.ok(Math.max(...r) * R <= 124, `shape ${i} overflows the -125..125 viewBox`)
  }
})

test('the path is closed and starts where the profile does', () => {
  const d = shapePath(SHAPES[0]!, 100)
  assert.match(d, /^M100 0C/)
  assert.match(d, /Z$/)
})

test('randomCycle holds slot 0 first, so the entrance spin lands on the circle', () => {
  const seed = 0xb10b
  const at0 = randomCycle(0, seed, SHAPES.length, 6.4)
  assert.equal(at0.from, 0)
  assert.equal(at0.to, 0)
  // by 1.5s — well past TURN_TIME — nothing has started morphing yet
  assert.equal(randomCycle(1.5, seed, SHAPES.length, 6.4).to, 0)
  // it is a pure function of time: the same instant always gives the same frame
  assert.deepEqual(randomCycle(40, seed, 5, 6.4), randomCycle(40, seed, 5, 6.4))
  // and different seeds do not march in lockstep
  const spread = new Set(
    Array.from({ length: 12 }, (_, i) => randomCycle(40, i * 7919, 5, 6.4).to),
  )
  assert.ok(spread.size > 1, 'every seed picked the same slot')
})

test('k ramps across the morph window and then pins at 1', () => {
  const seed = 1234
  let sawRamp = false
  for (let t = 0; t < 60; t += 0.05) {
    const { k } = randomCycle(t, seed, 5, 6.4)
    assert.ok(k >= 0 && k <= 1, `k out of range at t=${t}: ${k}`)
    if (k > 0.1 && k < 0.9) sawRamp = true
  }
  assert.ok(sawRamp, 'the cycle never spent a frame mid-morph')
})
