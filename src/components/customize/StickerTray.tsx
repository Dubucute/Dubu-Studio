'use client'

/**
 * The sticker tray.
 *
 * Two ways to place a sticker: tap a sticker to drop it near the top of the strip, or drag it
 * onto the strip to place it exactly. Dragging uses pointer events rather than the HTML5 drag
 * API because that API has no touch support on phones — the platform most likely to be holding
 * a camera at a photobooth.
 */
import { useState } from 'react'
import { playCue } from '@/engine/audio'
import { STICKER_GROUPS, stickerById, stickersInGroup } from '@/core/stickers'
import { useBoothStore } from '@/state/useBoothStore'
import StickerIcon from '@/components/strip/StickerIcon'

/** Tap-to-add lands stickers along the top edge, staggered so they never stack exactly. */
function dropSpot(existing: number): [number, number] {
  const slot = existing % 6
  return [0.24 + (slot % 3) * 0.26, 0.12 + Math.floor(slot / 3) * 0.14]
}

export default function StickerTray({ stripRef }: { stripRef: React.RefObject<HTMLDivElement | null> }) {
  const addSticker = useBoothStore((s) => s.addSticker)
  const stickerCount = useBoothStore((s) => s.design.stickers.length)
  const [ghost, setGhost] = useState<{ defId: string; x: number; y: number } | null>(null)

  const place = (defId: string, clientX: number, clientY: number) => {
    const rect = stripRef.current?.getBoundingClientRect()
    if (!rect) return
    const inside =
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    if (inside) {
      addSticker(defId, (clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height)
    } else {
      const [x, y] = dropSpot(stickerCount)
      addSticker(defId, x, y)
    }
    playCue('pop')
  }

  const startDrag = (defId: string, event: React.PointerEvent) => {
    const originX = event.clientX
    const originY = event.clientY
    let dragged = false
    setGhost({ defId, x: originX, y: originY })

    const move = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - originX, e.clientY - originY) > 8) dragged = true
      setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g))
    }
    const end = (e: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      setGhost(null)
      // A tap (no movement) drops the sticker at the default spot; a drop uses the pointer.
      if (!dragged && Math.hypot(e.clientX - originX, e.clientY - originY) <= 8) {
        const [x, y] = dropSpot(stickerCount)
        addSticker(defId, x, y)
        playCue('pop')
      } else {
        place(defId, e.clientX, e.clientY)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const ghostDef = ghost ? stickerById(ghost.defId) : null

  return (
    <div className="space-y-3">
      {STICKER_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 text-xs font-bold text-ink-faint">{group.label}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stickersInGroup(group.id).map((def) => (
              <button
                key={def.id}
                type="button"
                aria-label={`Add ${def.name} sticker`}
                title={def.name}
                onPointerDown={(e) => {
                  e.preventDefault()
                  startDrag(def.id, e)
                }}
                className="chunky grid size-11 shrink-0 place-items-center rounded-2xl border-2 border-transparent bg-white hover:border-lav-200"
              >
                <StickerIcon def={def} color={def.color} className="size-8" shadow={false} />
              </button>
            ))}
          </div>
        </div>
      ))}

      {ghost && ghostDef && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-80"
          style={{ left: ghost.x, top: ghost.y }}
        >
          <StickerIcon def={ghostDef} color={ghostDef.color} className="size-12" />
        </span>
      )}
    </div>
  )
}