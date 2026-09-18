import { useState } from 'react'
import { Slug } from '@/components/SectionHead'
import { ME, SOCIALS } from '@/lib/content'

/** Same limits the server enforces. Mirrored, not shared, because the server
 *  runs on its own and must never trust these. */
const LIMITS = { name: 80, email: 160, message: 2000 }

type Status = 'idle' | 'sending' | 'sent' | 'error'

const field =
  'w-full border-b border-current/25 bg-transparent pb-2 text-base outline-none transition-colors placeholder:text-current/35 focus:border-current'

/**
 * The address stays the artwork — it is still the biggest thing in the
 * section and still a plain `mailto:`. The form is underneath it, for the
 * people who will not switch to a mail client, and it degrades to the same
 * `mailto:` the moment the API is unreachable. So the section works with no
 * backend at all; the backend only makes it convenient.
 */
export function Contact() {
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  const copy = async () => {
    await navigator.clipboard.writeText(ME.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
      if (!res.ok) throw new Error(String(res.status))
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative overflow-hidden bg-paper px-[clamp(1.25rem,5vw,5rem)] py-[clamp(6rem,14vh,12rem)] text-[oklch(0.145_0.008_62)]"
    >
      <Slug index="06" label="Contact — open to work" face="excite" className="mb-10" />

      <h2 id="contact-title" className="mb-16">
        <a
          href={`mailto:${ME.email}`}
          className="group type-condensed inline-block break-words text-[clamp(1.5rem,6.4vw,5rem)] leading-[0.95] tracking-[-0.035em] transition-transform duration-300 hover:-translate-y-1"
        >
          {ME.email}
          {/* the wipe was `signal`, which measures 1.38:1 on paper — near
              invisible. On this ground the rule is the ink itself. */}
          <span
            aria-hidden="true"
            className="mt-2 block h-px origin-left scale-x-0 bg-current transition-transform duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
          />
        </a>
      </h2>

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <form onSubmit={submit} className="lg:col-span-6">
          <p className="mono-label mb-8 opacity-60">Or leave it here — it reaches me either way</p>

          <div className="grid gap-7 sm:grid-cols-2">
            <label className="block">
              <span className="mono-label mb-3 block opacity-60">Name</span>
              <input name="name" required maxLength={LIMITS.name} className={field} />
            </label>
            <label className="block">
              <span className="mono-label mb-3 block opacity-60">Email</span>
              <input
                name="email"
                type="email"
                required
                maxLength={LIMITS.email}
                className={field}
              />
            </label>
          </div>

          <label className="mt-7 block">
            <span className="mono-label mb-3 block opacity-60">What do you need built</span>
            <textarea name="message" required rows={3} maxLength={LIMITS.message} className={`${field} resize-none`} />
          </label>

          {/* honeypot: a real person never sees it, a bot fills everything */}
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="mono-label border border-current/30 px-5 py-3 transition-colors hover:bg-[oklch(0.145_0.008_62)] hover:text-paper disabled:opacity-40"
            >
              {status === 'sending' ? 'Sending' : 'Send →'}
            </button>
            <p aria-live="polite" className="mono-label opacity-60">
              {status === 'sent' && 'Got it — I will reply within a day'}
              {status === 'error' && (
                <>
                  Did not send.{' '}
                  <a href={`mailto:${ME.email}`} className="underline">
                    Mail me instead ↗
                  </a>
                </>
              )}
            </p>
          </div>
        </form>

        <div className="lg:col-span-4 lg:col-start-9">
          <p className="mono-label mb-6 opacity-60">Elsewhere</p>
          <ul className="border-t border-current/15">
            <li className="border-b border-current/15">
              <button
                type="button"
                onClick={copy}
                className="mono-label flex w-full items-center justify-between py-4 text-left"
              >
                {copied ? 'Copied' : 'Copy address'}
                <span aria-hidden="true" className="font-mono">
                  {copied ? '✓' : '⧉'}
                </span>
              </button>
            </li>
            {SOCIALS.map((s) => (
              <li key={s.id} className="border-b border-current/15">
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mono-label flex items-center justify-between py-4"
                >
                  <span className="flex items-center gap-2.5">
                    {/* real brand marks from the sprite — a lucide
                        approximation of a logo is the generic tell */}
                    <svg aria-hidden="true" className="size-3.5 fill-current">
                      <use href={`/icons.svg#${s.id}`} />
                    </svg>
                    {s.label}
                  </span>
                  <span aria-hidden="true" className="font-mono">
                    ↗
                  </span>
                </a>
              </li>
            ))}
            <li className="mono-label flex items-center justify-between border-b border-current/15 py-4 opacity-60">
              Based in
              <span>{ME.location}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
