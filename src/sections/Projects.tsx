import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Slug } from '@/components/SectionHead'
import { useFinePointer, usePointer } from '@/hooks/usePointer'
import { WORK, type Work } from '@/lib/content'

/** Section gutter, repeated so the rows can bleed past it and fill edge to
 *  edge on hover. */
const GUTTER = 'clamp(1.25rem,5vw,5rem)'

/** Duotone plate standing in for a real screenshot. Deterministic per
 *  item so it reads as art direction rather than a missing asset. */
function Plate({ item }: { item: Work }) {
  const hue = 106 + Number(item.index) * 14
  return (
    <div
      className="size-full"
      style={{
        background: `radial-gradient(130% 100% at 25% 10%, oklch(0.858 0.184 ${hue} / 0.55), oklch(0.196 0.008 62) 62%)`,
      }}
    />
  )
}

/** The viewport the framed site believes it has. Scaled down to the preview
 *  width, so a desktop layout arrives as a desktop layout rather than the
 *  mobile breakpoint of a 360px frame. */
const FRAME = { w: 1280, h: 800 }

/** One preview box for everything — a site frame, a phone screenshot and the
 *  fallback plate all land in the same 16:10. A still that is the wrong shape
 *  is covered and cropped rather than resizing the box under the cursor. */
const SIZE = { w: 360, h: 225 }

/**
 * What sits behind the cursor: the real site in a frame, or the app's own
 * store artwork. The plate stays underneath both so the box is never blank
 * while a third-party site loads, and never empty for the two items that
 * have nothing to show yet.
 *
 * ponytail: the frame remounts on every hover, so a site reloads each time.
 * Cache the mounted iframes if the reload flicker ever reads as a bug.
 */
function Preview({ item, w }: { item: Work; w: number }) {
  const [ready, setReady] = useState(false)
  const p = item.preview
  const fade = {
    opacity: ready ? 1 : 0,
    transition: 'opacity 260ms cubic-bezier(0.16,1,0.3,1)',
  } as const

  return (
    <div className="relative size-full bg-ink">
      <Plate item={item} />
      {p?.kind === 'shot' && (
        <img
          src={p.src}
          alt=""
          onLoad={() => setReady(true)}
          className="absolute inset-0 size-full object-cover object-top"
          style={fade}
        />
      )}
      {p?.kind === 'site' && (
        <iframe
          src={p.src}
          title=""
          aria-hidden="true"
          tabIndex={-1}
          loading="lazy"
          referrerPolicy="no-referrer"
          /* third-party origins, so `allow-same-origin` only lets each site be
             itself — it cannot reach this document across origins. Without
             `allow-scripts` the two SPAs among them render a blank page. */
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setReady(true)}
          className="absolute top-0 left-0 origin-top-left border-0"
          style={{ ...fade, width: FRAME.w, height: FRAME.h, transform: `scale(${w / FRAME.w})` }}
        />
      )}
    </div>
  )
}

/** Preview that trails the cursor, rotating with pointer velocity. */
function Trailer({ item }: { item: Work | null }) {
  const pointer = usePointer()
  const el = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { w, h } = SIZE

  useEffect(() => {
    if (reduced || !pointer || !item) return
    let x = pointer.current.x
    let y = pointer.current.y
    let prevX = x
    let prevY = y
    let frame = 0
    const tick = () => {
      const p = pointer.current
      x += (p.x - x) * 0.15
      y += (p.y - y) * 0.15
      const vx = Math.max(-6, Math.min(6, (x - prevX) * 0.6))
      const vy = Math.max(-6, Math.min(6, (y - prevY) * 0.6))
      prevX = x
      prevY = y
      if (el.current) {
        // centred on the cursor, but kept inside the viewport — a row near the
        // top or bottom edge would otherwise hang the preview half off-screen
        const top = Math.min(Math.max(y - h / 2, 12), window.innerHeight - h - 12)
        // the plate BANKS now rather than rolling flat: yaw off horizontal
        // velocity, pitch off vertical, with a little of the old roll left in.
        // `perspective()` sits after the translate so it projects only the
        // rotations — put first, it would distort the position as well.
        el.current.style.transform =
          `translate3d(${x + 28}px, ${top}px, 0) perspective(900px) ` +
          `rotateY(${(vx * 2.6).toFixed(2)}deg) rotateX(${(-vy * 2).toFixed(2)}deg) ` +
          `rotate(${(vx * 0.4).toFixed(2)}deg)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pointer, item, reduced, h])

  if (reduced) return null

  return (
    <AnimatePresence>
      {item && (
        <div
          ref={el}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-40 hidden [@media(pointer:fine)]:block"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
            style={{ width: w, height: h, clipPath: 'url(#clip-squircle)' }}
          >
            <Preview item={item} w={w} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Which row is under the reading line.
 *
 * The trailer above is the desktop answer and it is hover-shaped, so a phone
 * used to get NOTHING — not a reduced version of the previews, the previews
 * simply did not exist there. Scroll position is the touch equivalent of a
 * cursor: whatever row you have scrolled to is the row you are looking at.
 *
 * An IntersectionObserver rather than a scroll handler reading rects — the
 * band is expressed as a `rootMargin` and the browser does the work off the
 * main thread. Never cleared once set: between two rows nothing is in the
 * band, and blanking the plate there would make it strobe as you scroll.
 */
function useRowInView(enabled: boolean, root: React.RefObject<HTMLElement | null>) {
  const [index, setIndex] = useState<string | null>(null)
  useEffect(() => {
    const host = root.current
    if (!enabled || !host) return
    const seen = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.work
          if (!id) continue
          if (e.isIntersecting) seen.add(id)
          else seen.delete(id)
        }
        // first in document order — the indices are zero-padded, so a plain
        // sort is document order, and two rows in the band cannot flicker
        const next = [...seen].sort()[0]
        if (next) setIndex(next)
      },
      { rootMargin: '-50% 0px -32% 0px' },
    )
    host.querySelectorAll('[data-work]').forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [enabled, root])
  return index
}

/**
 * The preview, pinned to the top of the viewport while the list scrolls under
 * it. The plate turns a few degrees across the section and the incoming item
 * arrives out of depth, so the swap is a card being dealt rather than a
 * crossfade — the same 3D vocabulary the trailer banks in.
 *
 * ponytail: the frame remounts on every swap, so a live site reloads each
 * time — the same ceiling the trailer carries. Keep the mounted iframes if
 * the reload flicker ever reads as a bug.
 */
function Pinned({ item, host }: { item: Work | null; host: React.RefObject<HTMLElement | null> }) {
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const { scrollYProgress } = useScroll({ target: host, offset: ['start start', 'end start'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [7, -7])

  // the iframe is scaled from a fixed 1280 frame, so it needs the real width
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e!.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      /* an opaque full-bleed ground, not a floating plate. Pinned, the rows
         pass BEHIND this — without a ground they pass through it, and the
         caption lands on top of whichever row happens to be under it. The
         negative margin cancels the section gutter so the ground reaches both
         edges, the way the rows already do on hover. */
      className="sticky top-0 z-20 mb-10 bg-paper pt-3 pb-4"
      style={{ paddingInline: GUTTER, marginInline: `calc(${GUTTER} * -1)` }}
    >
      <motion.div
        ref={box}
        aria-hidden="true"
        style={{ transformPerspective: 1100, rotateX }}
        className="relative aspect-[16/10] w-full overflow-hidden bg-ink"
      >
        {/* the same squircle the trailer is cut to, so the two readings of the
            preview are one object shown two ways */}
        <div className="absolute inset-0" style={{ clipPath: 'url(#clip-squircle)' }}>
          {item && w > 0 && (
            <motion.div
              key={item.index}
              initial={{ opacity: 0, rotateY: -20, scale: 0.94 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 900 }}
              className="size-full"
            >
              <Preview item={item} w={w} />
            </motion.div>
          )}
        </div>
      </motion.div>
      {/* names what is on the plate — without it the preview is a picture with
          no caption, and the rows scroll past faster than the swap reads */}
      <p className="mono-label mt-3 flex items-center gap-2.5 opacity-60">
        <span aria-hidden="true" className="size-1.5 shrink-0 bg-signal" />
        {item ? `${item.index} · ${item.name}` : 'Scroll the list'}
      </p>
    </div>
  )
}

/**
 * One row of the run.
 *
 * An anchor when there is somewhere to go, a plain div when there is not —
 * an unlisted internal app and an unbuilt one are not links, and dressing
 * them as links is the lie the old accordion told by making every row look
 * identically clickable.
 *
 * Hover fills the row to ink and inverts the type, which is what the spec
 * asked for and also the only ground where `--signal` may carry text:
 * signal on paper measures 1.38:1.
 */
function Row({
  item,
  dimmed,
  onEnter,
  onLeave,
}: {
  item: Work
  dimmed: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  const live = Boolean(item.href)
  const Tag = live ? 'a' : 'div'
  return (
    <li data-work={item.index} className="border-b border-current/15">
      <Tag
        {...(live ? { href: item.href, target: '_blank', rel: 'noreferrer' } : {})}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className={`group flex flex-col gap-y-2 py-[clamp(1.5rem,3.5vw,2.25rem)] transition-[background-color,color,opacity] duration-200 sm:flex-row sm:items-baseline sm:gap-8 ${
          live ? 'hover:bg-ink hover:text-fg' : 'cursor-default'
        }`}
        style={{
          opacity: dimmed ? 0.35 : 1,
          paddingInline: GUTTER,
          marginInline: `calc(${GUTTER} * -1)`,
        }}
      >
        <span
          className={`mono-label w-6 shrink-0 opacity-60 transition-colors ${live ? 'group-hover:text-signal group-hover:opacity-100' : ''}`}
        >
          {item.index}
        </span>

        <span className="flex-1">
          <span className="block text-[clamp(1.5rem,4vw,2.75rem)] leading-none tracking-[-0.03em]">
            {item.name}
          </span>
          {/* the one line that used to be a click away. A description hidden
              behind a disclosure is a description nobody reads. */}
          <span className="mt-2 block max-w-[54ch] text-sm leading-[1.55] opacity-65">
            {item.blurb}
          </span>
        </span>

        <span className="mono-label hidden w-48 shrink-0 truncate opacity-60 lg:block">
          {item.kind}
        </span>

        {/* names the destination instead of a bare arrow, so the row says
            where it goes before it is clicked */}
        <span className="mono-label flex w-full shrink-0 items-baseline justify-between gap-2 opacity-60 sm:w-64 sm:justify-end">
          <span className="truncate">{item.dest}</span>
          {/* the arrow is the affordance, so the rows that go nowhere do not
              get one — the slot stays, so the column edge does not go ragged */}
          <span
            aria-hidden="true"
            className={`font-mono w-3 shrink-0 text-right ${live ? 'transition-transform duration-200 group-hover:translate-x-1' : ''}`}
          >
            {live ? '↗' : ''}
          </span>
        </span>
      </Tag>
    </li>
  )
}

export function Projects() {
  const [hovered, setHovered] = useState<Work | null>(null)
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const list = useRef<HTMLDivElement>(null)
  // the pinned plate is the coarse-pointer reading of the trailer, so exactly
  // one of the two is ever live — and the observer does not run at all on a
  // machine that has a cursor
  const inView = useRowInView(!fine, list)
  /**
   * The preview follows the hovered row, so it has to be cleared by the row
   * itself. Clearing only on the section's `mouseleave` left it stranded
   * everywhere inside the section that is not a row — the heading, the band
   * labels, the gaps between bands.
   *
   * The grace period is what makes row-to-row work: leaving A queues the
   * clear, entering B cancels it, so the preview slides across instead of
   * blinking out and reloading the frame in between.
   */
  const pending = useRef<number | undefined>(undefined)
  const enter = (item: Work) => {
    window.clearTimeout(pending.current)
    setHovered(item)
  }
  const leave = () => {
    window.clearTimeout(pending.current)
    pending.current = window.setTimeout(() => setHovered(null), 60)
  }
  useEffect(() => () => window.clearTimeout(pending.current), [])
  const rise = reduced
    ? {}
    : {
        initial: { y: 20, opacity: 0 },
        whileInView: { y: 0, opacity: 1 },
        viewport: { once: true, margin: '-12%' },
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
      }

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      /* `overflow-x-clip`, not `overflow-hidden`: hidden makes this a scroll
         container, and a sticky child sticks to its nearest scrolling ancestor
         — so the pinned preview below would never move. `clip` guards the same
         horizontal bleed without creating one. */
      className="relative overflow-x-clip bg-paper px-[clamp(1.25rem,5vw,5rem)] py-[clamp(6rem,14vh,12rem)] text-[oklch(0.145_0.008_62)]"
      onMouseLeave={leave}
    >
      <Slug index="04" label="Work" face="mefiant" className="mb-6" />
      <h2
        id="work-title"
        className="mb-16 max-w-[20ch] text-[clamp(2rem,5vw,4rem)] leading-[0.94] tracking-[-0.03em]"
      >
        Three apps, three sites, two in build
      </h2>

      <div ref={list}>
        {!fine && <Pinned item={WORK.flatMap((g) => g.items).find((i) => i.index === inView) ?? null} host={list} />}

        {WORK.map((group, gi) => (
          <motion.div key={group.band} {...rise} className={gi ? 'mt-20' : ''}>
            {/* The band carried its own hairline, which landed a few pixels
                under the previous band's closing rule and read as a double
                line. It has none now: the space above it and the marker beside
                it do the separating, and the only rule at a boundary is the one
                the last row already draws. */}
            <h3 className="mono-label flex items-baseline justify-between gap-4 pb-5">
              <span className="flex items-center gap-2.5">
                <span aria-hidden="true" className="size-1.5 shrink-0 bg-current" />
                {group.band}
              </span>
              {/* the index range, not a count — it ties the band to the numbers
                  running down the left edge */}
              <span className="opacity-50">
                {group.items.length > 1
                  ? `${group.items[0]!.index}—${group.items[group.items.length - 1]!.index}`
                  : group.items[0]!.index}
              </span>
            </h3>
            <ul>
              {group.items.map((item) => (
                <Row
                  key={item.index}
                  item={item}
                  dimmed={
                    fine
                      ? hovered !== null && hovered.index !== item.index
                      : inView !== null && inView !== item.index
                  }
                  onEnter={() => enter(item)}
                  onLeave={leave}
                />
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <Trailer item={hovered} />
    </section>
  )
}
