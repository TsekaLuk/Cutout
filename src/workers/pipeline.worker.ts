/// <reference lib="webworker" />
import { runPipeline, PipelineAbortError } from '@/algorithm/runPipeline'
import type { WorkerRequest, WorkerResponse, SliceOut } from './protocol'
import {
  bitmapToFrame,
  renderFrameCanvas,
  cropSlicePng,
} from './render.worker-side'

/**
 * Worker entry (spec §4b / §6).
 *
 * Holds the uploaded source bitmaps keyed by `imageId`. Each `analyze` derives a
 * FRESH `PixelFrame` from the stored bitmap (the pipeline mutates the frame in
 * place, so re-runs must start from clean pixels), runs the pure pipeline, and
 * posts a fast `preview` then, if requested, the heavy `slices`. A per-run
 * `AbortController` lets a newer run supersede an in-flight one.
 */

const bitmaps = new Map<string, ImageBitmap>()
const controllers = new Map<number, AbortController>()

const ctx = self as unknown as DedicatedWorkerGlobalScope

function post(response: WorkerResponse, transfer?: Transferable[]): void {
  if (transfer && transfer.length) ctx.postMessage(response, transfer)
  else ctx.postMessage(response)
}

ctx.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const msg = event.data
  switch (msg.type) {
    case 'loadImage':
      handleLoadImage(msg.imageId, msg.bitmap)
      break
    case 'analyze':
      void handleAnalyze(msg.runId, msg.imageId, msg.params, msg.wantSlices)
      break
    case 'cancel':
      controllers.get(msg.runId)?.abort()
      break
  }
}

function handleLoadImage(imageId: string, bitmap: ImageBitmap): void {
  bitmaps.get(imageId)?.close()
  bitmaps.set(imageId, bitmap)
}

async function handleAnalyze(
  runId: number,
  imageId: string,
  params: Parameters<typeof runPipeline>[1],
  wantSlices: boolean,
): Promise<void> {
  const bitmap = bitmaps.get(imageId)
  if (!bitmap) {
    post({ type: 'error', runId, message: `Unknown imageId: ${imageId}` })
    return
  }

  const controller = new AbortController()
  controllers.set(runId, controller)

  try {
    const frame = bitmapToFrame(bitmap)
    const { boxes } = runPipeline(frame, params, controller.signal)

    // Fast path: preview bitmap + box outlines. Render once, reuse for crops.
    const fullCanvas = renderFrameCanvas(frame)
    const preview = fullCanvas.transferToImageBitmap()
    post({ type: 'preview', runId, full: preview, boxes }, [preview])

    if (!wantSlices) return

    // Heavy path: re-render (preview transferred the previous bitmap away) and
    // encode a PNG per box.
    const cropSource = renderFrameCanvas(frame)
    const slices: SliceOut[] = []
    for (let index = 0; index < boxes.length; index += 1) {
      if (controller.signal.aborted) {
        post({ type: 'canceled', runId })
        return
      }
      const box = boxes[index]
      const png = await cropSlicePng(cropSource, box)
      slices.push({
        id: crypto.randomUUID(),
        index,
        box,
        png,
        width: box.width,
        height: box.height,
      })
    }
    post({ type: 'slices', runId, slices })
  } catch (error) {
    if (error instanceof PipelineAbortError || controller.signal.aborted) {
      post({ type: 'canceled', runId })
    } else {
      post({
        type: 'error',
        runId,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  } finally {
    controllers.delete(runId)
  }
}
