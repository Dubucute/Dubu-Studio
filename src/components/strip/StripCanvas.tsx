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
  const localRef = useRef<HTMLDivElement>(null)
  const box = boxRef ?? localRef
  const [renderWidth, setRenderWidth] = useState(PREVIEW_WIDTH)

  const layout = layoutFor(design, photos.length)
  const metrics = stripMetrics(layout)

  /** Paint through the shared engine renderer, then blit into the visible canvas. */
  const paint = useCallback(
    (width: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rendered = renderStrip(design, photos, width)
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
        if (interactive && event.target === event.currentTarget) onSelect?.(null)
      }}
      className={`strip-frame relative mx-auto w-full overflow-hidden rounded-2xl bg-white/70 shadow-[0_18px_40px_-22px_rgba(69,52,88,0.55)] sm:rounded-[1.75rem] ${className}`}
      style={{
        aspectRatio: `1 / ${metrics.height}`,
        // Because height = width * ratio, capping the width by (allowed height / ratio)
        // guarantees the strip fits without ever distorting it.
        maxWidth: `min(100%, calc((var(--strip-max-h) - 1.5rem) / ${metrics.height}))`,
      }}
    >
      <canvas ref={canvasRef} role="img" aria-label={label} className="block h-full w-full" />

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