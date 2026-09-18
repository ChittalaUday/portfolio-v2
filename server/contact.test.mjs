/**
 * The checks that matter on this path: what gets rejected at the trust
 * boundary, that a good request survives a round trip, and that the rate
 * window actually closes. Run with `npm test`.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allow, LIMITS, openDb, RATE, save, validate } from './contact.mjs'

const good = { name: 'Uday', email: 'a@b.co', message: 'hello' }

test('validate accepts a real request and trims it', () => {
  const { value, error } = validate({ ...good, name: '  Uday  ' })
  assert.equal(error, undefined)
  assert.equal(value.name, 'Uday')
})

test('validate rejects what it should', () => {
  for (const [label, body] of [
    ['missing name', { ...good, name: undefined }],
    ['blank message', { ...good, message: '   ' }],
    ['non-string', { ...good, email: 42 }],
    ['bad address', { ...good, email: 'uday at gmail' }],
    ['over length', { ...good, message: 'x'.repeat(LIMITS.message + 1) }],
    ['honeypot filled', { ...good, website: 'http://spam' }],
    ['not an object', 'name=uday'],
    ['array', []],
  ]) {
    assert.ok(validate(body).error, `${label} should be rejected`)
  }
})

test('save round-trips into sqlite', () => {
  const db = openDb(':memory:')
  const id = save(db, good, { ip: '1.2.3.4' })
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id)
  assert.equal(row.email, good.email)
  assert.equal(row.ip, '1.2.3.4')
  assert.equal(row.notified, 0)
  assert.ok(row.created_at)
})

test('rate limit closes after RATE.max and reopens after the window', () => {
  const store = new Map()
  const t0 = 1_000_000
  for (let i = 0; i < RATE.max; i++) {
    assert.ok(allow('ip', t0 + i, store), `request ${i + 1} should pass`)
  }
  assert.equal(allow('ip', t0 + RATE.max, store), false)
  assert.ok(allow('ip', t0 + RATE.windowMs + 1, store), 'window should reopen')
  assert.ok(allow('other', t0, store), 'a different ip has its own window')
})
