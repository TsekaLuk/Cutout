/**
 * IntentProfile (spec §3) — the OPEN-WORLD, self-derived intent contract.
 *
 * Sits upstream of the Planner: from a vague brief the chat model reconstructs
 * the user's true goal and mines it along whatever aspects actually matter for
 * THIS request. Deliberately open — `strategy` and every `dimensions[].aspect`
 * are FREE TEXT the model authors, NOT a fixed enum. There is no route
 * taxonomy anywhere; the emergent classification is the graph the Planner then
 * shapes from this profile.
 *
 * Keeping the shape a zod schema (not just a TS type) lets `generateObject`
 * enforce it at the model boundary and lets `recognizeIntent` (see `./intent`)
 * re-parse the reply defensively before anyone consumes it. The model slot is
 * resolved from Settings at call time — it is not embedded here.
 */
import { z } from 'zod'

/**
 * One mined facet of the intent. Both fields are self-authored: the model picks
 * the `aspect` (domain / audience / deliverables / fidelity / style /
 * constraints / …) — it is NOT chosen from a preset list — and fills its `value`.
 */
export interface IntentDimension {
  /** The self-chosen facet name (free text, model-authored). */
  readonly aspect: string
  /** What the model inferred for that facet. */
  readonly value: string
}

/**
 * The reconstructed, self-derived understanding of a brief (spec §3). `strategy`
 * is an open, model-authored approach LABEL (never an enum); `dimensions` are
 * mined along self-chosen aspects; `questions` is populated ONLY when the model
 * is genuinely uncertain / the ask is out of scope — otherwise empty (the
 * open-world safety valve, not an interrogation of a clear brief).
 */
export interface IntentProfile {
  /** The reconstructed true goal (open). */
  readonly goal: string
  /** Self-derived approach label — a free string, NOT a fixed route. */
  readonly strategy: string
  /** Why this approach fits the intent. */
  readonly rationale: string
  /** Facets mined along model-chosen aspects. */
  readonly dimensions: readonly IntentDimension[]
  /** Gaps the model filled in (transparent + editable downstream). */
  readonly assumptions: readonly string[]
  /** Self-estimated confidence, 0..1. */
  readonly confidence: number
  /** Clarifying questions — non-empty only when genuinely ambiguous. */
  readonly questions: readonly string[]
}

/** Dimension schema — both facets are non-empty free strings (open by design). */
export const intentDimensionSchema = z.object({
  aspect: z.string().min(1),
  value: z.string().min(1),
})

/**
 * The IntentProfile schema handed to `generateObject` (and re-parsed by
 * `recognizeIntent`). Open by design: `strategy` and `dimensions[].aspect` are
 * free text the model authors, so the "classification" is self-derived, not
 * fixed. `confidence` is clamped to 0..1; the list fields default to empty so a
 * confident reply may legitimately omit `questions` / `assumptions`.
 */
export const intentProfileSchema = z.object({
  goal: z.string().min(1),
  strategy: z.string().min(1),
  rationale: z.string().min(1),
  dimensions: z.array(intentDimensionSchema).default([]),
  assumptions: z.array(z.string().min(1)).default([]),
  confidence: z.number().min(0).max(1),
  questions: z.array(z.string().min(1)).default([]),
})

/** The exact type `intentProfileSchema` parses to (defaults applied). */
export type ParsedIntentProfile = z.infer<typeof intentProfileSchema>
