import { useEffect, useMemo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { usePointer } from '@/hooks/usePointer'
import { ME } from '@/lib/content'
import { axisStyle, FALLOFF, WDTH, WGHT } from '@/lib/ripple'
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
    if (reduced || !pointer) return
    measure()

    /**
     * How far the ripple has receded, 0 at the cursor's position and 1 at rest.
     *
     * A mouse is always at 0 — it is on the page, so the line is always live
     * under it. A finger is only a cursor while it is held: it eases to 0 on
     * touch-down and back to 1 on release, so the letters swell under the
     * finger and settle when it leaves rather than freezing mid-compression.
     * This is what the one-shot playthrough used to stand in for, and it is
     * the same effect a desktop gets rather than a consolation prize.
     */
    let rest = 1
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const p = pointer.current
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const target = p.active || p.down ? 0 : 1
      rest += (target - rest) * (1 - Math.exp(-dt / 0.22))
      for (let i = 0; i < chars.current.length; i++) {
        const c = chars.current[i]
        const q = centres.current[i]
        if (!c || !q) continue
        // receding is a growing distance, not a fading opacity — the axes are
        // the only thing that may move here
        c.style.fontVariationSettings = axisStyle(
          Math.hypot(q.x - p.x, q.y - p.y) + rest * FALLOFF,
        )
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
    // no scroll re-measure any more: the hero is sticky, so it does not move
    // with the page — and once it starts receding its rect is a transformed
    // one, which would drag the ripple's hotspot off the glyphs
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settled)
      window.removeEventListener('resize', measure)
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

  /**
   * The hero is pinned and About scrolls over it, so it has somewhere to go:
   * it tips back and shrinks into depth over one viewport of scroll while the
   * paper section rises across it.
   *
   * Driven off raw `scrollY` rather than a measured target — the hero is the
   * first thing on the page, so its exit IS the first viewport, and `useScroll`
   * with a target would read the STUCK rect and freeze the progress at zero.
   *
   * `transformPerspective` rather than a `perspective` ancestor: an ancestor
   * with perspective becomes the containing block for every fixed descendant,
   * which would tear the cursor reticle and the project preview off the
   * viewport. The functional form has no such effect.
   */
  const { scrollY } = useScroll()
  const exit = useTransform(scrollY, (y) => Math.min(y / Math.max(1, window.innerHeight), 1))
  const recede = {
    transformPerspective: 1400,
    rotateX: useTransform(exit, [0, 1], [0, 12]),
    y: useTransform(exit, [0, 1], [0, -70]),
    opacity: useTransform(exit, [0, 0.82], [1, 0]),
  }
  // deliberately no `scale`. The section clips its own overflow — that is what
  // crops the face's bleed — and the clip is applied BEFORE the transform, so
  // shrinking the box drags its right-hand clip edge inside the viewport and
  // slices a hard vertical line through the face. Pitch and perspective carry
  // the depth on their own; the scale only bought an artefact.

  const lines = useMemo(() => [`${ME.name} —`, ME.role], [])
  let n = 0

  return (
    <motion.section
      id="hero"
      aria-labelledby="hero-title"
      style={reduced ? undefined : { ...recede, transformOrigin: '50% 30%' }}
      /* Pinned only where there is room to pin. A sticky box taller than the
         viewport holds its TOP at zero and hides its own bottom for good, so
         on a landscape phone — where the clock row would not fit inside 100svh
         — the hero stays an ordinary section that grows and scrolls away.
         Above that, `h` and not `min-h`, so the box is exactly one viewport. */
      className="relative z-0 flex min-h-[100svh] flex-col justify-between overflow-hidden px-[clamp(1.25rem,5vw,5rem)] pt-32 pb-8 [@media(min-height:520px)]:sticky [@media(min-height:520px)]:top-0 [@media(min-height:520px)]:h-[100svh]"
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
    </motion.section>
  )
}
