import { createContext, useContext, useEffect, useState } from 'react'

export type Pointer = {
  x: number
  y: number
  /** a pointer that HOVERS — a mouse or trackpad. Never true for touch. */
  active: boolean
  /**
   * a pointer that is pressed right now, touch included.
   *
   * Separate from `active` on purpose: the bloub faces track `active`, because
   * a face frozen staring at wherever you last tapped is worse than one that
   * wanders. The hero ripple wants the opposite — while a finger is down it
   * IS a live cursor, and it stops being one the moment the finger lifts.
   */
  down: boolean
}

/**
 * One pointermove listener for the whole page. The hero ripple, the bloub
 * companion and the project thumbnail all read this same source rather than
 * each attaching their own listener.
 */
export const PointerContext = createContext<React.RefObject<Pointer> | null>(null)

export function usePointer() {
  return useContext(PointerContext)
}

/**
 * Whether this device has a hovering pointer at all.
 *
 * Read as a media query rather than inferred from the user agent, and watched,
 * since a tablet with a trackpad attached can flip mid-session.
 */
export function useFinePointer() {
  const query = '(pointer: fine)'
  const [fine, setFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return fine
}
