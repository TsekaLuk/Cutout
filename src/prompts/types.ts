/**
 * Prompt domain contract (spec §4) — model-instruction assets, NOT i18n.
 *
 * Prompts are English-/developer-canonical, semver-iterated, eval'd assets that
 * reach a model. They are a different species from Lingui UI copy and never
 * enter the locale catalogs (spec §1 hard rule).
 *
 * A `PromptVersion` is one immutable, versioned instruction. Its `render` is a
 * PURE function: validated template vars → a `RenderedPrompt` (the `system`
 * instruction, plus optional message scaffolding). The runtime image input (a
 * screenshot) is supplied by the caller as a `PromptPart` at call time — it is
 * NOT a template variable.
 */
import type { z } from 'zod'
import type { ProviderKind } from '@/services/ai/provider-types'

/** Coarse task family a prompt belongs to (open-ended by design). */
export type PromptScenario =
  | 'ui-deconstruction'
  | 'generation'
  | 'infill'
  | (string & {})

/** How the prompt expects to be exercised against a model. */
export type PromptModality = 'text' | 'vision' | 'image-generation'

/** Advisory model preferences — hints, not binding (caller/registry decides). */
export interface ModelHints {
  /** Preferred provider kind (reuses the BYOK `ProviderKind`). */
  readonly kind?: ProviderKind
  /** Preferred model slug (may be left to the caller/config default). */
  readonly model?: string
  /** Suggested sampling temperature. */
  readonly temperature?: number
  /** What kind of I/O the prompt is built for. */
  readonly modality: PromptModality
}

/** A single user-message content part supplied at call time. */
export type PromptPart =
  | { readonly type: 'text'; readonly text: string }
  /** The caller injects the screenshot here (bytes, base64, data-URL or URL). */
  | { readonly type: 'image'; readonly image: Uint8Array | string }

/** The output of a pure render: the system instruction + optional scaffold. */
export interface RenderedPrompt {
  /** The model instruction. */
  readonly system: string
  /** Optional extra user-message parts (text framing) prepended to caller input. */
  readonly userScaffold?: readonly PromptPart[]
}

/**
 * One immutable, semver-versioned prompt definition.
 * @typeParam V - the zod schema for this version's template variables.
 */
export interface PromptVersion<V extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Stable id shared across versions, e.g. `ui-asset-deconstruction`. */
  readonly id: string
  /** Semver, e.g. `1.0.0`. Highest wins when a ref omits the version. */
  readonly version: string
  readonly description: string
  readonly scenario: PromptScenario
  readonly hints: ModelHints
  /** Zod schema validating template variables before {@link render}. */
  readonly inputSchema: V
  /** Pure: validated vars → the system instruction (+ optional scaffold). */
  readonly render: (vars: z.infer<V>) => RenderedPrompt
  /** Author / createdAt etc. — timestamps are passed in, never `Date.now()`. */
  readonly metadata?: Record<string, string>
}

/** A request handle for a prompt: which id, which version, which variables. */
export interface PromptRef {
  readonly id: string
  /** Omit to resolve the latest semver; set to pin a specific version. */
  readonly version?: string
  /** Template variables validated against the resolved version's schema. */
  readonly variables?: Record<string, unknown>
}

/** A compact listing entry (id + its latest version) for menus/telemetry. */
export interface PromptSummary {
  readonly id: string
  /** The latest (highest-semver) version for this id. */
  readonly version: string
  readonly scenario: PromptScenario
  readonly description: string
  readonly modality: PromptModality
}

/**
 * The service surface consumed via `useServices().prompts`. P1 is built-ins
 * only (no override layer); P2 adds `setOverride`/`clearOverride` on a Tauri
 * store, resolved ahead of built-ins.
 */
export interface PromptService {
  /** All prompts, one summary per id at its latest version. */
  list(): Promise<readonly PromptSummary[]>
  /** All versions of an id, ascending semver. Throws on unknown id. */
  versions(id: string): Promise<readonly string[]>
  /** Resolve a ref to a concrete version (override → pinned → latest). */
  resolve(ref: PromptRef): Promise<PromptVersion>
  /** Resolve + zod-validate variables + render → the instruction. */
  render(ref: PromptRef): Promise<RenderedPrompt>
}
