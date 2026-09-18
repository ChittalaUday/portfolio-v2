/**
 * Load choreography, in seconds. Single source of truth: the curtain reads
 * these for its CSS animation and the hero reads them for its entrance, so the
 * two cannot drift apart.
 */
export const CURTAIN_DELAY = 0.12
export const CURTAIN_DURATION = 1

/**
 * Fraction of the duration at which the panels are effectively off-screen.
 *
 * Not 1: the timing function is a hard ease-out, so ~97% of the travel is done
 * by ~0.6 of the time. Waiting for the formal end left a ~400ms window where
 * the hero was exposed but still empty.
 */
const CURTAIN_CLEARS = 0.62

/** A beat of empty dark after the panels leave, before the hero arrives. */
const HOLD = 0.08

/** When anything in the hero is allowed to start moving. */
export const REVEAL_AT = CURTAIN_DELAY + CURTAIN_DURATION * CURTAIN_CLEARS + HOLD
