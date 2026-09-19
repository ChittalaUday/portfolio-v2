import { useEffect, useRef } from 'react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import { ReactLenis } from 'lenis/react'
import { Curtain } from '@/components/Curtain'
import { PointerContext, useFinePointer, type Pointer } from '@/hooks/usePointer'
import { Shapes } from '@/components/Shapes'
import TargetCursor from '@/components/TargetCursor'
import { Hero } from '@/sections/Hero'
import { About } from '@/sections/About'
import { Stack } from '@/sections/Stack'
import { Projects } from '@/sections/Projects'
import { Path } from '@/sections/Path'
import { Contact } from '@/sections/Contact'
import { Footer } from '@/sections/Footer'

export default function App() {
  const pointer = useRef<Pointer>({ x: 0, y: 0, active: false, down: false })
  const reduced = useReducedMotion()
  const fine = useFinePointer()

  // one listener for the whole page — the hero ripple, the hero face and the
  // project trailer all read this ref
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = e.clientX
      pointer.current.y = e.clientY
      // a touch sets the pointer down once and leaves it there, so treating it
      // as a live cursor freezes every bloub staring at wherever you last
      // tapped. Only a device that actually hovers counts as watching.
      pointer.current.active = e.pointerType !== 'touch'
    }
    const leave = () => {
      pointer.current.active = false
    }
    // a touch is a cursor only for as long as it is held — see `Pointer.down`
    const press = (e: PointerEvent) => {
      pointer.current.x = e.clientX
      pointer.current.y = e.clientY
      pointer.current.down = true
    }
    const release = () => {
      pointer.current.down = false
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', press, { passive: true })
    window.addEventListener('pointerup', release, { passive: true })
    window.addEventListener('pointercancel', release, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])

  const page = (
    <>
      <Shapes />
      <main className="min-h-screen bg-ink text-fg">
        {/* The hero is sticky and About scrolls OVER it. Both need to share one
            positioned parent for that: the hero's sticky travel is the height
            of this box, so it releases the moment About has finished passing
            and never lingers under the rest of the page.

            `overflow-x-clip` because the pinned hero pitches: its near edge
            projects WIDER than the viewport, and the hero's own
            `overflow-hidden` cannot help — that clips its children, not its own
            transformed box. `clip` and not `hidden`, or this becomes a scroll
            container and the sticky child inside it would never move. */}
        <div className="relative overflow-x-clip">
          <Hero />
          <About />
        </div>
        <Stack />
        <Projects />
        <Path />
        <Contact />
        <Footer />
      </main>
    </>
  )

  return (
    <MotionConfig reducedMotion="user">
      <PointerContext.Provider value={pointer}>
        <Curtain />
        {/* Replaces the bloub cursor companion — one thing may follow the
            pointer, not two. Targeting every link and button by selector
            rather than a hand-applied class, so new interactive elements are
            picked up without anyone remembering to mark them. Opted out of
            with `data-cursor-plain`, which the hero bloub uses — bracketing a
            700px ball is not a pointer hint. Not mounted under reduced motion
            (it spins continuously and hides the native cursor) nor on a coarse
            pointer, where there is no cursor to replace. */}
        {!reduced && fine && (
          <TargetCursor
            targetSelector="a[href], button:not([data-cursor-plain])"
            spinDuration={3}
            cursorColor="var(--fg)"
          />
        )}
        {/* `root` renders children with no wrapper element, so the layout is
            untouched. `anchors` hands the in-page links to Lenis; skipped
            entirely under reduced motion, where native instant jumps are the
            correct behaviour. */}
        {reduced ? (
          page
        ) : (
          <ReactLenis root options={{ lerp: 0.09, anchors: true }}>
            {page}
          </ReactLenis>
        )}
      </PointerContext.Provider>
    </MotionConfig>
  )
}
