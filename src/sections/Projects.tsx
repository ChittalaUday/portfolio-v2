import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Slug } from '@/components/SectionHead'
import { usePointer } from '@/hooks/usePointer'
import { PROJECTS, type Project } from '@/lib/content'

/** Duotone plate standing in for a real screenshot. Deterministic per
 *  project so it reads as art direction rather than a missing asset. */
function Plate({ project }: { project: Project }) {
  const hue = 106 + Number(project.index) * 14
  return (
    <div
      className="size-full"
      style={{
        background: `radial-gradient(130% 100% at 25% 10%, oklch(0.858 0.184 ${hue} / 0.55), oklch(0.196 0.008 62) 62%)`,
      }}
    />
  )
}

/** Thumbnail that trails the cursor, rotating with pointer velocity. */
function Trailer({ project }: { project: Project | null }) {
  const pointer = usePointer()
  const el = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !pointer || !project) return
    let x = pointer.current.x
    let y = pointer.current.y
    let prev = x
    let frame = 0
    const tick = () => {
      const p = pointer.current
      x += (p.x - x) * 0.15
      y += (p.y - y) * 0.15
      const vel = Math.max(-6, Math.min(6, (x - prev) * 0.6))
      prev = x
      if (el.current) {
        el.current.style.transform = `translate3d(${x + 28}px, ${y - 110}px, 0) rotate(${vel}deg)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pointer, project, reduced])

  if (reduced) return null

  return (
    <AnimatePresence>
      {project && (
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
            className="h-[220px] w-[320px] overflow-hidden"
            style={{ clipPath: 'url(#clip-squircle)' }}
          >
            <Plate project={project} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Projects() {
  const [open, setOpen] = useState<string | null>(null)
  const [hovered, setHovered] = useState<Project | null>(null)

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="relative overflow-hidden bg-paper px-[clamp(1.25rem,5vw,5rem)] py-[clamp(6rem,14vh,12rem)] text-[oklch(0.145_0.008_62)]"
      onMouseLeave={() => setHovered(null)}
    >
      <Slug index="04" label="Work" face="mefiant" className="mb-6" />
      <h2
        id="work-title"
        className="mb-16 max-w-[20ch] text-[clamp(2rem,5vw,4rem)] leading-[0.94] tracking-[-0.03em]"
      >
        Six things worth showing
      </h2>

      <ul className="border-t border-current/15">
        {PROJECTS.map((p) => {
          const isOpen = open === p.index
          const dimmed = hovered !== null && hovered.index !== p.index
          return (
            <li key={p.index} className="border-b border-current/15">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : p.index)}
                onMouseEnter={() => setHovered(p)}
                className="group flex w-full items-baseline gap-4 py-[clamp(1.5rem,3.5vw,2.5rem)] text-left transition-opacity duration-200 sm:gap-8"
                style={{ opacity: dimmed ? 0.35 : 1 }}
              >
                <span className="mono-label w-6 shrink-0 transition-colors group-hover:text-signal">
                  {p.index}
                </span>
                <span className="flex-1 text-[clamp(1.5rem,4vw,2.75rem)] leading-none tracking-[-0.03em]">
                  {p.name}
                </span>
                <span className="mono-label hidden w-56 shrink-0 truncate whitespace-nowrap opacity-60 sm:block">{p.kind}</span>
                <span className="mono-label w-10 shrink-0 text-right opacity-60">{p.year}</span>
                <span
                  aria-hidden="true"
                  className="font-mono w-4 shrink-0 text-right transition-transform duration-200 group-hover:translate-x-1"
                >
                  {isOpen ? '↑' : '→'}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-8 pb-10 lg:grid-cols-12">
                      {/* inline on touch — there is no hover to trail */}
                      <div
                        className="aspect-[16/11] w-full overflow-hidden lg:col-span-4 [@media(pointer:fine)]:lg:hidden"
                        style={{ clipPath: 'url(#clip-squircle)' }}
                      >
                        <Plate project={p} />
                      </div>
                      <div className="lg:col-span-6">
                        <p className="max-w-[52ch] text-base leading-[1.6] opacity-70">{p.blurb}</p>
                      </div>
                      <div className="lg:col-span-3 lg:col-start-10">
                        <p className="mono-label mb-3 opacity-60">Built with</p>
                        <ul className="mb-6 space-y-1 text-sm">
                          {p.tech.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                        <div className="mono-label flex gap-4">
                          {p.live && (
                            <a href={p.live} className="hover:text-signal">
                              Live ↗
                            </a>
                          )}
                          {p.source && (
                            <a href={p.source} className="hover:text-signal">
                              Source ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>

      <Trailer project={open ? null : hovered} />
    </section>
  )
}
