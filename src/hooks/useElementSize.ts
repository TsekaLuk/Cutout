/**
 * Observe an element's content-box size via `ResizeObserver`.
 *
 * Returns a ref to attach and the latest `{ width, height }` in CSS pixels.
 * Used by the fit-to-pane canvases so they re-blit when a resizable pane moves.
 */
import { useEffect, useRef, useState } from 'react'

export interface Size {
  readonly width: number
  readonly height: number
}

export function useElementSize<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>
  size: Size
} {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const box = entry.contentRect
      setSize({ width: box.width, height: box.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
