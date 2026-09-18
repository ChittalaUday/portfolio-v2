import { useEffect, useId, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { usePointer } from '@/hooks/usePointer'
import {
  blendExpression,
  blinkLid,
  clamp,
  easings,
  EXPRESSIONS,
  liveliness,
  lookGaze,
  renderEyes,
  TURN_TIME,
  type Expression,
} from '@/lib/bloub'
import { blendShape, randomCycle, SHAPE_MORPH, SHAPES, shapePath } from '@/lib/shape'
import { REVEAL_AT } from '@/lib/reveal'

/** Ball radius in the -125..125 user space. */
const R = 100

/**
 * Moods the face wanders through when nobody is pointing at it. `attentif`
 * first, because `randomCycle` holds slot 0 for its first period — so the face
 * arrives wearing the same expression it has always worn, then drifts.
 */
const MOODS: Expression[] = (
  ['attentif', 'curieux', 'heureux', 'surpris', 'mefiant', 'excite', 'confus'] as const
).map((id) => EXPRESSIONS[id]!)

/** Seconds a mood and a silhouette are held before the idle cycle moves on. */
const MOOD_HOLD = 5.2
const SHAPE_HOLD = 6.4
/**
 * Time constant of the watched/idle crossfade, seconds.
 *
 * A smoother rather than an anchored tween on purpose: the pointer can appear
 * and vanish mid-transition, and an exponential approach is continuous however
 * fast that happens, with no frozen-frame bookkeeping.
 */
const MOOD_TAU = 0.22
/** Distinct seeds, so the mood and the silhouette never change on the same beat. */
const MOOD_SEED = 0x5eed
const SHAPE_SEED = 0xb10b

/**
 * The big bloub, following the model in `lib/bloub.ts` and `lib/shape.ts`.
 *
 * Built the way upstream builds its own faces: a mask in which the body is
 * opaque and the eyes are knocked out, then one filled rect. The eyes are
 * therefore HOLES — whatever sits behind shows straight through them, so the
 * face is always the exact inverse of its ground.
 *
 * Two behaviours, and which one runs is decided by whether a hovering pointer
 * exists, never by a media query:
 *
 *  - **watched** (a mouse on the page): it holds `attentif` and tracks the
 *    cursor, as before.
 *  - **idle** (a touch screen, a keyboard arrival, a cursor that left): it
 *    wanders — gaze drift, blinking, and a random walk through the moods and,
 *    until someone picks one, through the silhouettes.
 *
 * Clicking or tapping morphs the body to the next shape and pins it. The
 * transition is upstream's: all profiles are sampled at the same angles, so it
 * is a linear interpolation of radii on an `easeOutQuint` over `SHAPE_MORPH`.
 */
export function BloubFace({
  className = '',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const pointer = usePointer()
  const reduced = useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  const body = useRef<SVGPathElement>(null)
  const eyes = useRef<(SVGPathElement | null)[]>([])
  const maskId = `bloub-${useId().replace(/:/g, '')}`

  /** Animation clock of the last frame, so the click handler can date itself. */
  const clock = useRef(0)
  /** 0 = fully watched, 1 = fully idle. */
  const mix = useRef(1)
  /** The click-driven silhouette: what it is leaving, what for, and when. */
  const pick = useRef({ from: SHAPES[0]!, to: SHAPES[0]!, at: -1e6, i: 0, pinned: false })
  /** The profile actually rendered last frame — a click blends away from this. */
  const drawn = useRef<number[]>(SHAPES[0]!)
  // reused so a morph allocates nothing at 60fps
  const bufs = useRef<[number[], number[], number[]]>([[], [], []])
  const redraw = useRef<(() => void) | null>(null)

  useEffect(() => {
    const morphed = (from: number[], to: number[], k: number, out: number[]) =>
      k >= 1 ? to : blendShape(from, to, easings.easeOutQuint(clamp(k)), out)

    const draw = (t: number, dt: number, hasPointer: boolean) => {
      const el = svg.current
      if (!el) return
      const box = el.getBoundingClientRect()
      if (!box.width) return
      clock.current = t

      let nx = 0
      let ny = 0
      if (hasPointer && pointer) {
        const p = pointer.current
        nx = clamp((p.x - (box.left + box.width / 2)) / Math.max(1, window.innerWidth / 2), -1, 1)
        ny = clamp((p.y - (box.top + box.height / 2)) / Math.max(1, window.innerHeight / 2), -1, 1)
      }

      // a first frame after a tab has been backgrounded carries a huge dt,
      // which would snap the crossfade; cap it at roughly three frames
      mix.current += ((hasPointer ? 0 : 1) - mix.current) * (1 - Math.exp(-Math.min(dt, 0.05) / MOOD_TAU))

      const tour = easings.easeOutQuint(clamp(t / TURN_TIME))
      const gaze = lookGaze(nx, ny, tour, hasPointer, t)
      const life = liveliness(t, hasPointer ? 0 : 1)
      const ox = life.driftX * R
      const oy = life.driftY * R

      /* ── silhouette ───────────────────────────────────────────────────── */
      const [bufPick, bufIdle, bufOut] = bufs.current
      let profile = morphed(pick.current.from, pick.current.to, (t - pick.current.at) / SHAPE_MORPH, bufPick)
      if (!pick.current.pinned && mix.current > 0.002) {
        const c = randomCycle(t, SHAPE_SEED, SHAPES.length, SHAPE_HOLD)
        const idle = morphed(SHAPES[c.from]!, SHAPES[c.to]!, c.k, bufIdle)
        profile = blendShape(profile, idle, mix.current, bufOut)
      }
      drawn.current = profile
      body.current?.setAttribute('d', shapePath(profile, R))
      // width is constant; only the height breathes, by half a percent
      body.current?.setAttribute(
        'transform',
        `translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(1 ${life.breath.toFixed(4)})`,
      )

      /* ── face ─────────────────────────────────────────────────────────── */
      let expr = MOODS[0]!
      if (mix.current > 0.002) {
        const c = randomCycle(t, MOOD_SEED, MOODS.length, MOOD_HOLD)
        const idle = c.from === c.to ? MOODS[c.to]! : blendExpression(MOODS[c.from]!, MOODS[c.to]!, easings.easeOutQuint(c.k))
        expr = mix.current >= 0.998 ? idle : blendExpression(expr, idle, mix.current)
      }

      // the eyes are pulled back pro rata of the real radius in their own
      // direction, or a non-circular body would let the mask crop them
      renderEyes(expr, gaze, R, blinkLid(t), profile, ox, oy).forEach((e, i) => {
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

    redraw.current = () => draw(clock.current, 0, pointer?.current.active ?? false)

    if (reduced) {
      // motion declined: draw the landed, pointer-less pose once and stop
      mix.current = 0
      draw(TURN_TIME, 1, false)
      return
    }

    const start = performance.now()
    let last = 0
    let frame = 0
    const tick = (now: number) => {
      // clamped at 0 so the entrance spin holds — eyes behind the ball —
      // until the load curtain has finished parting
      const t = Math.max(0, (now - start) / 1000 - REVEAL_AT)
      draw(t, t - last, pointer?.current.active ?? false)
      last = t
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pointer, reduced])

  /**
   * Next silhouette. The blend starts from the frame ACTUALLY on screen, not
   * from the shape we were nominally on: upstream's note on a change landing
   * inside a fade — otherwise chaining clicks jumps.
   */
  const nextShape = () => {
    const p = pick.current
    p.i = (p.i + 1) % SHAPES.length
    p.from = drawn.current.slice()
    p.to = SHAPES[p.i]!
    p.at = reduced ? -1e6 : clock.current
    p.pinned = true
    redraw.current?.()
  }

  return (
    <button
      type="button"
      onClick={nextShape}
      aria-label="Change the shape of the bloub"
      // excluded from TargetCursor: bracketing a 700px ball is not a pointer hint
      data-cursor-plain
      style={style}
      className={`block cursor-pointer rounded-full ${className}`}
    >
      <svg
        ref={svg}
        viewBox="-125 -125 250 250"
        aria-hidden="true"
        className="pointer-events-none size-full select-none"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-125" y="-125" width="250" height="250">
            {/* a radial profile, not a circle — see lib/shape.ts. The circle is
                simply profile 0, and the one the entrance spin is fitted to. */}
            <path ref={body} d={shapePath(SHAPES[0]!, R)} fill="#fff" />
            {[0, 1].map((i) => (
              <path
                key={i}
                ref={(el) => {
                  eyes.current[i] = el
                }}
                fill="#000"
              />
            ))}
          </mask>
        </defs>
        <rect x="-125" y="-125" width="250" height="250" fill="currentColor" mask={`url(#${maskId})`} />
      </svg>
    </button>
  )
}
