/**
 * Slice keyboard navigation (spec §4c keyboard map).
 *
 * Resolves `[` / `]` (prev/next in reading order) and arrow-key grid moves into
 * `selectSlice` calls. Grid geometry (columns) is read from the rendered cards'
 * layout via a columns estimate passed in, so up/down jump a row. Returns stable
 * handlers for `useHotkeys`.
 */
import { useCallback } from 'react'
import { useStore } from '@/store'
import { useSlices } from '@/store/selectors'

/** Estimate the current grid column count from the DOM (falls back to 2). */
function currentColumns(): number {
  const cards = document.querySelectorAll<HTMLElement>('[data-slice-id]')
  if (cards.length < 2) return 1
  const firstTop = cards[0].offsetTop
  let cols = 1
  for (let i = 1; i < cards.length; i += 1) {
    if (cards[i].offsetTop !== firstTop) break
    cols += 1
  }
  return Math.max(1, cols)
}

export interface SliceNavigation {
  prev(): void
  next(): void
  move(dir: 'up' | 'down' | 'left' | 'right'): void
}

export function useSliceNavigation(): SliceNavigation {
  const slices = useSlices()
  const selectSlice = useStore((s) => s.selectSlice)

  const indexOfSelected = useCallback((): number => {
    return slices.findIndex((s) => s.selected)
  }, [slices])

  const selectAt = useCallback(
    (index: number): void => {
      if (slices.length === 0) return
      const clamped = Math.max(0, Math.min(slices.length - 1, index))
      selectSlice(slices[clamped].id)
    },
    [slices, selectSlice],
  )

  const step = useCallback(
    (delta: number): void => {
      const current = indexOfSelected()
      selectAt(current < 0 ? 0 : current + delta)
    },
    [indexOfSelected, selectAt],
  )

  const move = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right'): void => {
      const current = indexOfSelected()
      if (current < 0) {
        selectAt(0)
        return
      }
      const cols = currentColumns()
      const delta =
        dir === 'left' ? -1 : dir === 'right' ? 1 : dir === 'up' ? -cols : cols
      selectAt(current + delta)
    },
    [indexOfSelected, selectAt],
  )

  return {
    prev: useCallback(() => step(-1), [step]),
    next: useCallback(() => step(1), [step]),
    move,
  }
}
