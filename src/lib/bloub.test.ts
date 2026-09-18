// node --test src/lib/bloub.test.ts
// Guards the sphere model ported from github.com/jeremy-prt/bloub. Its
// docs/measurements.md lists "verified traps not to be corrected" — these are
// those traps, asserted, so a later tidy-up cannot silently break the likeness.
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  blinkLid,
  blinkScale,
  eyePoses,
  lookGaze,
  REST_GAZE,
  SPIN,
  TURN,
  YAW_MAX,
} from './bloub.ts'

const R = 100

test('the eyes live on a sphere: the outer eye is depth-compressed', () => {
  const [inner, outer] = eyePoses(REST_GAZE, R)
  // at REST_GAZE the head looks up-right, so the +side eye is nearer the limb
  const ratio = Math.abs(outer.a) / Math.abs(inner.a)
  assert.ok(Math.abs(outer.a) < Math.abs(inner.a), `outer ${outer.a} should be narrower than inner ${inner.a}`)
  // measured 0.674 off the video, 0.69 in upstream face.ts, ~0.708 from the
  // model — source vs fit, so the band covers the spread
  assert.ok(ratio > 0.6 && ratio < 0.8, `depth ratio ${ratio.toFixed(3)} outside the measured band`)
})

test('the eyes lean like \\ and never like / — at rest, ~26deg off vertical', () => {
  const [inner, outer] = eyePoses(REST_GAZE, R)
  // the capsule's long axis is its local +y, mapped to (c, d): going down the
  // capsule must also go right for a `\` lean
  for (const e of [inner, outer]) {
    assert.ok(e.c > 0, `lean flipped to /: c=${e.c}`)
    assert.ok(e.d > 0, 'the capsule must not be upside down')
  }
  const tilt = (Math.atan2(inner.c, inner.d) * 180) / Math.PI
  assert.ok(tilt > 18 && tilt < 34, `rest tilt ${tilt.toFixed(1)}deg — docs measure ~26`)
})

test('across the tracking envelope the lean never becomes a pronounced /', () => {
  // The tilt is a CONSEQUENCE of the tangent frame, not a constant, so it
  // varies with gaze. Upstream never has to bound it because its expressions
  // each carry their own roll; a single tracking face does.
  //
  // Worst case measured over the whole envelope: c = -0.088 at nx=-1, ny=-1
  // (pointer in the far corner), which is ~5deg — below perception on a 44-unit
  // capsule, and it reads vertical rather than `/`. The bound is set just past
  // it so a genuine sign flip from a refactor still fails, while upstream's
  // measured constants stay untouched.
  let worst = 1
  for (const nx of [-1, -0.5, 0, 0.5, 1]) {
    for (const ny of [-1, -0.5, 0, 0.5, 1]) {
      for (const e of eyePoses(lookGaze(nx, ny, 1, true, 0), R)) {
        worst = Math.min(worst, e.c)
        assert.ok(e.c > -0.12, `lean inverted at nx=${nx} ny=${ny}: c=${e.c}`)
        assert.ok(e.d > 0.5, `capsule collapsed at nx=${nx} ny=${ny}: d=${e.d}`)
      }
    }
  }
  const tilt = (Math.asin(Math.max(-1, worst)) * 180) / Math.PI
  console.log(`   worst lean across envelope: c=${worst.toFixed(3)} (${tilt.toFixed(1)}deg)`)
})

test('both eyes face the viewer at rest', () => {
  for (const e of eyePoses(REST_GAZE, R)) assert.ok(e.depth > 0.02, `eye culled at rest: depth ${e.depth}`)
})

test('the entrance spin lands exactly — -360 is the same angle as 0', () => {
  // this is the whole reason the spin needs no clean-up frame
  const landed = eyePoses(lookGaze(0.3, -0.2, 1, true, 0), R)
  const spun = eyePoses({ ...lookGaze(0.3, -0.2, 1, true, 0), yaw: lookGaze(0.3, -0.2, 1, true, 0).yaw + SPIN }, R)
  landed.forEach((e, i) => {
    assert.ok(Math.abs(e.x - spun[i]!.x) < 1e-6, `x drifted by ${e.x - spun[i]!.x}`)
    assert.ok(Math.abs(e.a - spun[i]!.a) < 1e-6, `a drifted by ${e.a - spun[i]!.a}`)
  })
})

test('the spin actually carries the eyes behind the ball on the way in', () => {
  // at tour=0 the full 360 is still in play; somewhere in the sweep an eye must
  // pass the limb, otherwise it is a slide across the face rather than a turn
  let culled = false
  for (let tour = 0; tour <= 1; tour += 0.02) {
    if (eyePoses(lookGaze(0, 0, tour, true, 0), R).some((e) => e.depth <= 0.02)) culled = true
  }
  assert.ok(culled, 'no eye ever went behind the limb — the turn is not a turn')
})

test('gaze tracking stays inside the chosen envelope', () => {
  for (const nx of [-1, -0.5, 0, 0.5, 1]) {
    const g = lookGaze(nx, 0, 1, true, 0)
    // head is turned toward the content; the pointer swings it by at most YAW_MAX
    assert.ok(g.yaw >= -TURN - YAW_MAX - 1 && g.yaw <= -TURN + YAW_MAX + 1, `yaw ${g.yaw} escaped`)
  }
})

test('a blink is a vertical squash that never fully closes the hole', () => {
  assert.equal(blinkScale(1), 1)
  assert.ok(Math.abs(blinkScale(0) - 0.06) < 1e-9)
  for (const l of [-1, 0, 0.5, 1, 2]) {
    const k = blinkScale(l)
    assert.ok(k >= 0.06 && k <= 1, `blinkScale(${l}) = ${k} out of range`)
  }
})

test('the blink schedule is deterministic and mostly open', () => {
  let closed = 0
  const N = 4000
  for (let i = 0; i < N; i++) if (blinkLid(i * 0.02) < 0.9) closed++
  const frac = closed / N
  // ~0.18s of blink every ~1.9-4.6s => a few percent of the time
  assert.ok(frac > 0.005 && frac < 0.12, `eyes shut ${(frac * 100).toFixed(1)}% of the time`)
  assert.equal(blinkLid(0.5), 1, 'first blink is scheduled at 1.4s, not before')
})
