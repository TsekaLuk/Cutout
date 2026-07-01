/**
 * Analysis bridge (spec §5 / §6) — the store ⇄ worker glue.
 *
 * Owns the single pipeline Worker instance and routes its push responses into
 * the Zustand store:
 *   - `preview` → `applyPreview` (store closes the superseded bitmap)
 *   - `slices`  → `applyAnalysisResult` (store revokes replaced objectUrls)
 *   - `error`   → `failAnalysis`
 * All three store actions internally drop stale `runId`s AND release the
 * incoming GPU/URL resources, so this file just forwards.
 *
 * The worker needs its OWN copy of the source bitmap (a transferred bitmap is
 * detached from the main thread, but the store still displays `source.bitmap`
 * in the SourceCanvas). So each new `imageId` is uploaded as a fresh clone.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useStore, getStoreState } from '@/store'
import type { WorkerResponse } from '@/workers/protocol'
import type { AnalysisResult } from '@/store/types'

/** The trigger returned to callers (e.g. `useParamAutoRun`). */
export interface AnalysisBridge {
  /** Begin a run for the current params; `wantSlices` gates the heavy path. */
  analyze(wantSlices: boolean): void
}

function createPipelineWorker(): Worker {
  return new Worker(new URL('@/workers/pipeline.worker.ts', import.meta.url), {
    type: 'module',
  })
}

export function useAnalysisBridge(): AnalysisBridge {
  const workerRef = useRef<Worker | null>(null)
  // Track which imageId the worker already holds, to upload each source once.
  const uploadedImageIdRef = useRef<string>('')

  const beginAnalysis = useStore((s) => s.beginAnalysis)
  const applyPreview = useStore((s) => s.applyPreview)
  const applyResult = useStore((s) => s.applyAnalysisResult)
  const failAnalysis = useStore((s) => s.failAnalysis)

  // Create the worker once; wire message routing; terminate on unmount.
  useEffect(() => {
    const worker = createPipelineWorker()
    workerRef.current = worker

    const onMessage = (event: MessageEvent<WorkerResponse>): void => {
      const msg = event.data
      switch (msg.type) {
        case 'preview':
          applyPreview(msg.runId, msg.full)
          break
        case 'slices': {
          const result: AnalysisResult = {
            slices: msg.slices.map((s) => ({
              id: s.id,
              index: s.index,
              box: s.box,
              blob: s.png,
              width: s.width,
              height: s.height,
            })),
          }
          applyResult(msg.runId, result)
          break
        }
        case 'error':
          failAnalysis(msg.runId, msg.message)
          break
        // `progress` / `canceled` need no store change here.
      }
    }

    worker.addEventListener('message', onMessage)
    return () => {
      worker.removeEventListener('message', onMessage)
      worker.terminate()
      workerRef.current = null
      uploadedImageIdRef.current = ''
    }
  }, [applyPreview, applyResult, failAnalysis])

  const analyze = useCallback(
    (wantSlices: boolean): void => {
      const worker = workerRef.current
      if (!worker) return
      const { source } = getStoreState()
      if (!source.bitmap || !source.imageId) return

      const runId = beginAnalysis()

      const dispatch = (): void => {
        worker.postMessage({
          type: 'analyze',
          runId,
          imageId: source.imageId,
          params: getStoreState().params,
          wantSlices,
        })
      }

      // Upload a fresh clone the first time we see this imageId, then analyze.
      if (uploadedImageIdRef.current !== source.imageId) {
        const imageId = source.imageId
        void createImageBitmap(source.bitmap).then((clone) => {
          if (workerRef.current !== worker) {
            clone.close()
            return
          }
          worker.postMessage({ type: 'loadImage', imageId, bitmap: clone }, [
            clone,
          ])
          uploadedImageIdRef.current = imageId
          dispatch()
        })
      } else {
        dispatch()
      }
    },
    [beginAnalysis],
  )

  return { analyze }
}
