import { motion, useReducedMotion } from 'motion/react'
import { Slug } from '@/components/SectionHead'
import { ABOUT } from '@/lib/content'

const baseRise = {
  initial: { y: 24, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  viewport: { once: true, margin: '-15%' },
  transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] as const },
}

export function About() {
  // a reveal that starts at opacity 0 is exactly the motion a reduced-motion
  // user declined — render the final state outright rather than waiting on
  // an intersection that may never come
  const reduced = useReducedMotion()
  const rise = reduced ? {} : baseRise

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="bg-paper px-[clamp(1.25rem,5vw,5rem)] py-[clamp(6rem,14vh,12rem)] text-[oklch(0.145_0.008_62)]"
    >
      <Slug index="02" label="About" className="mb-16 opacity-60" />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <motion.div {...rise} className="lg:col-span-5">
          {/* Portrait. Masked to the `galet` (pebble) outline from the bloub
              shape kit — swap the inner div for an <img> when the real shot
              exists; the clip stays. */}
          <div
            className="relative aspect-[4/5] w-full overflow-hidden bg-ink"
            style={{ clipPath: 'url(#clip-galet)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_15%,oklch(0.858_0.184_106/0.22),transparent_60%)]" />
            <p className="mono-label absolute bottom-6 left-0 w-full text-center text-fg-muted">
              Portrait
            </p>
          </div>
        </motion.div>

        <div className="lg:col-span-6 lg:col-start-7">
          <motion.h2
            {...rise}
            id="about-title"
            className="mb-8 text-[clamp(1.125rem,2vw,1.5rem)] leading-[1.4] tracking-[-0.01em]"
          >
            {ABOUT.lede}
          </motion.h2>

          <motion.p {...rise} className="mb-16 max-w-[46ch] text-base leading-[1.6] opacity-70">
            {ABOUT.body}
          </motion.p>

          <motion.dl {...rise} className="border-t border-current/15">
            {ABOUT.facts.map((f) => (
              <div
                key={f.k}
                className="flex items-baseline gap-3 border-b border-current/15 py-4"
              >
                <dt className="mono-label shrink-0 opacity-60">{f.k}</dt>
                <span
                  aria-hidden="true"
                  className="min-w-6 flex-1 translate-y-[-3px] border-b border-dotted border-current/30"
                />
                <dd className="shrink-0 text-sm">{f.v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  )
}
