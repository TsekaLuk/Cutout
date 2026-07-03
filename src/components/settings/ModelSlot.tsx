/**
 * ModelSlot (design spec §4b) — assign one model to an output-modality slot.
 *
 * Pick an endpoint + a model. The model field is a free-text input backed by a
 * datalist whose suggestions come from the in-repo `SUGGESTED_MODELS` for the
 * chosen endpoint's kind unioned with its discovered `/v1/models` (relays). The
 * choice persists instantly (plugin-store) via `useSetModelAssignment`.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import type { SlotId } from '@/services/ai/model-assignment-types'
import { SUGGESTED_MODELS, POPULAR_MODELS } from '@/services/ai/models'
import { useProviders } from '@/hooks/queries/providers'
import {
  useModelAssignments,
  useSetModelAssignment,
  useEndpointModels,
} from '@/hooks/queries/ai-settings'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ModelSlotProps {
  readonly slot: SlotId
  readonly label: ReactNode
  readonly hint?: ReactNode
}

export function ModelSlot({ slot, label, hint }: ModelSlotProps) {
  const { t } = useLingui()
  const providers = useProviders()
  const assignments = useModelAssignments()
  const setAssignment = useSetModelAssignment()

  const list = providers.data ?? []
  const current = assignments.data?.[slot]

  const [providerId, setProviderId] = useState('')
  const [model, setModel] = useState('')

  // With exactly one endpoint, pre-select it — the same connection (one key)
  // serves every slot; models are chosen per capability, not per provider.
  const soleProviderId = list.length === 1 ? list[0].id : ''
  const currentProviderId = current?.providerId
  const currentModel = current?.model

  // Sync fields when the persisted assignment (re)loads; default an unset slot
  // to the sole endpoint with the model left blank (picked from /v1/models below).
  // Depends on the assignment's fields (not the query object identity, which
  // changes each render) so it doesn't re-run on every fetch.
  useEffect(() => {
    if (currentProviderId !== undefined) {
      setProviderId(currentProviderId)
      setModel(currentModel ?? '')
    } else {
      setProviderId(soleProviderId)
      setModel('')
    }
  }, [currentProviderId, currentModel, soleProviderId])

  const selected = list.find((p) => p.id === providerId)
  const endpointModels = useEndpointModels(selected)

  // Relays / gateways proxy many upstreams → offer the curated mainstream list;
  // direct vendors offer their own. Union with the endpoint's discovered models.
  const curated = selected
    ? selected.kind === 'openai-compatible' || selected.kind === 'gateway'
      ? POPULAR_MODELS
      : SUGGESTED_MODELS[selected.kind]
    : []
  const suggestions = Array.from(
    new Set([
      ...curated,
      ...(endpointModels.data ?? []),
      ...(model.trim() ? [model.trim()] : []),
    ]),
  )

  const commit = (pid: string, m: string) => {
    if (pid && m.trim()) {
      setAssignment.mutate({
        slot,
        assignment: { providerId: pid, model: m.trim() },
      })
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-3">
        <div className="text-sm font-medium">{label}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <Trans id="settings.model_no_provider">
            Add an endpoint above to assign a model.
          </Trans>
        </p>
      </div>
    )
  }

  const listId = `models-${slot}`

  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-3">
      <div className="text-sm font-medium">{label}</div>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <Select
          value={providerId || undefined}
          onValueChange={(value) => {
            // Switching endpoint keeps the typed model — a connection isn't tied
            // to one model; the model is chosen per capability from the list below.
            setProviderId(value)
            commit(value, model)
          }}
        >
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue
              placeholder={t({
                id: 'settings.model_pick_endpoint',
                message: 'Endpoint',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            {list.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          list={listId}
          value={model}
          disabled={!providerId}
          onChange={(e) => setModel(e.target.value)}
          onBlur={() => commit(providerId, model)}
          placeholder={t({
            id: 'settings.model_slug_placeholder',
            message: 'model',
          })}
          className="font-mono"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <datalist id={listId}>
          {suggestions.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
    </div>
  )
}
