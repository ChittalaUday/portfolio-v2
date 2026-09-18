import { useEffect, useId, useMemo, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { usePointer } from '@/hooks/usePointer'
import {
  blendExpression,
  blinkLid,
  easings,
  EXPRESSION_IDS,
  EXPRESSIONS,
  followGaze,
  liveliness,
  renderEyes,
} from '@/lib/bloub'
import { randomCycle } from '@/lib/shape'

/** Ball radius in the -125..125 user space. */
const R = 100

/** Seconds an expression is held before the idle wander moves on. */
const MOOD_HOLD = 4.4
/** Time constant of the held/wandering crossfade, seconds. */
const MOOD_TAU = 0.22

/**
 * A small blob mark that looks AT the pointer, wherever it sits on the page.
 *
 * Separate from `BloubFace` on purpose. That one holds a fixed -26deg turn
 * toward the page content and only wobbles ±16deg around it, which is right for
 * a face pinned to the right edge of the hero and wrong for a mark in the
 * middle of a column: it would keep looking left even with the cursor on its
 * right. This one derives yaw and pitch from the actual offset to the pointer,
 * so it points the correct way from any position.
 *
 * Body and eye geometry are the same measured sphere model — `renderEyes` is
 * shared — and each mark can carry a different expression.
 *
 * With no pointer to look at — a touch screen, a keyboard arrival, a cursor
 * that has left the window — it stops holding its one expression and wanders
 * through the catalogue instead, on its own random schedule. Its declared
 * expression stays slot 0, so it arrives as itself and only then drifts.
 */
export function BloubMark({
  expression = 'attentif',
  className = '',
  style,
}: {
  expression?: keyof typeof EXPRESSIONS
  className?: string
  style?: React.CSSProperties
}) {
  const pointer = usePointer()
  const reduced = useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  const body = useRef<SVGCircleElement>(null)
  const eyes = useRef<(SVGPathElement | null)[]>([])
  const maskId = `mark-${useId().replace(/:/g, '')}`
  /**
   * Per-instance entropy. The blink schedule and the idle wander are both
   * deterministic and every mark mounts at the same moment, so without this
   * they all blink and change mood in unison — which reads as one mechanism
   * rather than several creatures. Derived from the instance id, so it is
   * stable across re-renders.
   */
  const seed = useMemo(() => {
    let h = 0
    for (const ch of maskId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    return h
  }, [maskId])
  /** The same entropy as a clock offset, in seconds. */
  const phase = (seed % 4000) / 1000
  const base = EXPRESSIONS[expression] ?? EXPRESSIONS.attentif!
  /** Declared expression first, then the rest of the catalogue to wander into. */
  const moods = useMemo(
    () => [base, ...EXPRESSION_IDS.filter((id) => id !== expression).map((id) => EXPRESSIONS[id]!)],
    [base, expression],
  )
  /** 0 = holding the declared expression, 1 = fully wandering. */
  const mix = useRef(0)

  useEffect(() => {
    const draw = (t: number, dt: number, tracking: boolean) => {
      const el = svg.current
      if (!el) return
      const box = el.getBoundingClientRect()
      if (!box.width) return

      let dx = 0
      let dy = 0
      if (tracking && pointer) {
        const p = pointer.current
        dx = p.x - (box.left + box.width / 2)
        dy = p.y - (box.top + box.height / 2)
      }

      const life = liveliness(t + phase, tracking ? 0 : 1)

      // an exponential approach rather than an anchored tween: the pointer can
      // come and go mid-change, and this is continuous however fast it does
      mix.current += ((tracking ? 0 : 1) - mix.current) * (1 - Math.exp(-Math.min(dt, 0.05) / MOOD_TAU))
      let expr = base
      if (mix.current > 0.002) {
        const c = randomCycle(t + phase, seed, moods.length, MOOD_HOLD)
        const wander =
          c.from === c.to
            ? moods[c.to]!
            : blendExpression(moods[c.from]!, moods[c.to]!, easings.easeOutQuint(c.k))
        expr = mix.current >= 0.998 ? wander : blendExpression(base, wander, mix.current)
      }

      const gaze = followGaze(dx, dy, expr.roll + life.dRoll)
      if (!tracking) {
        gaze.yaw += life.dYaw
        gaze.pitch += life.dPitch
      }

      body.current?.setAttribute('transform', `scale(1 ${life.breath.toFixed(4)})`)

      renderEyes(expr, gaze, R, blinkLid(t + phase)).forEach((e, i) => {
        const path = eyes.current[i]
        if (!path) return
        if (!e) {
          path.setAttribute('opacity', '0')
          return
        }
        path.setAttribute('d', e.d)
        path.setAttribute('transform', e.matrix)
        path.setAttribute('opacity', String(e.opacity))
      })
    }

    if (reduced) {
      // motion declined: one still frame, looking straight out
      draw(0, 1, false)
      return
    }
    const start = performance.now()
    let last = 0
    let frame = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      draw(t, t - last, pointer?.current.active ?? false)
      last = t
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pointer, reduced, base, moods, phase, seed])

  return (
    <svg
      ref={svg}
      viewBox="-125 -125 250 250"
      aria-hidden="true"
      style={style}
      className={`pointer-events-none shrink-0 select-none ${className}`}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-125" y="-125" width="250" height="250">
          <circle ref={body} cx="0" cy="0" r={R} fill="#fff" />
          {[0, 1].map((i) => (
            <path
              key={i}
              ref={(el) => {
                eyes.current[i] = el
              }}
              data-eye={i}
              fill="#000"
            />
          ))}
        </mask>
      </defs>
      {/* fills with currentColor, so it comes out ink on paper sections and
          near-white on ink ones without being told which */}
      <rect x="-125" y="-125" width="250" height="250" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}
