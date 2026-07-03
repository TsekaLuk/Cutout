# Cutout — Intent Recognition (open-world, self-derived) Design

**Status:** decided (user-approved) · **Extends:** `2026-07-03-ai-planner-dag-design.md` (Planner → GraphSpec → Executor, shipped) with an **intent layer upstream of the Planner**. · **Depends on:** `GenerationService.generateObject` (chat slot), the DAG (planGraph / GraphSpec / executor), the pipeline canvas. · **Scope:** add an **intent-recognition node** that reconstructs + mines the user's true intent from a vague brief and feeds an enriched, self-derived understanding into the Planner. **Not** a fixed-taxonomy router.

---

## 1. First principles

The highest-leverage point in the whole pipeline is **before any (expensive) image generation**: understanding what the user *actually* wants. Input is guaranteed vague/incomplete ("卡通手办商城"). So the most essential enhancement is not prompt-rewriting but **intent mining** — reconstructing the true goal and surfacing the unstated.

**No fixed taxonomy.** Research (Intent Discovery / IntentGPT meta-prompting; routing-strategy surveys) shows a fixed enum of routes is brittle: it mis-routes novel/compositional/incompletely-expressed intents. The AI-native approach is **open-world, self-derived**: the agent derives its own understanding + strategy from the intent itself, rather than picking from a menu. Grounding: our small primitive node vocabulary + graph validation are the guardrails, so free composition doesn't become brittle (our scale is a few primitives, not 400 tools).

**Autonomous, ask only when uncertain.** Default is autonomous (recognize → compose → run), surfacing the derived intent non-blockingly; the agent poses clarifying questions ONLY when its confidence is low / the request is out-of-scope — the open-world safety valve — instead of guessing.

## 2. The intent layer

```
需求(vague) ─►[intent: 开放世界重建+挖掘+自派生策略]─►[Planner: 自由组 GraphSpec]─► 设计系统 ─► fan-out ─► ...
                 │ IntentProfile (open, self-derived) — feeds the Planner; the graph shape is the emergent "route"
                 └ low confidence / out-of-scope → surface questions instead of running
```

The intent node runs first; its `IntentProfile` enriches `planGraph`. The Planner (already free-composing) shapes the graph from the enriched intent — **the graph topology IS the emergent classification** (no route enum anywhere).

## 3. IntentProfile (open, self-derived — the contract)

`src/dag/intent-types.ts` (zod):
```ts
interface IntentDimension { readonly aspect: string; readonly value: string } // agent CHOOSES the aspects
interface IntentProfile {
  readonly goal: string                       // reconstructed true goal (open)
  readonly strategy: string                   // self-derived approach label (open string, NOT an enum)
  readonly rationale: string                  // why this approach fits the intent
  readonly dimensions: IntentDimension[]       // mined along agent-chosen aspects (domain/audience/deliverables/fidelity/style/constraints/…)
  readonly assumptions: string[]               // gaps the agent filled (transparent, editable)
  readonly confidence: number                  // 0..1 self-estimate
  readonly questions: string[]                 // populated only when confidence is low / ambiguous — else empty
}
```
`intentProfileSchema` (zod) is handed to `generateObject`. Open by design: `strategy` + `dimensions[].aspect` are free text the agent authors, so the "classification" is self-derived, not fixed.

## 4. Prompt — `ui-intent-recognition`

`src/prompts/catalog/ui-intent-recognition.ts` (chat/vision, scenario `intent`, English canonical). Instructs the model, from first principles, to: reconstruct the user's true goal; mine it along whatever dimensions actually matter for THIS request (self-chosen aspects, not a preset list); self-derive a strategy label + rationale; state the assumptions it made; estimate confidence; and produce clarifying questions ONLY when genuinely uncertain / the ask is out of scope (do not interrogate a clear brief). Constrained to the IntentProfile shape.

## 5. Service — `recognizeIntent`

`src/dag/intent.ts`: `recognizeIntent(generation, { providerId, model, brief }) → Result<IntentProfile>` via `generateObject(promptRef=ui-intent-recognition, input=[{type:'text',text:brief}], intentProfileSchema)` on the **chat slot**. Rejects empty briefs; validates output.

## 6. Wiring into the DAG

- **`planGraph` gains an enriched-intent input**: accept an `IntentProfile` (or `{ brief, intent }`) and compose the GraphSpec from the reconstructed goal + strategy + dimensions (not the raw brief). The `ui-graph-planner` prompt is updated to consume the IntentProfile.
- **Run flow (autonomous)**: from the brief, the "识别并生成" action runs `recognizeIntent` → if `confidence` is high and `questions` empty → `planGraph(intent)` → `runGraph`; if low-confidence / questions present → **surface the questions and stop** (no generation) until the user refines the brief / answers. The IntentProfile is displayed either way.
- New node op `intent` in the vocabulary (upstream of `plan`); the intent understanding is attached to the head of the graph.

## 7. UX — transparent-but-non-blocking

`BriefNode` (canvas): after the brief, an "识别意图 / 识别并生成" step. The derived `IntentProfile` renders in a calm, opaque panel on/near the node — goal, self-derived strategy, mined dimensions, assumptions — so the AI's understanding is **visible and editable**, not a black box. When `questions` are present, they render as prompts for the user to answer/refine; generation does not proceed until resolved. Otherwise the flow continues autonomously to plan+generate. Calm/opaque per the project UI rule.

## 8. Phased plan

- **P7a — Intent core**: `intent-types.ts` (+ zod) + `ui-intent-recognition` prompt (+ register + test) + `recognizeIntent` service (+ test with mocked generateObject: high-confidence profile passes through; low-confidence yields questions; empty brief rejected; invalid output rejected).
- **P7b — Wire + UX**: `planGraph` consumes the IntentProfile (update prompt + planner + tests); the brief-run flow (recognize → questions? → plan → run) in `hooks/queries/dag.ts`; `BriefNode` shows the IntentProfile + questions; i18n.

## 9. Risks & mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | Open schema → the agent emits junk aspects | zod validates shape; the planner still validates the resulting GraphSpec (acyclic/dangling); free text is fine — it only guides composition |
| 2 | Confidence miscalibration (asks too much / too little) | prompt: ask ONLY when genuinely ambiguous; a low threshold (e.g. < 0.5) gates questions; the user can always proceed anyway |
| 3 | Extra LLM step adds latency/cost | one cheap text call on the chat slot before the expensive image fan-out — net win (avoids garbage generation); reuse the same slot |
| 4 | Black-box feel | IntentProfile is surfaced + editable in the BriefNode panel (transparency without a modal gate) |
| 5 | Needs a chat/vision model | gate on the chat slot with the existing CTA; if unset, fall back to planning from the raw brief (skip intent) |
