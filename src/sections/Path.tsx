import { useRef } from 'react'
import { motion, useReducedMotion, useScroll } from 'motion/react'
import { Slug } from '@/components/SectionHead'
import { PATH, type Stop } from '@/lib/content'

/**
 * The rail marker. A filled square for a job, a hollow one for the degree —
 * the same square that opens each band in Work, so the two sections read as
 * one vocabulary. The ring is the ground colour, not decoration: it punches
 * the rail out from behind the marker.
 */
function Marker({ stop }: { stop: Stop }) {
  return (
    <span aria-hidden="true" className="absolute top-[0.45rem] left-0 size-3.5">
      {stop.current && (
        /* the one still running. `animate-ping` is a CSS animation, so the
           global reduced-motion reset already switches it off. */
        <span className="absolute inset-0 animate-ping bg-signal/50" />
      )}
      <span
        className={`absolute inset-0 ring-4 ring-ink ${
          stop.kind === 'study'
            ? 'border-2 border-fg-muted bg-ink'
            : stop.current
              ? 'bg-signal'
              : 'bg-fg-muted'
        }`}
      />
    </span>
  )
}

/**
 * Where I have been, as a drawn rail rather than a list.
 *
 * Deliberately not the numbered run that Work uses: that one is a catalogue
 * of interchangeable things, and this is a sequence where the order carries
 * the meaning. The signal rail fills as the section scrolls, so the reading
 * position is also the position in time. Most recent first — the rail starts
 * at now and runs back.
 */
export function Path() {
  const rail = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: rail,
    offset: ['start 75%', 'end 65%'],
  })

  return (
    <section
      id="path"
      aria-labelledby="path-title"
      className="relative overflow-hidden border-t border-rule px-[clamp(1.25rem,5vw,5rem)] py-[clamp(6rem,14vh,12rem)]"
    >
      <Slug index="05" label="Path" face="attentif" className="mb-6 text-fg-muted" />
      <h2
        id="path-title"
        className="mb-16 max-w-[24ch] text-[clamp(2rem,5vw,4rem)] leading-[0.94] tracking-[-0.03em]"
      >
        Six years from diploma to full time
      </h2>

      <div ref={rail} className="relative">
        {/* 2px, not a hairline: at 1px the signal fill read as grey against
            the ink and the whole effect was invisible. `left` is half the
            width less than the markers' 7px centre line, so both rails sit
            centred under the markers. */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[0.375rem] w-[2px] bg-fg-faint/50"
        />
        {/* the same rail again in signal, scaled from the top as you read */}
        <motion.span
          aria-hidden="true"
          style={{ scaleY: reduced ? 1 : scrollYProgress }}
          className="absolute top-2 bottom-2 left-[0.375rem] w-[2px] origin-top bg-signal"
        />

        {/* One shared vanishing point for the whole run, so the stops read as
            cards standing in a single space rather than each tipping about its
            own axis. Safe on the `ol`: the markers are absolute inside their
            `relative` `li`, so this does not become their containing block. */}
        <ol style={reduced ? undefined : { perspective: '1100px' }}>
          {PATH.map((stop) => (
            <motion.li
              key={`${stop.period}-${stop.role}`}
              {...(reduced
                ? {}
                : {
                    // hinged at the top edge, so each stop swings up out of
                    // depth into the rail as the fill reaches it
                    initial: { opacity: 0, rotateX: -22, z: -90 },
                    whileInView: { opacity: 1, rotateX: 0, z: 0 },
                    viewport: { once: true, margin: '-12%' },
                    transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const },
                    style: { transformOrigin: '50% 0%' },
                  })}
              className="relative grid gap-y-3 pb-14 pl-10 last:pb-0 md:grid-cols-[13.5rem_1fr] md:gap-x-12 md:pl-16"
            >
              <Marker stop={stop} />
              <p className="mono-label pt-[0.35rem] text-fg-muted">
                {stop.period}
                {stop.current && <span className="ml-2 text-signal">·</span>}
              </p>
              <div>
                <h3 className="text-[clamp(1.25rem,2.6vw,2rem)] leading-[1.1] tracking-[-0.02em]">
                  {stop.role}
                </h3>
                <p className="mono-label mt-2.5">
                  {stop.href ? (
                    <a
                      href={stop.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-fg-muted transition-colors hover:text-signal"
                    >
                      {stop.org} ↗
                    </a>
                  ) : (
                    <span className="text-fg-muted">{stop.org}</span>
                  )}
                </p>
                <p className="mt-4 max-w-[52ch] text-sm leading-[1.6] text-fg-muted">{stop.note}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
