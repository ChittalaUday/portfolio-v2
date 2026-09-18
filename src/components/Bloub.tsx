import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { usePointer } from '@/hooks/usePointer'
import type { SectionId } from '@/lib/content'

import hero from '@/assets/bloub/hero.svg'
import about from '@/assets/bloub/about.svg'
import stack from '@/assets/bloub/stack.svg'
import work from '@/assets/bloub/work.svg'
import contact from '@/assets/bloub/contact.svg'
import footer from '@/assets/bloub/footer.svg'

const FACE: Record<SectionId, string> = { hero, about, stack, work, contact, footer }

/**
 * The cursor companion. Replaces the generic dot that every cursor-effect
 * tutorial ships — this is a character that reacts to where you are on
 * the page. Hidden for reduced-motion and on touch (nothing to follow).
 */
export function Bloub({ section }: { section: SectionId }) {
  const pointer = usePointer()
  const el = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !pointer) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let frame = 0

    const tick = () => {
      const p = pointer.current
      x += (p.x - x) * 0.12
      y += (p.y - y) * 0.12
      if (el.current) {
        el.current.style.transform = `translate3d(${x - 22}px, ${y - 22}px, 0)`
        el.current.style.opacity = p.active ? '1' : '0'
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pointer, reduced])

  if (reduced || section === 'hero') return null

  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 hidden size-11 opacity-0 transition-opacity duration-300 [@media(pointer:fine)]:block"
    >
      {/* one <img> per face, cross-faded — keeps all six warm so a section
          change never shows a blank frame */}
      {(Object.keys(FACE) as SectionId[]).map((id) => (
        <img
          key={id}
          src={FACE[id]}
          alt=""
          className="absolute inset-0 size-full transition-opacity duration-500"
          style={{ opacity: id === section ? 1 : 0 }}
        />
      ))}
    </div>
  )
}
