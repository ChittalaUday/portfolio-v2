/**
 * Contact requests: validate, store, notify.
 *
 * SQLite is the source of truth — a request is never lost because a mail
 * provider was down or unconfigured. Notification is best-effort on top.
 *
 * No dependencies: `node:sqlite` ships with Node 22.5+, and the mail goes out
 * over `fetch`. Nothing here needs a build step.
 */
import { DatabaseSync } from 'node:sqlite'

/** Trust boundary. The browser mirrors these; the server does not trust it. */
export const LIMITS = { name: 80, email: 160, message: 2000 }
export const RATE = { max: 5, windowMs: 10 * 60_000 }

/** Deliberately loose — the only real test of an address is sending to it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** @returns {{value: {name:string,email:string,message:string}} | {error: string}} */
export function validate(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { error: 'expected a JSON object' }
  }
  // honeypot: the field is off-screen and aria-hidden, so anything that fills
  // it filled every input it could find
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { error: 'rejected' }
  }
  const value = {}
  for (const [key, max] of Object.entries(LIMITS)) {
    const raw = body[key]
    if (typeof raw !== 'string') return { error: `${key} is required` }
    const trimmed = raw.trim()
    if (!trimmed) return { error: `${key} is required` }
    if (trimmed.length > max) return { error: `${key} is over ${max} characters` }
    value[key] = trimmed
  }
  if (!EMAIL.test(value.email)) return { error: 'email does not look like an address' }
  return { value }
}

export function openDb(file = process.env.CONTACT_DB ?? 'contact.db') {
  const db = new DatabaseSync(file)
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      message    TEXT NOT NULL,
      ip         TEXT,
      user_agent TEXT,
      notified   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  return db
}

export function save(db, value, meta = {}) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO requests (name, email, message, ip, user_agent) VALUES (?, ?, ?, ?, ?)')
    .run(value.name, value.email, value.message, meta.ip ?? null, meta.userAgent ?? null)
  return Number(lastInsertRowid)
}

export function markNotified(db, id) {
  db.prepare('UPDATE requests SET notified = 1 WHERE id = ?').run(id)
}

/**
 * Sliding window per IP. In-process, so it resets on restart and does not
 * span instances.
 *
 * ponytail: one process, one Map. If this ever runs on more than one box,
 * move the window into the same SQLite file rather than adding Redis.
 */
const hits = new Map()
export function allow(ip, now = Date.now(), store = hits) {
  const fresh = (store.get(ip) ?? []).filter((t) => now - t < RATE.windowMs)
  store.set(ip, fresh)
  if (fresh.length >= RATE.max) return false
  fresh.push(now)
  return true
}

/**
 * Best-effort mail, over Resend's HTTP API so there is no SMTP client to
 * install. Unconfigured is not an error: the request is already stored.
 */
export async function notify(value, id) {
  const key = (process.env.RESEND_API_KEY || process.env.RESEND_TOKEN || '').trim()
  const to = (process.env.CONTACT_TO || 'chitalauday@gmail.com').trim()
  const from = (process.env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>').trim()
  if (!key || !to || !from) return { sent: false, reason: 'mail not configured' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      reply_to: value.email,
      subject: `Portfolio — ${value.name}`,
      text: `${value.name} <${value.email}>\nrequest #${id}\n\n${value.message}`,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { sent: false, reason: `resend ${res.status}: ${detail}` }
  }
  return { sent: true, reason: 'sent' }
}
