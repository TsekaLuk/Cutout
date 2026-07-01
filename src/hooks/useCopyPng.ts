/**
 * Copy a slice's PNG to the clipboard (spec §4c productization: copy-PNG).
 *
 * Uses the async Clipboard API's `ClipboardItem`. Not all WebViews expose it;
 * callers get a toast either way. Returns a stable async copier.
 */
import { useCallback } from 'react'
import { toast } from 'sonner'

export function useCopyPng(): (blob: Blob, label: string) => Promise<void> {
  return useCallback(async (blob: Blob, label: string): Promise<void> => {
    try {
      const clipboard = navigator.clipboard
      if (!clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard image copy is not supported here.')
      }
      await clipboard.write([new ClipboardItem({ 'image/png': blob })])
      toast.success(`Copied ${label}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not copy image',
      )
    }
  }, [])
}
