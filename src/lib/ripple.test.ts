// node --test src/lib/ripple.test.ts
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { axes, falloff, FALLOFF, WDTH, WGHT } from './ripple.ts'

test('falloff is clamped to 0..1', () => {
  assert.equal(falloff(0), 1)
  assert.equal(falloff(FALLOFF), 0)
  assert.equal(falloff(FALLOFF * 5), 0, 'beyond the radius must not go negative')
  assert.equal(falloff(-20), 1, 'a negative distance must not exceed full strength')
})

test('falloff is monotonic decreasing', () => {
  let prev = Infinity
  for (let d = 0; d <= FALLOFF; d += 10) {
    const v = falloff(d)
    assert.ok(v <= prev, `not monotonic at ${d}: ${v} > ${prev}`)
    prev = v
  }
})

test('both axes stay inside the font ranges', () => {
  // out-of-range values are silently clamped by the font, so a bug here is
  // invisible rather than loud — worth asserting
  for (let d = -50; d <= FALLOFF * 2; d += 7) {
    const { wght, wdth } = axes(d)
    assert.ok(wght >= WGHT[0] && wght <= WGHT[1], `wght ${wght} out of range at ${d}`)
    assert.ok(wdth <= WDTH[0] && wdth >= WDTH[1], `wdth ${wdth} out of range at ${d}`)
  }
})

test('the axes move in opposite directions — heavy means narrow', () => {
  const near = axes(0)
  const far = axes(FALLOFF)
  assert.ok(near.wght > far.wght, 'cursor should be heavier')
  assert.ok(near.wdth < far.wdth, 'cursor should be narrower')
})
