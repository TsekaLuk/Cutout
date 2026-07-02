/**
 * Local `PromptService` (spec §4/§9, P1) — built-ins only, no override layer.
 *
 * Backed by the in-code `PromptRegistry`. Resolution is "pinned version → latest
 * semver"; the user-override precedence (P2, Tauri store) lands later behind the
 * SAME interface, so callers never change. Async by contract (matches the other
 * services and the future `remote/` seam), even though P1 work is synchronous.
 */
import type {
  PromptRef,
  PromptService,
  PromptSummary,
  PromptVersion,
  RenderedPrompt,
} from '@/prompts/types'
import { createBuiltinRegistry } from '@/prompts/catalog'
import type { PromptRegistry } from '@/prompts/registry'
import { render } from '@/prompts/render'

/**
 * Build the local prompt service. A registry may be injected (tests / future
 * override layer); by default the built-in catalog is used.
 */
export function createLocalPromptService(
  registry: PromptRegistry = createBuiltinRegistry(),
): PromptService {
  return {
    async list(): Promise<readonly PromptSummary[]> {
      return registry.list()
    },
    async versions(id: string): Promise<readonly string[]> {
      return registry.versions(id)
    },
    async resolve(ref: PromptRef): Promise<PromptVersion> {
      return registry.resolve(ref.id, ref.version)
    },
    async render(ref: PromptRef): Promise<RenderedPrompt> {
      const def = registry.resolve(ref.id, ref.version)
      return render(def, ref.variables ?? {})
    },
  }
}
