/**
 * App bootstrap — build the service registry once (spec §5).
 *
 * The registry's `CutoutService` is the request/response FORM of the pipeline
 * (the future cloud-cutout seam). It gets its OWN worker, scoped to one-shot
 * `run()` calls, kept distinct from the live-preview worker that
 * `useAnalysisBridge` owns inside AppShell. Two workers, each with a single
 * clear job — coherent per spec §4b/§5 (live drag vs. API-shaped call).
 *
 * `AssetRepository` (export) and `SessionService` (stub) round out the registry;
 * both are worker-independent. A future backend swaps `createLocalRegistry` for
 * a `createRemoteRegistry` here and nothing downstream changes.
 */
import { createLocalRegistry } from '@/services/context'
import type { ServiceRegistry } from '@/services/types'

/** The dedicated worker backing the registry's one-shot `CutoutService.run()`. */
function createServiceWorker(): Worker {
  return new Worker(new URL('@/workers/pipeline.worker.ts', import.meta.url), {
    type: 'module',
  })
}

/**
 * Create the app's service registry (memoized by the caller via `useState`/
 * module scope so it — and its worker — are built exactly once).
 */
export function createRegistry(): ServiceRegistry {
  return createLocalRegistry(createServiceWorker())
}
