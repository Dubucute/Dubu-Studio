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
import { Window } from '@/components/ui/kit'
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
        <Window title="Preview" icon="star" bodyClassName="p-3 sm:p-4">
          <StripCanvas
            design={design}
            photos={photos}
            interactive
            selectedId={selectedId}
            onSelect={setSelectedId}
            boxRef={stripRef}
            label="Your photo strip, live preview"
          />
        </Window>

        {selected && selectedDef ? (
          <div className="window animate-rise mt-3 overflow-hidden">
            <div className="window-bar bg-mauve-500 text-white">
              <StickerIcon def={selectedDef} color={selected.color} className="size-4" />
              <span className="text-sm font-bold">{selectedDef.name} sticker</span>
              <button
                type="button"
                onClick={() => {
                  removeSticker(selected.id)
                  setSelectedId(null)
                }}
                aria-label="Delete selected sticker"
                className="chunky ml-auto grid size-6 place-items-center rounded-md border-2 border-ink bg-paper text-ink shadow-toy-xs"
              >
                <Ico name="trash" className="size-3.5" />
              </button>
            </div>
            <div className="p-4">

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
                  className={`chunky size-8 rounded-lg border-2 shadow-toy-xs ${
                    selected.color === color ? 'border-ink' : 'border-ink/30'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
            </div>
          </div>
        ) : (
          <p className="well mt-3 flex items-center justify-center gap-2 px-3 py-2 text-center text-sm font-semibold text-ink-soft">
            <Ico name="mouse-pointer" className="size-4 shrink-0 text-lav-500" />
            Drag a sticker from the tray onto the strip, then drag it anywhere you like.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Window title="Filter" panel icon="palette">
          <FilterPicker />
        </Window>

        <Window title="Layout" panel icon="layout-grid">
          <LayoutPicker />
        </Window>

        <Window title="Frame" panel icon="square">
          <FramePicker />
        </Window>

        <Window
          title="Stickers" panel
          icon="heart"
          controls={
            design.stickers.length > 0 ? (
              <button
                type="button"
                onClick={clearStickers}
                className="chunky rounded-md border-2 border-ink bg-paper px-2 py-0.5 text-[11px] font-bold text-ink shadow-toy-xs"
              >
                Clear all
              </button>
            ) : (
              <span className="text-[11px] font-bold text-ink/70">{design.stickers.length} placed</span>
            )
          }
        >
          <StickerTray stripRef={stripRef} />
        </Window>

        <Window title="Caption and date" panel icon="pen-line">
          <TextEditor />
        </Window>
      </div>
    </div>
  )
}