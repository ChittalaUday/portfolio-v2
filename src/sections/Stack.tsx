import { useState } from 'react'
import { Slug } from '@/components/SectionHead'
import { ALSO, STACK } from '@/lib/content'

/**
 * Technology names set as type, not a grid of logos. Twelve stroked
 * pictograms in a row is the most generic surface a portfolio has.
 * Counter-scrolling bands, paused on hover, with the real note revealed.
 */
export function Stack() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <section
      id="stack"
      aria-labelledby="stack-title"
      className="relative overflow-hidden border-t border-rule py-[clamp(6rem,14vh,12rem)]"
    >
      <div className="mb-16 px-[clamp(1.25rem,5vw,5rem)]">
        <Slug index="03" label="Stack" face="confus" className="mb-6 text-fg-muted" />
        <h2 id="stack-title" className="max-w-[24ch] text-[clamp(2rem,5vw,4rem)] leading-[0.94] tracking-[-0.03em]">
          What I actually reach for
        </h2>
      </div>

      <div className="flex flex-col">
        {STACK.map((band, bi) => (
          <div key={band.band} className="marquee border-t border-rule py-8">
            <p className="mono-label mb-5 px-[clamp(1.25rem,5vw,5rem)] text-fg-muted">
              {band.band}
            </p>
            <div className="overflow-hidden" aria-hidden="true">
              <div className="marquee-track" data-dir={bi % 2 ? 'right' : undefined}>
                {/* two identical halves so -50% is seamless; each half is
                    repeated enough to overfill the widest viewport */}
                {[0, 1].map((half) => (
                  <div key={half} className="flex shrink-0">
                    {[0, 1, 2, 3].map((rep) =>
                      band.items.map((it) => (
                        <span
                          key={`${it.name}-${rep}`}
                          onMouseEnter={() => setHovered(it.name)}
                          onMouseLeave={() => setHovered(null)}
                          className="type-condensed flex shrink-0 cursor-default items-baseline gap-6 pr-10 text-[clamp(2rem,4.5vw,3.5rem)] leading-none tracking-[-0.02em] transition-colors duration-200"
                          style={{ color: hovered === it.name ? 'var(--signal)' : undefined }}
                        >
                          {it.name}
                          <span className="text-signal/60">·</span>
                        </span>
                      )),
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* real information, not a progress bar claiming 87% */}
            <p className="mono-label mt-5 h-3 px-[clamp(1.25rem,5vw,5rem)] text-signal">
              {band.items.find((i) => i.name === hovered)?.note ?? ''}
            </p>
            {/* the marquee is decorative duplication; this is the readable list */}
            <ul className="sr-only">
              {band.items.map((it) => (
                <li key={it.name}>
                  {it.name} — {it.note}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* what I have practised, kept out of the marquee and said plainly —
          the marquee is for what I reach for without thinking */}
      <p className="mono-label mt-14 px-[clamp(1.25rem,5vw,5rem)] text-fg-muted">
        <span className="text-fg">{ALSO.label}</span>
        {' — '}
        {ALSO.items.join(' · ')}
      </p>
    </section>
  )
}
