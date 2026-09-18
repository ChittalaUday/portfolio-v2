import { useEffect, useRef } from 'react'
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
