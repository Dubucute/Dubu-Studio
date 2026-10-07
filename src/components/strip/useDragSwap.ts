'use client'

/**
 * Drag-to-swap for photos.
 *
 * One hook drives both places photos are shown: the thumbnail roll (capture step) and the
 * strip cells (style step). Pointer events rather than HTML5 drag & drop, so it also works
 * on touch screens where `draggable` does nothing.
 *
 * The consumer does the hit-testing (`findAt`), because a DOM list can ask the document
 * which thumbnail is under the pointer while the canvas strip has to test cell geometry.
 * Transient drag state lives here — photo order itself belongs to the store.
 */
import { useCallback, useRef, useState } from 'react'

interface DragSwapOptions {
  /** Swap two photos by id (store action). */
  onSwap: (fromId: string, toId: string) => void
  /** Client coordinates → id of the photo under them, or null. */
  findAt: (clientX: number, clientY: number) => string | null
}

export function useDragSwap({ onSwap, findAt }: DragSwapOptions) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)
  // `end` must see the latest hovered id without re-subscribing every render.
  const overIdRef = useRef<string | null>(null)
  overIdRef.current = overId
  const findAtRef = useRef(findAt)
  findAtRef.current = findAt
  const swapRef = useRef(onSwap)
  swapRef.current = onSwap

  const start = useCallback((id: string) => {
    dragId.current = id
    setDraggingId(id)
    setOverId(null)
  }, [])

  const move = useCallback((clientX: number, clientY: number) => {
    if (!dragId.current) return
    const hit = findAtRef.current(clientX, clientY)
    setOverId(hit && hit !== dragId.current ? hit : null)
  }, [])

  const end = useCallback(() => {
    const from = dragId.current
    const to = overIdRef.current
    dragId.current = null
    setDraggingId(null)
    setOverId(null)
    if (from && to && from !== to) swapRef.current(from, to)
  }, [])

  const cancel = useCallback(() => {
    dragId.current = null
    setDraggingId(null)
    setOverId(null)
  }, [])

  return { draggingId, overId, start, move, end, cancel }
}
