/**
 * Local `ProviderService` (spec §5 / §6) — the Tauri bridge.
 *
 * Provider config (non-secret) is persisted via `load_providers`/`save_providers`;
 * secrets go straight to the OS keychain via `set_key` and are never held in JS.
 * `test()` reuses the already-loaded config to run a tiny generation through the
 * proxy — no extra round-trip, and no import cycle (it constructs a generation
 * service from the local config, not from the registry).
 */
import { invoke } from '@tauri-apps/api/core'
import { err, isOk, ok } from '@/services/types'
import type { Result } from '@/services/types'
import type { ProviderService } from './types'
import {
  providerConfigsSchema,
  type ProviderConfig,
  type ProviderDraft,
} from './provider-types'
import { createLocalGenerationService } from './generation-service.local'

/** Row shape returned by the Rust `list_key_status` command. */
interface KeyStatusRow {
  readonly id: string
  readonly hasKey: boolean
}

/** Load + validate the persisted provider list (missing file → `[]` in Rust). */
async function loadProviders(): Promise<ProviderConfig[]> {
  const raw = await invoke<unknown>('load_providers')
  return providerConfigsSchema.parse(raw)
}

/** Persist the full provider list (non-secret JSON). */
async function saveProviders(providers: readonly ProviderConfig[]): Promise<void> {
  await invoke('save_providers', { providers })
}

/** Normalize a draft into a stored config (id generated on create). */
function materialize(draft: ProviderDraft): ProviderConfig {
  return {
    id: draft.id ?? crypto.randomUUID(),
    kind: draft.kind,
    label: draft.label,
    defaultModel: draft.defaultModel,
    enabled: draft.enabled,
    // Omit `baseUrl` entirely when absent (matches Rust's serde skip).
    ...(draft.baseUrl ? { baseUrl: draft.baseUrl } : {}),
  }
}

export function createLocalProviderService(): ProviderService {
  return {
    list: loadProviders,

    async upsert(draft: ProviderDraft): Promise<ProviderConfig> {
      const next = materialize(draft)
      const list = await loadProviders()
      const exists = list.some((p) => p.id === next.id)
      const updated = exists
        ? list.map((p) => (p.id === next.id ? next : p))
        : [...list, next]
      await saveProviders(updated)
      return next
    },

    async remove(id: string): Promise<void> {
      const list = await loadProviders()
      await saveProviders(list.filter((p) => p.id !== id))
      // Delete the secret too; Rust treats a missing key as success.
      await invoke('delete_key', { providerId: id })
    },

    async setKey(id: string, secret: string): Promise<void> {
      // The secret leaves JS here and is never returned or stored in state.
      await invoke('set_key', { providerId: id, secret })
    },

    async status(id: string): Promise<{ hasKey: boolean }> {
      const hasKey = await invoke<boolean>('key_status', { providerId: id })
      return { hasKey }
    },

    async statuses(ids: readonly string[]): Promise<Record<string, boolean>> {
      if (ids.length === 0) return {}
      const rows = await invoke<KeyStatusRow[]>('list_key_status', {
        providerIds: [...ids],
      })
      return Object.fromEntries(rows.map((r) => [r.id, r.hasKey]))
    },

    async test(id: string): Promise<Result<{ model: string }>> {
      const list = await loadProviders()
      const cfg = list.find((p) => p.id === id)
      if (!cfg) return err('provider not configured')

      // Prefer a MODEL-AGNOSTIC probe for endpoints with an explicit base URL
      // (openai-compatible / relays): GET `{baseUrl}/models` validates the key +
      // base URL without depending on the model being a chat model — a chat
      // `ping` would falsely fail for an image model (e.g. gpt-image). The raw
      // HTTP status is surfaced so 404 (base URL / missing `/v1`) vs 401 (key)
      // is obvious.
      if (cfg.baseUrl) {
        try {
          const url = `${cfg.baseUrl.replace(/\/+$/, '')}/models`
          const res = await invoke<{ status: number; body: string }>(
            'ai_proxy_request',
            { providerId: id, kind: cfg.kind, url, method: 'GET', headers: {}, body: null },
          )
          if (res.status >= 200 && res.status < 300) {
            return ok({ model: cfg.defaultModel })
          }
          const snippet = res.body.replace(/\s+/g, ' ').trim().slice(0, 140)
          return err(`HTTP ${res.status}${snippet ? ` · ${snippet}` : ''}`)
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error))
        }
      }

      // Vendor kinds without a base URL: a tiny text round-trip. Resolve config
      // from the list we already hold — no extra invoke, no import cycle.
      const generation = createLocalGenerationService({ list: async () => list })
      const result = await generation.generateText({
        providerId: id,
        model: cfg.defaultModel,
        prompt: 'ping',
      })
      return isOk(result) ? ok({ model: cfg.defaultModel }) : err(result.error)
    },
  }
}
