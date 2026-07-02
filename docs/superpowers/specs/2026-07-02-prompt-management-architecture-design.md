# Cutout — Prompt Management Architecture Spec

**Status:** decided (trade-off scored below) · **Depends on:** the shipped `services/ai` layer (GenerationService/ProviderService, ServiceRegistry) · **Scope:** where prompts live, how they're versioned/iterated/overridden, and how they reach the model. **Not** in scope: building the generative features themselves.

---

## 1. Intent → requirements

Recognized intent behind "manage prompts" (not "store a string"):

| # | Requirement | Weight |
|---|---|---|
| R1 | Multiple prompts across scenarios (deconstruct / generate / infill / …) | ×2 |
| R2 | Versioning + iteration (semver, rollback, compare) — explicitly asked | ×3 |
| R3 | Offline-first (local desktop; no hard network dependency) | ×3 |
| R4 | Runtime-editable (power users iterate a prompt without a rebuild) | ×2 |
| R5 | Future server seam (central prompt delivery/sync, like BYOK) | ×2 |
| R6 | Type-safe variables; build-time correctness | ×2 |
| R7 | Eval / A-B readiness per version | ×1.5 |
| R8 | Multimodal (this prompt's input is a screenshot) | ×1 |

**Hard rule:** prompts are **NOT** i18n. They are model-instruction assets (English-canonical, developer-authored, semver-iterated, eval'd) — a different species from user-facing UI copy. They never enter the Lingui catalogs.

## 2. Trade-off (comparative scoring)

Five archetypes, weighted 1–5 against R1–R8 (+ effort ×1.5, footprint ×1):

| Criterion (weight) | ① inline literals | ② in-repo typed registry | ③ **hybrid: registry + runtime override + PromptService seam** | ④ external SaaS (Langfuse/PromptLayer/Braintrust) | ⑤ local data files (MD/JSON) |
|---|:--:|:--:|:--:|:--:|:--:|
| Offline-first (×3) | 5 | 5 | **5** | 1 | 5 |
| Versioning/iteration (×3) | 1 | 4 | **5** | 5 | 3 |
| Multi-scenario (×2) | 1 | 4 | **5** | 5 | 4 |
| Runtime-editable (×2) | 1 | 2 | **5** | 5 | 4 |
| Server seam (×2) | 1 | 2 | **5** | 4 | 3 |
| Type-safety (×2) | 2 | 5 | **4** | 2 | 2 |
| Eval/A-B (×1.5) | 1 | 4 | **5** | 5 | 3 |
| Effort (lower=higher) (×1.5) | 5 | 4 | **3** | 2 | 4 |
| Footprint (×1) | 5 | 4 | **4** | 3 | 4 |
| Multimodal fit (×1) | 2 | 4 | **4** | 4 | 3 |
| **Weighted / 95** | 2.0 | 3.7 | **≈4.5** | 3.6 | 3.4 |

**Decision: ③ hybrid.** ④ external SaaS is eliminated by offline-first (R3, ×3) despite strong iteration/eval — a network-dependent prompt backend contradicts the product's local-first core. ① is the unmaintainable status quo. ⑤ loses on type-safety. ② is the right *foundation* but weak on R4/R5 — so it becomes **Phase 1** of ③.

---

## 3. Architecture

Reuse the exact pattern BYOK/services already establish: a domain module + a service in `ServiceRegistry` with a local impl now and a `remote/` seam for the future server.

```
src/prompts/
  types.ts                        # PromptDefinition, PromptVersion, RenderedPrompt, PromptRef, zod schemas
  registry.ts                     # in-code catalog: Map<id, PromptVersion[]> + resolve(id, version?)
  render.ts                       # template + typed variable interpolation (zod-validated inputs)
  catalog/
    ui-asset-deconstruction.ts    # THIS prompt → v1.0.0 (see §5)
    index.ts                      # registers all built-in definitions
src/services/ai/
  prompt-service.local.ts         # PromptService: list/get/resolve/render (+ P2: user overrides via Tauri store)
  # remote/ (P3) — future server-backed prompt delivery, same interface
```

Resolution order (a prompt request → concrete text):
```
user override (P2, Tauri store)  →  built-in pinned version (if PromptRef.version)  →  built-in latest
```

## 4. Types (the contract)

```ts
// src/prompts/types.ts
export type PromptScenario = 'ui-deconstruction' | 'generation' | 'infill' | string
export type PromptModality = 'text' | 'vision' | 'image-generation'

export interface ModelHints {                 // advisory, not binding
  kind?: ProviderKind                          // reuse services/ai provider-types
  model?: string
  temperature?: number
  modality: PromptModality
}

export interface PromptVersion<V extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string                                   // 'ui-asset-deconstruction'
  version: string                              // semver '1.0.0'
  description: string
  scenario: PromptScenario
  hints: ModelHints
  inputSchema: V                               // zod schema for template variables
  /** Pure render: validated vars → the system instruction (+ optional message scaffold). */
  render(vars: z.infer<V>): RenderedPrompt
  metadata?: Record<string, string>            // author, createdAt (passed in — no Date.now in pure code)
}

export interface RenderedPrompt {
  system: string                               // the model instruction
  // multimodal input is supplied at call time (the image), not baked into the prompt:
  userScaffold?: PromptPart[]                   // optional extra user-message parts (text framing)
}

export type PromptPart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: Uint8Array | string }  // caller injects the screenshot

export interface PromptRef { id: string; version?: string; variables?: Record<string, unknown> }

export interface PromptService {
  list(): Promise<PromptSummary[]>                        // id, latest version, scenario, description
  versions(id: string): Promise<string[]>
  resolve(ref: PromptRef): Promise<PromptVersion>         // applies override→pinned→latest
  render(ref: PromptRef): Promise<RenderedPrompt>         // resolve + zod-validate + render
  // P2: setOverride(id, text)/clearOverride(id)/getOverrideStatus(id) via Tauri store
}
```

`PromptService` joins `ServiceRegistry` next to `providers`/`generation`; wired in `createLocalRegistry` + `bootstrap.ts`; consumed via `useServices().prompts`.

## 5. This prompt as a catalog entry (v1.0.0)

`catalog/ui-asset-deconstruction.ts` encodes the user's "Senior UI Asset Deconstruction Artist" prompt verbatim as the `system` text, with:
- `scenario: 'ui-deconstruction'`, `hints: { modality: 'image-generation', kind: 'google', model: <image model>, temperature: low }`
- `inputSchema: z.object({})` for v1 (no template vars yet — the only runtime input is the screenshot image, injected as a `PromptPart` at call time, not a template var).
- The full instruction (visual decomposition, forbidden behaviors, asset-rebuild rules, best-for-cutout background, layout regions, SOTA quality bar) lives as the versioned `system` string. Future edits ship as v1.1.0 / v2.0.0 — old versions retained.

**The through-line:** its output ("UI Asset Sheet" — regenerated, cutout-friendly background) is exactly the input Cutout's existing pixel pipeline expects → `prompt → generation → cutout` is one AI-Native chain, not a bolt-on.

## 6. Generation integration (multimodal extension)

Today `GenerateInput = { providerId, model?, prompt: string, signal? }` (text-only). Extend without breaking:

```ts
export interface GenerateInput {
  providerId: string
  model?: string
  signal?: AbortSignal
  // exactly one of:
  prompt?: string                        // raw (back-compat)
  promptRef?: PromptRef                   // resolved+rendered via PromptService → system
  system?: string                         // explicit override
  input?: PromptPart[]                    // multimodal user content (e.g. the screenshot)
}
// GenerationService gains: generateImages(input): Promise<Result<GeneratedAsset[]>>  // result.files
```

Flow: `promptRef` → `PromptService.render()` → `{ system }` → AI SDK `generateText({ model, system, messages:[{role:'user', content: input}] })`; for image output read `result.files` (AI SDK v6 image path). The provider/key path is unchanged (still the Rust auth-proxy from BYOK).

## 7. Versioning & override model

- **Built-ins**: semver per `id`; catalog holds an array of versions; `latest` = highest semver. Old versions never deleted (rollback/attribution/eval).
- **Override (P2)**: a user-edited prompt body persisted in the Tauri store (`prompts.json`, non-secret) keyed by `id`; takes precedence over built-ins; clearable to revert. Never overwrites the shipped source.
- **Attribution**: callers may log which `(id, version | 'override')` produced an output (for eval/telemetry later) — the ref is the stable handle.

## 8. File-tree additions

```
src/prompts/{types.ts,registry.ts,render.ts}
src/prompts/catalog/{index.ts,ui-asset-deconstruction.ts}
src/services/ai/prompt-service.local.ts        # + register in services/types.ts, context.ts, bootstrap.ts
src/services/ai/generation-service.local.ts    # extend for system/messages/images (multimodal)
src/hooks/queries/prompts.ts                    # P2 UI: usePrompts/usePromptVersions/useSetOverride
src/components/settings/PromptStudio*.tsx       # P2: view/edit/version prompts (like the provider dialog)
src-tauri (P2): prompts.json store commands OR reuse plugin-store from JS
tests: src/prompts/*.test.ts (registry resolve, render+zod, semver ordering)
```

## 9. Phased plan

- **P1 (now):** `prompts/` domain (types, registry, render) + `PromptService.local` (built-ins only, no override) + `ui-asset-deconstruction` v1.0.0 + `GenerateInput` multimodal extension + `generateImages` on GenerationService + registry/render unit tests. Build+test green. (This is archetype ② — the foundation.)
- **P2:** runtime override layer (Tauri store) + Prompt Studio UI in Settings + query hooks.
- **P3:** eval hooks (wire to eval-harness; score a version against fixtures) + `remote/` PromptService (server-delivered prompts, same interface — the future-server seam).

## 10. Testing

- `registry.resolve`: latest vs pinned version; unknown id/version errors; semver ordering.
- `render`: zod rejects bad vars; deterministic system output; immutability.
- `ui-asset-deconstruction`: v1.0.0 renders the full instruction; hints correct.
- (P2) override precedence: override > pinned > latest; clear reverts.

## 11. Open assumptions to verify

| # | Assumption | Check |
|---|---|---|
| 1 | AI SDK v6 multimodal input: image passed as a `{type:'image', image}` content part in a user message to `generateText` | ai-sdk.dev messages docs |
| 2 | Image-generation output arrives in `result.files` for the chosen model | ai-sdk.dev image docs |
| 3 | The image model slug (via BYOK provider/gateway) for a vision→image task | provider/gateway model list |
| 4 | Tauri `plugin-store` reuse for `prompts.json` (P2) — already added for i18n | installed plugin-store |

## 12. Risks & mitigations

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| 1 | Multimodal generation API drift (AI SDK v6 image path) | MED | isolate in `generation-service.local`; verify §11 before P1 coding |
| 2 | Prompt text drift between shipped source and user override confusion | LOW | override is explicit + clearable + status-badged; source is canonical |
| 3 | Over-engineering P2/P3 before a real second prompt exists | LOW | ship P1 only now; P2/P3 gated on actual need (YAGNI) |
| 4 | Someone puts prompts in i18n later | LOW | §1 hard rule documented; prompts are English-canonical assets |
```
