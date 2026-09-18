import { createContext, useContext } from 'react'

export type Pointer = { x: number; y: number; active: boolean }

/**
 * One pointermove listener for the whole page. The hero ripple, the bloub
 * companion and the project thumbnail all read this same source rather than
 * each attaching their own listener.
 */
export const PointerContext = createContext<React.RefObject<Pointer> | null>(null)

export function usePointer() {
  return useContext(PointerContext)
}
