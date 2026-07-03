/**
 * Intent recognition (spec §3/§4/§5) — reconstruct + mine a vague brief into an
 * open-world {@link IntentProfile} upstream of the Planner.
 *
 * Rides the Settings **chat** slot: `GenerationService.generateObject` resolves +
 * renders the `ui-intent-recognition` prompt, sends the brief as a call-time
 * text part, and enforces `intentProfileSchema` structurally at the model
 * boundary. We then re-parse the reply with the same schema (belt-and-suspenders,
 * mirroring the Planner's post-`generateObject` `validateGraph`) so a
 * shape-invalid reply is rejected BEFORE anyone consumes it, and the list
 * defaults are normalized.
 *
 * There is NO fixed route taxonomy: `strategy` and every `dimensions[].aspect`
 * are free text the model authors. This service does NOT gate on confidence —
 * it returns whatever profile the model produced (a low-confidence profile
 * carries its own `questions`); the run flow (P7b) decides whether to surface
 * questions or proceed.
 *
 * Pure across the service seam: it never throws — it returns a `Result` and the
 * caller (a mutation hook) decides how to surface failures.
 */
import type { Result } from '@/services/types'
import { err, isErr, ok } from '@/services/types'
import type { GenerationService } from '@/services/ai/types'
import { intentProfileSchema, type IntentProfile } from './intent-types'

/** Inputs the caller resolves (chat model slot + the requirement brief). */
export interface RecognizeIntentParams {
  readonly providerId: string
  /** The resolved chat/vision model slug (Settings chat slot). */
  readonly model: string
  /** The vague product brief whose intent is reconstructed + mined. */
  readonly brief: string
  readonly signal?: AbortSignal
}

/**
 * Ask the chat model to recognize the intent behind `brief`. Returns the
 * validated {@link IntentProfile} on success; a clear error otherwise (empty
 * brief, generation failure, or a structurally invalid profile).
 */
export async function recognizeIntent(
  generation: GenerationService,
  params: RecognizeIntentParams,
): Promise<Result<IntentProfile>> {
  const brief = params.brief.trim()
  if (brief.length === 0) return err('A brief is required to recognize intent.')

  const result = await generation.generateObject(
    {
      providerId: params.providerId,
      model: params.model,
      promptRef: { id: 'ui-intent-recognition' },
      input: [{ type: 'text', text: brief }],
      signal: params.signal,
    },
    intentProfileSchema,
  )
  if (isErr(result)) return result

  const parsed = intentProfileSchema.safeParse(result.data)
  if (!parsed.success) {
    return err(`The model produced an invalid intent profile: ${parsed.error.message}`)
  }

  return ok(parsed.data)
}
