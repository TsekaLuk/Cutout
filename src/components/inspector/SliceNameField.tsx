/**
 * SliceNameField (spec §4c / §6 step 5) — inline rename for the selected slice.
 *
 * Enter commits (store sanitizes + ensures `.png`); Esc reverts to the committed
 * name and blurs. Local draft state keeps typing snappy; we sync it when the
 * selection changes. A rename intent (hotkey / card action / double-click)
 * focuses + selects the field.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRenameIntent } from '@/hooks/useRenameIntent'
import type { Slice } from '@/store/types'

export interface SliceNameFieldProps {
  readonly slice: Slice
}

export function SliceNameField({ slice }: SliceNameFieldProps) {
  const renameSlice = useStore((s) => s.renameSlice)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState(slice.name)

  // Resync the draft whenever the selected slice or its committed name changes.
  useEffect(() => {
    setDraft(slice.name)
  }, [slice.id, slice.name])

  const focusSelect = useCallback(
    (sliceId: string): void => {
      if (sliceId !== slice.id) return
      const input = inputRef.current
      if (!input) return
      input.focus()
      input.select()
    },
    [slice.id],
  )
  useRenameIntent(focusSelect)

  const commit = useCallback((): void => {
    if (draft.trim().length === 0) {
      setDraft(slice.name)
      return
    }
    renameSlice(slice.id, draft)
  }, [draft, renameSlice, slice.id, slice.name])

  return (
    <div className="grid gap-1">
      <Label htmlFor="slice-name" className="text-[10px] tracking-wide text-muted-foreground uppercase">
        Name
      </Label>
      <Input
        id="slice-name"
        ref={inputRef}
        value={draft}
        spellCheck={false}
        autoComplete="off"
        className="h-8 font-mono text-xs"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
            inputRef.current?.blur()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setDraft(slice.name)
            inputRef.current?.blur()
          }
        }}
      />
    </div>
  )
}
