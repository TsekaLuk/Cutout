/**
 * Pipeline constants ported verbatim from the original Electron renderer.
 *
 * Do NOT tweak these — the port's contract is byte-identical output. The
 * user-facing default for `threshold` (246) lives here; the others are the
 * hard-coded magic numbers baked into the original pixel math.
 */

/** A pixel with alpha strictly below this is treated as background. */
export const BACKGROUND_ALPHA_MAX = 8

/** Feather: an edge pixel counts as "near white" if each of r,g,b is strictly above this. */
export const FEATHER_NEAR_WHITE_MIN = 235

/** Feather: near-white edge pixels have their alpha capped at this value. */
export const FEATHER_ALPHA_CAP = 90

/** Default white-background RGB threshold (user default). */
export const DEFAULT_THRESHOLD = 246
