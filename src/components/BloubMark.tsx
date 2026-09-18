import { useEffect, useId, useMemo, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { usePointer } from '@/hooks/usePointer'
import { blinkLid, EXPRESSIONS, followGaze, liveliness, renderEyes } from '@/lib/bloub'

/** Ball radius in the -125..125 user space. */
const R = 100

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
   * Per-instance clock offset. The blink schedule is deterministic and every
   * mark mounts at the same moment, so without this they all blink in unison —
   * which reads as one mechanism rather than several creatures. Derived from
   * the instance id, so it is stable across re-renders.
   */
  const phase = useMemo(() => {
    let h = 0
    for (const ch of maskId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    return (h % 4000) / 1000
  }, [maskId])
  const expr = EXPRESSIONS[expression] ?? EXPRESSIONS.attentif!

  useEffect(() => {
    const draw = (t: number, tracking: boolean) => {
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
      draw(0, false)
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      draw((now - start) / 1000, pointer?.current.active ?? false)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pointer, reduced, expr, phase])

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
