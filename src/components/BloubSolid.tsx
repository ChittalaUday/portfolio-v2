import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { clamp, easings } from '@/lib/bloub'
import { blendShape, SHAPE_MORPH, SHAPES, shapePath } from '@/lib/shape'

/**
 * The bloub as a solid — the same radial profile from `lib/shape.ts`, sliced
 * into contours and stacked along Z.
 *
 * Deliberately NOT a rendered blob. DESIGN.md §1 rejects "floating 3D blobs",
 * and it is right to: a lit, glossy ball is the templated tell. This is the
 * other reading of depth — a contour model, the way a solid is drawn on a
 * spec sheet. Every layer is an outline of the SAME silhouette the hero wears,
 * so the volume is made of the design system's own geometry rather than
 * imported from a renderer.
 *
 * Which means there is no library here and no WebGL: fifteen SVG outlines in
 * one `preserve-3d` box. The browser sorts them by depth and does the
 * projection, which is the whole of the 3D.
 *
 * Interaction is the same on both pointers, which is the point — `touch-action:
 * pan-y` hands vertical movement back to the page and keeps horizontal, so a
 * finger drags the solid round and a scroll still scrolls. Nothing here is
 * hover-only.
 */

/** Contours cut through the solid. Odd, so one lands on the equator. */
const LAYERS = 15
/** Half-thickness, in the -125..125 user space the profiles are drawn in. */
const DEPTH = 90
/** Equator radius, same space. */
const R = 108
/**
 * How blunt the solid is along Z. `0.5` is an exact ellipsoid, which tapers to
 * a point and reads as a rugby ball stood on end. Lower fattens the poles, so
 * the near contour is a real face and the stack reads as turned from a block.
 */
const PLUMP = 0.32
/** Degrees per second the solid turns when nobody is touching it. */
const IDLE_SPIN = 13
/** Degrees of yaw per pixel dragged. */
const DRAG = 0.42
/**
 * Pitch, in degrees.
 *
 * `BASE` is the reason there is a base at all: a stack of contours viewed dead
 * square along its own axis is a bullseye — every layer concentric, no offset,
 * no depth. Held off that axis it is a solid seen from slightly above, and the
 * yaw turning underneath is then legible as a turn. `TILT` is what the scroll
 * adds on top, and it is small enough never to bring the pitch back to zero.
 */
const PITCH_BASE = -17
const TILT = 10
/** Seconds for a fling to decay back to the idle turn. */
const FLING_TAU = 0.9
/** Pixels of travel that separates a drag from a tap. */
const SLOP = 6

/**
 * Depth and radius scale of each contour. Insetting by half a step keeps the
 * outermost slices off the poles, where the scale would be zero and the path
 * would collapse to nothing.
 */
const SLICES = Array.from({ length: LAYERS }, (_, i) => {
  const u = ((i + 0.5) / LAYERS) * 2 - 1
  return { u, k: (1 - u * u) ** PLUMP }
})

export function BloubSolid({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const paths = useRef<(SVGPathElement | null)[]>([])

  /** The silhouette it is leaving, what for, and when — as in `BloubFace`. */
  const pick = useRef({ from: SHAPES[0]!, to: SHAPES[0]!, at: -1e6, i: 0 })
  /** The profile actually on screen, so a tap mid-morph blends from the frame
   *  being shown rather than jumping back to the shape we were nominally on. */
  const drawn = useRef<number[]>(SHAPES[0]!)
  const buf = useRef<number[]>([])
  const spin = useRef({ yaw: -24, vel: IDLE_SPIN, dragging: false, lastX: 0, moved: 0, fling: 0 })
  /** Repainting fifteen outlines is only worth doing while a morph is running. */
  const dirty = useRef(true)
  const clock = useRef(0)

  const paint = (profile: number[]) => {
    for (let i = 0; i < LAYERS; i++) {
      paths.current[i]?.setAttribute('d', shapePath(profile, R * SLICES[i]!.k))
    }
  }

  useEffect(() => {
    paint(drawn.current)
    if (reduced) {
      // motion declined: one posed frame, no clock. Tapping still works — it
      // lands the next silhouette instantly rather than morphing to it.
      if (body.current) body.current.style.transform = `rotateX(${PITCH_BASE}deg) rotateY(-32deg)`
      return
    }

    // the footer sits below every other section, so without this the solid
    // would run a fifteen-layer 3D rotation for the whole page while nobody
    // is looking at it
    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? false
    })
    if (stage.current) io.observe(stage.current)

    const start = performance.now()
    let last = 0
    let frame = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const t = (now - start) / 1000
      // a tab returning from the background carries a huge dt, which would
      // fling the solid round several turns in one frame
      const dt = Math.min(t - last, 0.05)
      last = t
      clock.current = t
      if (!visible || !body.current) return

      const k = (t - pick.current.at) / SHAPE_MORPH
      if (dirty.current) {
        drawn.current =
          k >= 1
            ? pick.current.to
            : blendShape(pick.current.from, pick.current.to, easings.easeOutQuint(clamp(k)), buf.current)
        paint(drawn.current)
        dirty.current = k < 1
      }

      const s = spin.current
      if (!s.dragging) {
        s.vel += (IDLE_SPIN - s.vel) * (1 - Math.exp(-dt / FLING_TAU))
        s.yaw += s.vel * dt
      }

      // pitch is read from where the solid sits in the viewport, so scrolling
      // past it turns it over — the scroll is the second axis, and the one a
      // touch drag deliberately does not steal
      const box = stage.current!.getBoundingClientRect()
      const centre = (box.top + box.height / 2) / Math.max(1, window.innerHeight)
      const pitch = PITCH_BASE + clamp(0.5 - centre, -0.5, 0.5) * 2 * TILT
      body.current.style.transform = `rotateX(${pitch.toFixed(2)}deg) rotateY(${s.yaw.toFixed(2)}deg)`
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
    }
  }, [reduced])

  const nextShape = () => {
    const p = pick.current
    p.i = (p.i + 1) % SHAPES.length
    p.from = drawn.current.slice()
    p.to = SHAPES[p.i]!
    p.at = reduced ? -1e6 : clock.current
    dirty.current = true
    if (reduced) paint(p.to)
  }

  const down = (e: React.PointerEvent) => {
    const s = spin.current
    s.dragging = true
    s.lastX = e.clientX
    s.moved = 0
    s.fling = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const move = (e: React.PointerEvent) => {
    const s = spin.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    s.lastX = e.clientX
    s.moved += Math.abs(dx)
    s.yaw += dx * DRAG
    s.fling = dx * DRAG
  }

  const up = (e: React.PointerEvent) => {
    const s = spin.current
    if (!s.dragging) return
    s.dragging = false
    e.currentTarget.releasePointerCapture(e.pointerId)
    // a drag ends in a fling; a press that never travelled is a tap, and a tap
    // is the shape change the hero's face already answers to
    if (s.moved < SLOP) nextShape()
    else s.vel = clamp(s.fling * 60, -900, 900)
  }

  return (
    <div
      ref={stage}
      // `pan-y` and not `none`: the page still scrolls under a finger that
      // moves down the screen, and only sideways travel turns the solid
      className={`relative touch-pan-y select-none [--solid:clamp(230px,52vw,400px)] ${className}`}
      style={{ width: 'var(--solid)', height: 'var(--solid)', perspective: 'calc(var(--solid) * 2.2)' }}
      onPointerDown={reduced ? undefined : down}
      onPointerMove={reduced ? undefined : move}
      onPointerUp={reduced ? undefined : up}
      onPointerCancel={reduced ? undefined : up}
    >
      {/* a button so the tap has a name and a keyboard route; the drag is the
          enhancement on top of it, not the only way in */}
      <button
        type="button"
        onClick={reduced ? nextShape : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') nextShape()
        }}
        aria-label="Change the shape of the solid"
        data-cursor-plain
        className="absolute inset-0 z-10 cursor-grab rounded-full active:cursor-grabbing"
      />
      <div
        ref={body}
        className="size-full will-change-transform"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {SLICES.map((s, i) => (
          <svg
            key={i}
            viewBox="-125 -125 250 250"
            aria-hidden="true"
            className="absolute inset-0 size-full"
            style={{ transform: `translateZ(calc(var(--solid) * ${((s.u * DEPTH) / 250).toFixed(4)}))` }}
          >
            <path
              ref={(el) => {
                paths.current[i] = el
              }}
              /* filled with the ground, so a near contour occludes the ones
                 behind it and the stack reads as a solid rather than a wire
                 ball. The rims are the drawing. */
              fill="var(--ink)"
              stroke={i === LAYERS - 1 ? 'var(--signal)' : 'currentColor'}
              strokeWidth={i === LAYERS - 1 ? 2.6 : 2}
              strokeOpacity={i === LAYERS - 1 ? 0.95 : 0.2 + (1 - Math.abs(s.u)) * 0.55}
            />
          </svg>
        ))}
      </div>
    </div>
  )
}
