'use client'

/**
 * The strip view: one canvas host used by both the Style step (interactive) and the
 * Result step (static).
 *
 * It never draws anything itself — it calls `renderStrip()` from the engine, which is the
 * same function the PNG export uses. Stickers are real DOM buttons layered on top instead
 * of being painted into the canvas, so they can be dragged, focused, selected and deleted
 * with the keyboard. Their geometry is normalized (fractions of the strip box) and their
 * font size is set in container-query units, so the preview and the export line up exactly.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PREVIEW_WIDTH, layoutFor, renderStrip } from '@/engine/compose'
import { stripMetrics } from '@/core/layouts'
import { stickerById } from '@/core/stickers'
import { ensureImages } from '@/engine/photo'
import { useBoothStore } from '@/state/useBoothStore'
import { useDragSwap } from './useDragSwap'
import StickerIcon from './StickerIcon'
import type { Photo, StripDesign } from '@/core/types'

interface StripCanvasProps {
  design: StripDesign
  photos: Photo[]
  /** Turn on drag + selection. Off for the read-only Result preview. */
  interactive?: boolean
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** The parent holds this ref so the sticker tray can compute drop coordinates. */
  boxRef?: React.RefObject<HTMLDivElement | null>
  className?: string
  label?: string
}

const MAX_RENDER_WIDTH = 1400

export default function StripCanvas({
  design,
  photos,
  interactive = false,
  selectedId = null,
  onSelect,
  boxRef,
  className = '',
  label = 'Photo strip preview',
}: StripCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const moveSticker = useBoothStore((s) => s.moveSticker)
  const removeSticker = useBoothStore((s) => s.removeSticker)
  const swapPhotos = useBoothStore((s) => s.swapPhotos)
  const localRef = useRef<HTMLDivElement>(null)
  const box = boxRef ?? localRef
  const [renderWidth, setRenderWidth] = useState(PREVIEW_WIDTH)

  const layout = layoutFor(design, photos.length)
  const metrics = stripMetrics(layout)

  /**
   * Drag a photo cell onto another and the two photos trade places.
   * Hit-testing is geometric because the cells live inside one canvas, not in the DOM.
   */
  const findCellAt = useCallback(
    (clientX: number, clientY: number): string | null => {
      const node = box.current
      if (!node) return null
      const rect = node.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      // Normalized point in strip-width units (y also spans `metrics.height` such units).
      const nx = (clientX - rect.left) / rect.width
      const ny = ((clientY - rect.top) / rect.height) * metrics.height
      const index = metrics.cells.findIndex(
        (c) => nx >= c.x && nx <= c.x + c.w && ny >= c.y && ny <= c.y + c.h,
      )
      return index >= 0 ? photos[index]?.id ?? null : null
    },
    // `box` is a stable ref object; geometry and photos are what can change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics, photos],
  )

  const drag = useDragSwap({ onSwap: swapPhotos, findAt: findCellAt })

  /** Cell box as CSS percentages, for the drag feedback overlay. */
  const overlayFor = (id: string | null) => {
    if (!id) return null
    const index = photos.findIndex((p) => p.id === id)
    const cell = index >= 0 ? metrics.cells[index] : undefined
    if (!cell) return null
    return {
      left: `${cell.x * 100}%`,
      top: `${(cell.y / metrics.height) * 100}%`,
      width: `${cell.w * 100}%`,
      height: `${(cell.h / metrics.height) * 100}%`,
    }
  }

  /** Paint through the shared engine renderer, then blit into the visible canvas. */
  const paint = useCallback(
    (width: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      // Stickers are excluded: they are real DOM buttons layered over this canvas, and
      // painting them here as well made a dragged sticker appear twice.
      const rendered = renderStrip(design, photos, width, { withStickers: false })
      canvas.width = rendered.width
      canvas.height = rendered.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(rendered, 0, 0)
    },
    [design, photos],
  )

  // Render at device resolution (capped) so the preview stays crisp on retina screens.
  useLayoutEffect(() => {
    const node = box.current
    if (!node) return
    const measure = () => {
      const cssWidth = node.getBoundingClientRect().width
      if (cssWidth <= 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      setRenderWidth(Math.min(MAX_RENDER_WIDTH, Math.max(280, Math.round(cssWidth * dpr))))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [box])

  useEffect(() => {
    paint(renderWidth)
  }, [paint, renderWidth])

  // Photos decode asynchronously; repaint once they land (placeholders draw until then).
  useEffect(() => {
    let alive = true
    if (photos.length === 0) return
    void ensureImages(photos).then(() => {
      if (alive) paint(renderWidth)
    })
    return () => {
      alive = false
    }
  }, [photos, paint, renderWidth])

  // Emoji and rounded type must be ready or the first paint uses fallback glyphs.
  useEffect(() => {
    let alive = true
    void document.fonts?.ready.then(() => {
      if (alive) paint(renderWidth)
    })
    return () => {
      alive = false
    }
  }, [paint, renderWidth])

  const dragRef = useRef<{ id: string; pointerId: number; dx: number; dy: number } | null>(null)

  const onStickerPointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    const node = box.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const sticker = design.stickers.find((s) => s.id === id)
    if (!sticker) return
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    // Remember the grab offset so the sticker does not jump to the cursor.
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      dx: event.clientX - rect.left - sticker.x * rect.width,
      dy: event.clientY - rect.top - sticker.y * rect.height,
    }
    onSelect?.(id)
  }

  const onStickerPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    const node = box.current
    if (!drag || !node || drag.pointerId !== event.pointerId) return
    const rect = node.getBoundingClientRect()
    moveSticker(drag.id, (event.clientX - rect.left - drag.dx) / rect.width, (event.clientY - rect.top - drag.dy) / rect.height)
  }

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  const onStickerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, id: string) => {
    const sticker = design.stickers.find((s) => s.id === id)
    if (!sticker) return
    const step = event.shiftKey ? 0.04 : 0.01
    const nudge: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const delta = nudge[event.key]
    if (delta) {
      event.preventDefault()
      moveSticker(id, sticker.x + delta[0], sticker.y + delta[1])
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      removeSticker(id)
      onSelect?.(null)
    }
  }

  return (
    <div
      ref={box}
      onPointerDown={(event) => {
        if (!interactive) return
        // Sticker buttons manage their own drags; everything else is photo territory.
        if ((event.target as HTMLElement).closest('button')) return
        onSelect?.(null)
        const id = findCellAt(event.clientX, event.clientY)
        if (!id) return
        drag.start(id)
        // Keep receiving moves outside the strip. A synthetic or already-lifted pointer
        // can make this throw — the drag itself must not depend on it.
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          /* pointer capture unavailable; move/up still land on this element */
        }
      }}
      onPointerMove={(event) => drag.move(event.clientX, event.clientY)}
      onPointerUp={drag.end}
      onPointerCancel={drag.cancel}
      className={`strip-frame relative mx-auto w-full overflow-hidden rounded-lg border-2 border-ink bg-screen ${
        interactive ? 'no-touch-scroll' : ''
      } ${className}`}
      style={{
        aspectRatio: `1 / ${metrics.height}`,
        // Because height = width * ratio, capping the width by (allowed height / ratio)
        // guarantees the strip fits without ever distorting it.
        maxWidth: `min(100%, calc((var(--strip-max-h) - 1.5rem) / ${metrics.height}))`,
      }}
    >
      <canvas ref={canvasRef} role="img" aria-label={label} className="block h-full w-full" />

      {/* Drag feedback: a soft ghost on the photo being dragged, a hard ring on its target. */}
      {overlayFor(drag.draggingId) && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-md border-2 border-dashed border-ink/70 bg-white/45"
          style={overlayFor(drag.draggingId) ?? undefined}
        />
      )}
      {overlayFor(drag.overId) && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-md border-[3px] border-mauve-500 bg-white/30"
          style={overlayFor(drag.overId) ?? undefined}
        />
      )}

      {design.stickers.map((sticker) => {
        const def = stickerById(sticker.defId)
        if (!def) return null
        return (
          <button
            key={sticker.id}
            type="button"
            aria-label={`${def.name} sticker. Drag to move, arrow keys to nudge, delete to remove.`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 no-touch-scroll ${
              interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
            } ${selectedId === sticker.id ? 'rounded-xl ring-2 ring-lav-400' : ''}`}
            style={{
              left: `${sticker.x * 100}%`,
              top: `${sticker.y * 100}%`,
              // Width as a percentage of the strip box keeps the sticker at the same relative
              // size here and in the exported PNG.
              width: `${sticker.size * 100}%`,
              aspectRatio: '1 / 1',
              rotate: `${sticker.rotation}deg`,
            }}
            onPointerDown={(e) => onStickerPointerDown(e, sticker.id)}
            onPointerMove={onStickerPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={(e) => {
              e.stopPropagation()
              if (interactive) onSelect?.(sticker.id)
            }}
            onKeyDown={(e) => interactive && onStickerKeyDown(e, sticker.id)}
            onFocus={() => interactive && onSelect?.(sticker.id)}
          >
            <StickerIcon def={def} color={sticker.color} className="size-full" />
          </button>
        )
      })}
    </div>
  )
}