import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { CURTAIN_DELAY, CURTAIN_DURATION } from '@/lib/reveal'

/**
 * Two paper panels that part from the centre on load.
 *
 * Driven by CSS keyframes rather than state, so it starts on the first frame
 * with nothing to coordinate — the hero's own entrance runs underneath at the
 * same time. Deliberately does NOT wait on `document.fonts.ready`: a font that
 * never resolves would leave the viewer staring at a white screen.
 */
export function Curtain() {
  const [done, setDone] = useState(false)
  const reduced = useReducedMotion()

  // motion declined: no curtain at all, rather than a white flash that is
  // instantly removed
  if (reduced || done) return null

  const timing = {
    animationDuration: `${CURTAIN_DURATION}s`,
    animationDelay: `${CURTAIN_DELAY}s`,
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-100 flex">
      <div
        data-side="left"
        style={timing}
        onAnimationEnd={() => setDone(true)}
        className="curtain-half h-full w-1/2 bg-paper"
      />
      <div data-side="right" style={timing} className="curtain-half h-full w-1/2 bg-paper" />
    </div>
  )
}
