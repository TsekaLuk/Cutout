/**
 * Pure prompt rendering (spec §3) — variables in, `RenderedPrompt` out.
 *
 * `render` validates the caller's variables against the version's zod schema
 * (throwing `ZodError` on mismatch), then delegates to the version's own pure
 * `render`. No I/O, no clock, no randomness — deterministic for a given input.
 */
import type { z } from 'zod'
import type { PromptVersion, RenderedPrompt } from './types'

/**
 * Validate `vars` against `def.inputSchema`, then render the instruction.
 * @throws ZodError when the variables do not satisfy the schema.
 */
export function render<V extends z.ZodTypeAny>(
  def: PromptVersion<V>,
  vars: unknown,
): RenderedPrompt {
  const parsed = def.inputSchema.parse(vars ?? {}) as z.infer<V>
  return def.render(parsed)
}
