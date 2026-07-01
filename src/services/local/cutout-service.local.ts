/**
 * Local cutout service (spec §5).
 *
 * The interactive live-preview loop is driven push-style by `useAnalysisBridge`
 * straight into the store. This service is the request/response FORM of the same
 * capability — a one-shot `run()` that resolves a full {@link CutoutResult}. It
 * exists so the seam matches the future cloud cutout API (which will be a
 * request/response call); v1 fulfils it with the same Web Worker.
 *
 * It owns its own analyze round-trip: upload the bitmap, request slices, and
 * resolve on the matching `slices` response (or reject on `error`).
 */
import type {
  WorkerRequest,
  WorkerResponse,
  SliceOut,
} from '@/workers/protocol'
import type {
  CutoutResult,
  CutoutRunInput,
  CutoutService,
  CutoutSlice,
  Result,
} from '@/services/types'
import { err, ok } from '@/services/types'

function toSlice(out: SliceOut): CutoutSlice {
  return {
    id: out.id,
    index: out.index,
    box: out.box,
    png: out.png,
    width: out.width,
    height: out.height,
  }
}

export function createLocalCutoutService(worker: Worker): CutoutService {
  let nextRunId = 0

  function run(input: CutoutRunInput): Promise<Result<CutoutResult>> {
    const runId = (nextRunId += 1)
    const imageId = crypto.randomUUID()

    return new Promise<Result<CutoutResult>>((resolve) => {
      const onMessage = (event: MessageEvent<WorkerResponse>): void => {
        const msg = event.data
        if (msg.runId !== runId) return
        switch (msg.type) {
          case 'slices':
            cleanup()
            resolve(ok({ slices: msg.slices.map(toSlice) }))
            break
          case 'error':
            cleanup()
            resolve(err(msg.message))
            break
          case 'canceled':
            cleanup()
            resolve(err('Cutout canceled'))
            break
          // `preview` / `progress` are ignored in the one-shot form.
        }
      }

      const onAbort = (): void => {
        post({ type: 'cancel', runId })
      }

      function cleanup(): void {
        worker.removeEventListener('message', onMessage)
        input.signal?.removeEventListener('abort', onAbort)
      }

      function post(req: WorkerRequest, transfer?: Transferable[]): void {
        if (transfer) worker.postMessage(req, transfer)
        else worker.postMessage(req)
      }

      worker.addEventListener('message', onMessage)
      input.signal?.addEventListener('abort', onAbort, { once: true })

      // Upload the bitmap once, then request a full (with-slices) analyze.
      post({ type: 'loadImage', imageId, bitmap: input.bitmap }, [input.bitmap])
      post({
        type: 'analyze',
        runId,
        imageId,
        params: input.params,
        wantSlices: true,
      })
    })
  }

  return { run }
}
