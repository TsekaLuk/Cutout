/**
 * ProviderSettingsDialog (spec §7) — BYOK provider management.
 *
 * A controlled shadcn Dialog with two internal views: the provider **list**
 * (status + Test/Edit/Remove per row) and the add/edit **form**. It holds no
 * secret state — every key operation flows through `ProviderForm` → `setKey`
 * straight to Rust. The view resets to the list whenever the dialog closes.
 */
import { useEffect, useState } from 'react'
import { KeyRound, Plus } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import type { ProviderConfig } from '@/services/ai/provider-types'
import { useProviders } from '@/hooks/queries/providers'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProviderRow } from './ProviderRow'
import { ProviderForm } from './ProviderForm'

type View =
  | { readonly mode: 'list' }
  | { readonly mode: 'add' }
  | { readonly mode: 'edit'; readonly provider: ProviderConfig }

interface ProviderSettingsDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function ProviderSettingsDialog({
  open,
  onOpenChange,
}: ProviderSettingsDialogProps) {
  const [view, setView] = useState<View>({ mode: 'list' })
  const providers = useProviders()

  // Always return to the list when the dialog is (re)opened or closed, so a
  // half-finished form never lingers across sessions.
  useEffect(() => {
    if (!open) setView({ mode: 'list' })
  }, [open])

  const isForm = view.mode !== 'list'
  const list = providers.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            {view.mode === 'add' ? (
              <Trans id="settings.add_provider">Add provider</Trans>
            ) : view.mode === 'edit' ? (
              <Trans id="settings.dialog_edit_title">Edit provider</Trans>
            ) : (
              <Trans id="settings.dialog_title">API Keys / Providers</Trans>
            )}
          </DialogTitle>
          <DialogDescription>
            {isForm ? (
              <Trans id="settings.dialog_form_desc">
                Keys are stored only in the system keychain, never written to the
                web page or disk in plaintext.
              </Trans>
            ) : (
              <Trans id="settings.dialog_list_desc">
                Manage model providers and keys (BYOK). Keys are stored securely
                in the system keychain.
              </Trans>
            )}
          </DialogDescription>
        </DialogHeader>

        {view.mode === 'add' && (
          <ProviderForm onDone={() => setView({ mode: 'list' })} />
        )}

        {view.mode === 'edit' && (
          <ProviderForm
            initial={view.provider}
            onDone={() => setView({ mode: 'list' })}
          />
        )}

        {view.mode === 'list' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {providers.isLoading ? (
                <>
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </>
              ) : providers.isError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-6 text-center text-sm text-destructive">
                  <Trans id="settings.load_failed">Failed to load providers</Trans>
                </p>
              ) : list.length === 0 ? (
                <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-3 py-8 text-center">
                  <KeyRound className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    <Trans id="settings.empty_title">
                      No providers configured yet
                    </Trans>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Trans id="settings.empty_desc">
                      Add a provider and enter an API key to start using AI
                      features.
                    </Trans>
                  </p>
                </div>
              ) : (
                list.map((provider) => (
                  <ProviderRow
                    key={provider.id}
                    provider={provider}
                    onEdit={(p) => setView({ mode: 'edit', provider: p })}
                  />
                ))
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setView({ mode: 'add' })}
            >
              <Plus />
              <Trans id="settings.add_provider">Add provider</Trans>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
