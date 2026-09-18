import { useEffect, useId, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { usePointer } from '@/hooks/usePointer'
import {
  ATTENTIF,
  blinkLid,
  blinkScale,
  capsulePath,
  clamp,
  easings,
  eyePoses,
  liveliness,
  lookGaze,
  TURN_TIME,
} from '@/lib/bloub'

/** Ball radius in the -125..125 user space. */
const R = 100
const EYE_D = capsulePath(ATTENTIF.w * R, ATTENTIF.h * R)
const r2 = (v: number) => Math.round(v * 100) / 100

/**
 * The big bloub, following the model in `lib/bloub.ts`.
 *
 * Built the way upstream builds its own faces: a mask in which the body is
 * opaque and the eyes are knocked out, then one filled rect. The eyes are
 * therefore HOLES — whatever sits behind shows straight through them, so the
 * face is always the exact inverse of its ground.
 *
 * The body is a true circle, which the entrance spin requires: on a
 * non-circular silhouette the eyes would follow the profile round and jitter.
 */
export function BloubFace({ className = '' }: { className?: string }) {
  const pointer = usePointer()
  const reduced = useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  const body = useRef<SVGCircleElement>(null)
  const eyes = useRef<(SVGPathElement | null)[]>([])
  const maskId = `bloub-${useId().replace(/:/g, '')}`

  useEffect(() => {
    const draw = (t: number, hasPointer: boolean) => {
      const el = svg.current
      if (!el) return
      const box = el.getBoundingClientRect()
      if (!box.width) return

      let nx = 0
      let ny = 0
      if (hasPointer && pointer) {
        const p = pointer.current
        nx = clamp((p.x - (box.left + box.width / 2)) / Math.max(1, window.innerWidth / 2), -1, 1)
        ny = clamp((p.y - (box.top + box.height / 2)) / Math.max(1, window.innerHeight / 2), -1, 1)
      }

      const tour = easings.easeOutQuint(clamp(t / TURN_TIME))
      const gaze = lookGaze(nx, ny, tour, hasPointer, t)
      const life = liveliness(t, hasPointer ? 0 : 1)
      const lid = blinkLid(t)
      const k = blinkScale(lid)
      const ox = life.driftX * R
      const oy = life.driftY * R

      // width is constant; only the height breathes, by half a percent
      body.current?.setAttribute('transform', `translate(${r2(ox)} ${r2(oy)}) scale(1 ${r2(life.breath)})`)

      eyePoses(gaze, R, ATTENTIF.split).forEach((e, i) => {
        const path = eyes.current[i]
        if (!path) return
        if (e.depth <= 0.02) {
          path.setAttribute('opacity', '0')
          return
        }
        // the blink applies AFTER the tangent frame: a vertical squash on
        // screen, not a shrink along the capsule's tilted axis
        path.setAttribute(
          'transform',
          `matrix(${r2(e.a)},${r2(e.b * k)},${r2(e.c)},${r2(e.d * k)},${r2(e.x + ox)},${r2(e.y + oy)})`,
        )
        path.setAttribute('opacity', String(r2(clamp(e.depth / 0.12))))
      })
    }

    if (reduced) {
      // motion declined: draw the landed, pointer-less pose once and stop
      draw(TURN_TIME, false)
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
  }, [pointer, reduced])

  return (
    <svg
      ref={svg}
      viewBox="-125 -125 250 250"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-125" y="-125" width="250" height="250">
          {/* a perfect circle — measured radial deviation under 0.7% */}
          <circle ref={body} cx="0" cy="0" r={R} fill="#fff" />
          {[0, 1].map((i) => (
            <path
              key={i}
              ref={(el) => {
                eyes.current[i] = el
              }}
              d={EYE_D}
              fill="#000"
            />
          ))}
        </mask>
      </defs>
      <rect x="-125" y="-125" width="250" height="250" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}
