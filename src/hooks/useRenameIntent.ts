/**
 * Rename intent bus.
 *
 * Renaming a slice happens in the inspector's `SliceNameField`, but the trigger
 * can come from three places: the ⌘/Enter hotkey, a card's hover "Rename"
 * action, or double-clicking a card. Rather than lift a ref through the whole
 * tree, those callers "request" a rename and the field subscribes. It is a tiny
 * event emitter (module singleton) — no store churn for a transient UI signal.
 */
import { useEffect } from 'react'

type Listener = (sliceId: string) => void

const listeners = new Set<Listener>()

/** Ask the inspector to focus + select the name field for `sliceId`. */
export function requestRename(sliceId: string): void {
  for (const listener of listeners) listener(sliceId)
}

/** Subscribe to rename requests (the name field uses this). */
export function useRenameIntent(onRequest: Listener): void {
  useEffect(() => {
    listeners.add(onRequest)
    return () => {
      listeners.delete(onRequest)
    }
  }, [onRequest])
}
