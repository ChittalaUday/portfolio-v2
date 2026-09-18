import { useState } from 'react'
import { Slug } from '@/components/SectionHead'
import { ME, SOCIALS } from '@/lib/content'

/**
 * No form. A form needs a backend, validation, spam handling and an error
 * state to achieve exactly what a mailto: achieves. The address is the
 * artwork.
 */
export function Contact() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(ME.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="border-t border-rule px-[clamp(1.25rem,5vw,5rem)] py-[clamp(6rem,14vh,12rem)]"
    >
      <Slug index="05" label={`Contact — currently taking work`} className="mb-10 text-fg-muted" />

      <h2 id="contact-title" className="mb-12">
        <a
          href={`mailto:${ME.email}`}
          className="group type-condensed inline-block break-words text-[clamp(1.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.035em] transition-transform duration-300 hover:-translate-y-1"
        >
          {ME.email}
          <span
            aria-hidden="true"
            className="mt-2 block h-px origin-left scale-x-0 bg-signal transition-transform duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
          />
        </a>
      </h2>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <button type="button" onClick={copy} className="mono-label text-fg-muted hover:text-signal">
          {copied ? 'Copied' : 'Copy address'}
        </button>
        {SOCIALS.map((s) => (
          <a
            key={s.id}
            href={s.href}
            className="mono-label flex items-center gap-2 text-fg-muted transition-colors hover:text-signal"
          >
            {/* real brand marks from the sprite already in the repo — a lucide
                approximation of a logo is the generic tell */}
            <svg aria-hidden="true" className="size-3.5 fill-current">
              <use href={`/icons.svg#${s.id}`} />
            </svg>
            {s.label} ↗
          </a>
        ))}
      </div>
    </section>
  )
}
