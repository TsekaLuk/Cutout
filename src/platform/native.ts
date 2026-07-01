/**
 * Native platform bridge — the ONLY module allowed to import `@tauri-apps/api`.
 *
 * Everything above (services, hooks, components) depends on the `NativeBridge`
 * interface, so tests inject a fake and no Tauri runtime is required. See spec §4a.
 */
import { invoke } from '@tauri-apps/api/core'

/** One asset to persist. `bytes` (raw PNG) is primary; `dataUrl` is a fallback. */
export interface SaveAssetInput {
  name: string
  bytes?: Uint8Array
  dataUrl?: string
}

/** A single file that failed to write, mirrored from the Rust `FailedWrite`. */
export interface FailedWrite {
  name: string
  error: string
}

/** Result of a save operation, mirrored from the Rust `SaveAssetsResult`. */
export interface SaveAssetsResult {
  canceled: boolean
  outputDir: string | null
  count: number
  failed: FailedWrite[]
}

export interface NativeBridge {
  saveAssets(assets: SaveAssetInput[]): Promise<SaveAssetsResult>
}

/**
 * Transport shape: `Uint8Array` is converted to a plain `number[]` because
 * `invoke` serializes arguments as JSON. Rust deserializes `Vec<u8>` from it.
 */
interface SaveAssetPayload {
  name: string
  bytes: number[] | null
  dataUrl: string | null
}

function toPayload(asset: SaveAssetInput): SaveAssetPayload {
  return {
    name: asset.name,
    bytes: asset.bytes ? Array.from(asset.bytes) : null,
    dataUrl: asset.dataUrl ?? null,
  }
}

/** Concrete Tauri implementation of {@link NativeBridge}. */
export const tauriBridge: NativeBridge = {
  saveAssets: (assets) =>
    invoke<SaveAssetsResult>('save_assets', {
      assets: assets.map(toPayload),
    }),
}
