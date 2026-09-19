import { useEffect, useRef } from 'react'
import { BloubSolid } from '@/components/BloubSolid'
import { ME } from '@/lib/content'

export function Footer() {
  const clock = useRef<HTMLTimeElement>(null)

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: ME.tz,
      hour12: false,
    })
    const tick = () => {
      if (clock.current) clock.current.textContent = `Local time ${fmt.format(new Date())} IST`
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer id="footer" className="relative overflow-hidden border-t border-rule pt-16">
      <div className="mono-label flex flex-wrap justify-between gap-6 px-[clamp(1.25rem,5vw,5rem)] pb-16 text-fg-muted">
        <span>© 2026</span>
        <span className="hidden sm:block">Built with React · Tailwind · Motion</span>
        <time ref={clock} />
        <a href="#hero" className="transition-colors hover:text-signal">
          Scroll ↑
        </a>
      </div>

      {/* The page's last object, and the only one you can pick up and turn.
          It sits here rather than mid-page on purpose: a thing to play with
          belongs where there is nothing left to read, and the footer was a
          wordmark and a link row — the one section with no motion at all. */}
      <div className="flex flex-col items-center gap-5 pb-10">
        <BloubSolid />
        <p className="mono-label text-fg-faint">Drag to turn · tap to reshape</p>
      </div>

      {/* wordmark as texture — condensed so the full name fits the bleed
          without being scaled, the width axis doing structural work */}
      <p
        aria-hidden="true"
        className="type-condensed -mb-[0.055em] w-full whitespace-nowrap text-center text-[18vw] leading-[0.8] tracking-[-0.05em] text-fg-faint/45 select-none"
      >
        {ME.name}
      </p>
    </footer>
  )
}
