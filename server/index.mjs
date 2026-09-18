/**
 * The contact API. One route, no framework, no dependencies.
 *
 *   POST /api/contact  { name, email, message }  ->  { ok: true, id }
 *   GET  /api/health
 *
 * In dev, Vite proxies /api here (see vite.config.ts). In production put it
 * behind the same origin as the static site, so the browser call stays
 * same-origin and there is no CORS to configure.
 *
 * Env: CONTACT_DB, PORT, and for mail RESEND_API_KEY + CONTACT_TO +
 * CONTACT_FROM. Without the mail three, requests are still stored.
 */
import { createServer } from 'node:http'
import { allow, markNotified, notify, openDb, save, validate } from './contact.mjs'

// Try loading .env if available
try {
  process.loadEnvFile()
} catch {}
try {
  process.loadEnvFile(new URL('../.env', import.meta.url))
} catch {}
try {
  process.loadEnvFile(new URL('./.env', import.meta.url))
} catch {}

const PORT = Number(process.env.PORT ?? 8787)
/** The whole payload is capped at 2160 characters of content, so anything
 *  this size is not a contact request. */
const MAX_BODY = 8 * 1024

const db = openDb()

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { ok: true })
  }
  if (req.method !== 'POST' || url.pathname !== '/api/contact') {
    return send(res, 404, { error: 'not found' })
  }

  // behind a proxy the socket address is the proxy, so prefer the forwarded
  // address when one is set
  const ip = (req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket.remoteAddress ?? '').trim()
  if (!allow(ip)) return send(res, 429, { error: 'too many requests' })

  let body
  try {
    body = JSON.parse(await readBody(req))
  } catch {
    return send(res, 400, { error: 'invalid json' })
  }

  const { value, error } = validate(body)
  if (error) return send(res, 400, { error })

  const id = save(db, value, { ip, userAgent: req.headers['user-agent'] })
  // answer as soon as it is stored — the sender should not wait on a mail API
  send(res, 200, { ok: true, id })

  try {
    const { sent, reason } = await notify(value, id)
    if (sent) markNotified(db, id)
    else console.warn(`request #${id} stored, not mailed: ${reason}`)
  } catch (err) {
    console.warn(`request #${id} stored, mail threw:`, err.message)
  }
})

server.listen(PORT, () => console.log(`contact api on http://localhost:${PORT}`))
