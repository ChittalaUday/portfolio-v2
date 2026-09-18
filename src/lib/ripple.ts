/** Variable-font axis ripple. Pure so it can be checked without a DOM. */

export const FALLOFF = 180 // px — radius over which the ripple decays
export const WGHT = [300, 800] as const
export const WDTH = [100, 75] as const

/** Smoothstep — a linear falloff reads mechanical at these sizes. */
export function falloff(distance: number, radius = FALLOFF) {
  const t = Math.max(0, Math.min(1, 1 - distance / radius))
  return t * t * (3 - 2 * t)
}

/** The two axes the display family carries, driven together. */
export function axes(distance: number, radius = FALLOFF) {
  const e = falloff(distance, radius)
  return {
    wght: WGHT[0] + (WGHT[1] - WGHT[0]) * e,
    wdth: WDTH[0] + (WDTH[1] - WDTH[0]) * e,
  }
}

export function axisStyle(distance: number, radius = FALLOFF) {
  const { wght, wdth } = axes(distance, radius)
  return `'wght' ${wght}, 'wdth' ${wdth}`
}
