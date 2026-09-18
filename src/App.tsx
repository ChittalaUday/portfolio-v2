import { useEffect, useRef } from 'react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import { ReactLenis } from 'lenis/react'
import { Curtain } from '@/components/Curtain'
import { PointerContext, type Pointer } from '@/hooks/usePointer'
import { Shapes } from '@/components/Shapes'
import TargetCursor from '@/components/TargetCursor'
import { Hero } from '@/sections/Hero'
import { About } from '@/sections/About'
import { Stack } from '@/sections/Stack'
import { Projects } from '@/sections/Projects'
import { Contact } from '@/sections/Contact'
import { Footer } from '@/sections/Footer'

export default function App() {
  const pointer = useRef<Pointer>({ x: 0, y: 0, active: false })
  const reduced = useReducedMotion()

  // one listener for the whole page — the hero ripple, the hero face and the
  // project trailer all read this ref
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = e.clientX
      pointer.current.y = e.clientY
      pointer.current.active = true
    }
    const leave = () => {
      pointer.current.active = false
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])

  const page = (
    <>
      <Shapes />
      <main className="min-h-screen bg-ink text-fg">
        <Hero />
        <About />
        <Stack />
        <Projects />
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
            picked up without anyone remembering to mark them. Not mounted
            under reduced motion: it spins continuously, and it hides the
            native cursor. */}
        {!reduced && (
          <TargetCursor
            targetSelector="a[href], button"
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
