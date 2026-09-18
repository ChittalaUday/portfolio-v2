import { useEffect, useMemo, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { usePointer } from '@/hooks/usePointer'
import { ME } from '@/lib/content'
import { axisStyle, WDTH, WGHT } from '@/lib/ripple'
import { REVEAL_AT } from '@/lib/reveal'
import { BloubFace } from '@/components/BloubFace'

function useClock() {
  const el = useRef<HTMLTimeElement>(null)
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: ME.tz,
      hour12: false,
    })
    const tick = () => {
      if (el.current) el.current.textContent = fmt.format(new Date())
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return el
}

/**
 * Two-axis pointer ripple. Each character interpolates its own weight AND
 * width by distance from the cursor, so the line compresses and swells
 * rather than merely darkening. Requires a font with both axes — this is
 * the reason Bricolage Grotesque was chosen over Inter.
 */
function useRipple(reduced: boolean | null) {
  const pointer = usePointer()
  const chars = useRef<(HTMLSpanElement | null)[]>([])
  const centres = useRef<{ x: number; y: number }[]>([])

  const measure = () => {
    centres.current = chars.current.map((c) => {
      if (!c) return { x: -9999, y: -9999 }
      const r = c.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
  }

  useEffect(() => {
    if (reduced) return

    // Touch / no fine pointer: play the ripple through once, then rest.
    if (!window.matchMedia('(pointer: fine)').matches) {
      measure()
      let i = 0
      const id = setInterval(() => {
        chars.current.forEach((c, n) => {
          if (!c) return
          c.style.fontVariationSettings = axisStyle(Math.abs(n - i), 4)
        })
        if (i++ > chars.current.length + 4) clearInterval(id)
      }, 45)
      return () => clearInterval(id)
    }

    if (!pointer) return
    measure()
    let frame = 0
    const tick = () => {
      const { x, y } = pointer.current
      for (let i = 0; i < chars.current.length; i++) {
        const c = chars.current[i]
        const p = centres.current[i]
        if (!c || !p) continue
        c.style.fontVariationSettings = axisStyle(Math.hypot(p.x - x, p.y - y))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    // the cached centres go stale twice over: the entrance animation moves
    // every character, and the webfont swapping in re-flows the line. Without
    // re-measuring, the ripple's hotspot sits off from the actual glyphs.
    // entrance now starts at REVEAL_AT and staggers across every character;
    // measure once it has actually come to rest
    const settleAt = (REVEAL_AT + chars.current.length * 0.018 + 0.7) * 1000
    const settled = setTimeout(measure, settleAt)
    document.fonts.ready.then(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settled)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [pointer, reduced])

  return chars
}

export function Hero() {
  const reduced = useReducedMotion()
  // every part of the hero waits for the curtain, so it arrives as one
  // composition rather than labels-and-face first, headline second
  const appear = {
    initial: reduced ? false : ({ opacity: 0 } as const),
    animate: { opacity: 1 },
    transition: { duration: 0.5, delay: REVEAL_AT, ease: [0.16, 1, 0.3, 1] as const },
  }
  const chars = useRipple(reduced)
  const clock = useClock()

  const lines = useMemo(() => [`${ME.name} —`, ME.role], [])
  let n = 0

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden px-[clamp(1.25rem,5vw,5rem)] pt-32 pb-8"
    >
      <motion.p {...appear} className="relative z-10 mono-label text-fg-muted">
        {ME.location} · {ME.status}
      </motion.p>

      <h1 id="hero-title" className="relative z-10 my-auto">
        {/* the ripple needs per-character spans, which destroys the reading
            order for assistive tech — so the real string is announced once */}
        <span className="sr-only">
          {ME.name} — {ME.role}
        </span>
        <span
          aria-hidden="true"
          className="block text-[clamp(2rem,7.6vw,8.5rem)] leading-[0.9] tracking-[-0.045em]"
        >
          {lines.map((line, li) => (
            <span key={li} className="block whitespace-nowrap">
              {Array.from(line).map((ch) => {
                const i = n++
                return (
                  <motion.span
                    key={i}
                    ref={(el: HTMLSpanElement | null) => {
                      chars.current[i] = el
                    }}
                    initial={reduced ? false : { y: '0.9em', opacity: 0, filter: 'blur(6px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 18,
                      delay: REVEAL_AT + i * 0.018,
                    }}
                    className="inline-block will-change-transform"
                    style={{
                      fontVariationSettings: `'wght' ${WGHT[0]}, 'wdth' ${WDTH[0]}`,
                    }}
                  >
                    {ch === ' ' ? ' ' : ch}
                  </motion.span>
                )
              })}
            </span>
          ))}
        </span>
      </h1>

      <motion.div {...appear} className="relative z-10 mono-label flex items-end justify-between text-fg-muted">
        <time ref={clock} dateTime="" className="tabular-nums">
          --:--:--
        </time>
        <a href="#about" className="transition-colors hover:text-signal">
          Scroll ↓
        </a>
      </motion.div>

      {/* The face is the exact inverse of the ground: paper fill on ink, with
          the eyes knocked out so the ink shows through them. It is a button —
          clicking or tapping morphs it to the next silhouette.

          `--bloub` drives both the size and the bleed, so the same proportion
          of the ball stays on screen at every viewport, including past the
          clamp's ceiling where a fixed vw offset would drift.

          Two placements, and the mobile one is NOT the desktop one nudged. Wide
          enough and it sits against the right edge with a quarter of it past
          the fold, absolutely placed, behind the headline. Narrow, there is no
          room beside the headline, so it becomes the last element of the column
          and bleeds off the bottom edge — which `overflow-hidden` crops. Laying
          it out rather than pinning it is what keeps a near-white ball from
          landing under the grey clock row, where neither would be readable. */}
      <motion.div
        {...appear}
        className="relative z-0 mt-6 -mb-[calc(var(--bloub)*0.45)] self-center [--bloub:clamp(180px,52vw,320px)] lg:absolute lg:top-1/2 lg:right-0 lg:m-0 lg:self-auto lg:[--bloub:clamp(360px,42vw,720px)] lg:[translate:0_-50%]"
      >
        <BloubFace className="size-[var(--bloub)] text-paper lg:relative lg:right-[calc(var(--bloub)*-0.25)]" />
      </motion.div>
    </section>
  )
}
