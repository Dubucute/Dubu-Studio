'use client'

/**
 * Step 2 — Style.
 *
 * Two columns on a big screen (a sticky strip preview, controls beside it) and one column on
 * a phone (preview first, then controls). Selected-sticker controls live here rather than
 * inside the strip component so the strip stays a dumb, reusable view.
 */
import { useRef, useState } from 'react'
import StripCanvas from '@/components/strip/StripCanvas'
import StickerIcon from '@/components/strip/StickerIcon'
import StickerTray from '@/components/customize/StickerTray'
import TextEditor from '@/components/customize/TextEditor'
import { FilterPicker, FramePicker, LayoutPicker } from '@/components/customize/pickers'
import { Card } from '@/components/ui/kit'
import { Ico } from '@/components/ui/icons'
import { MAX_STICKER_SIZE, MIN_STICKER_SIZE, STICKER_COLORS, stickerById } from '@/core/stickers'
import { playCue } from '@/engine/audio'
import { useBoothStore } from '@/state/useBoothStore'

export default function CustomizeStep() {
  const photos = useBoothStore((s) => s.photos)
  const design = useBoothStore((s) => s.design)
  const patchSticker = useBoothStore((s) => s.patchSticker)
  const removeSticker = useBoothStore((s) => s.removeSticker)
  const clearStickers = useBoothStore((s) => s.clearStickers)

  const stripRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = design.stickers.find((s) => s.id === selectedId) ?? null
  const selectedDef = selected ? stickerById(selected.defId) : null

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="md:sticky md:top-24">
        <StripCanvas
          design={design}
          photos={photos}
          interactive
          selectedId={selectedId}
          onSelect={setSelectedId}
          boxRef={stripRef}
          label="Your photo strip, live preview"
        />

        {selected && selectedDef ? (
          <div className="animate-rise mt-3 rounded-blob bg-white p-4 shadow-cute">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blush-50">
                <StickerIcon def={selectedDef} color={selected.color} className="size-8" />
              </span>
              <p className="font-display text-base font-bold">{selectedDef.name}</p>
              <button
                type="button"
                onClick={() => {
                  removeSticker(selected.id)
                  setSelectedId(null)
                }}
                aria-label="Delete selected sticker"
                className="chunky ml-auto grid size-9 place-items-center rounded-full bg-blush-100 text-ink hover:bg-blush-200"
              >
                <Ico name="trash" className="size-4" />
              </button>
            </div>

            <label className="mt-3 block text-xs font-bold text-ink-faint">
              Size
              <input
                type="range"
                min={MIN_STICKER_SIZE}
                max={MAX_STICKER_SIZE}
                step={0.005}
                value={selected.size}
                onChange={(e) => patchSticker(selected.id, { size: Number(e.target.value) })}
                onPointerUp={() => playCue('pop')}
                className="mt-1 w-full accent-lav-400"
              />
            </label>

            <label className="mt-2 block text-xs font-bold text-ink-faint">
              Tilt
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={selected.rotation}
                onChange={(e) => patchSticker(selected.id, { rotation: Number(e.target.value) })}
                className="mt-1 w-full accent-lav-400"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {STICKER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Colour sticker ${color}`}
                  aria-pressed={selected.color === color}
                  onClick={() => patchSticker(selected.id, { color })}
                  className={`chunky size-8 rounded-full border-2 ${
                    selected.color === color ? 'border-ink' : 'border-white'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-center text-sm font-semibold text-ink-soft">
            <Ico name="mouse-pointer" className="size-4 shrink-0 text-lav-400" />
            Drag a sticker from the tray onto the strip, then drag it anywhere you like.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Card icon="palette" title="Filter">
          <FilterPicker />
        </Card>

        <Card icon="layout-grid" title="Layout">
          <LayoutPicker />
        </Card>

        <Card icon="square" title="Frame">
          <FramePicker />
        </Card>

        <Card
          icon="heart"
          title="Stickers"
          hint={design.stickers.length ? `${design.stickers.length} on the strip` : undefined}
          action={
            design.stickers.length > 0 ? (
              <button
                type="button"
                onClick={clearStickers}
                className="chunky rounded-full bg-blush-50 px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-blush-100"
              >
                Clear all
              </button>
            ) : null
          }
        >
          <StickerTray stripRef={stripRef} />
        </Card>

        <Card icon="pen-line" title="Caption and date">
          <TextEditor />
        </Card>
      </div>
    </div>
  )
}