import { useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { PointerContext, type Pointer } from '@/hooks/usePointer'
import { Shapes } from '@/components/Shapes'
import { Bloub } from '@/components/Bloub'
import { Hero } from '@/sections/Hero'
import { About } from '@/sections/About'
import { Stack } from '@/sections/Stack'
import { Projects } from '@/sections/Projects'
import { Contact } from '@/sections/Contact'
import { Footer } from '@/sections/Footer'
import { SECTIONS, type SectionId } from '@/lib/content'

export default function App() {
  const pointer = useRef<Pointer>({ x: 0, y: 0, active: false })
  const [section, setSection] = useState<SectionId>('hero')

  // one listener for the whole page — the hero ripple, the bloub companion
  // and the project trailer all read this ref
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

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit) setSection(hit.target.id as SectionId)
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <PointerContext.Provider value={pointer}>
        <Shapes />
        <Bloub section={section} />
        <main className="min-h-screen bg-ink text-fg">
          <Hero />
          <About />
          <Stack />
          <Projects />
          <Contact />
          <Footer />
        </main>
      </PointerContext.Provider>
    </MotionConfig>
  )
}
