'use client'

/**
 * Pickers: filters, layouts, frames.
 *
 * Each one is a thin view — read the current id from the store, write the new one back —
 * so the three of them can share a file without pretending to be one component. All the
 * data (presets) and all the policy (which layouts are legal) come from `core/`.
 */
import { FILTERS } from '@/core/filters'
import { FRAMES } from '@/core/frames'
import { selectableLayouts } from '@/core/layouts'
import { Ico } from '@/components/ui/icons'
import { useBoothStore } from '@/state/useBoothStore'

export function FilterPicker() {
  const filterId = useBoothStore((s) => s.design.filterId)
  const setFilter = useBoothStore((s) => s.setFilter)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {FILTERS.map((filter) => {
        const active = filter.id === filterId
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active}
            onClick={() => setFilter(filter.id)}
            className={`chunky flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 ${
              active ? 'border-ink bg-lav-200 shadow-toy-xs' : 'border-ink/40 bg-paper hover:border-ink'
            }`}
          >
            <span
              aria-hidden
              className="size-9 rounded-full border-2 border-ink"
              style={{ background: `linear-gradient(135deg, ${filter.swatch[0]}, ${filter.swatch[1]})` }}
            />
            <span className="text-xs leading-tight font-bold text-ink">{filter.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function LayoutPicker() {
  const layoutId = useBoothStore((s) => s.design.layoutId)
  const photoCount = useBoothStore((s) => s.photos.length)
  const setLayout = useBoothStore((s) => s.setLayout)
  // Derived, not stored: one answer to "what can I pick with N photos".
  const layouts = selectableLayouts(photoCount)

  return (
    <div className="flex flex-wrap gap-2">
      {layouts.map((layout) => {
        const active = layout.id === layoutId
        return (
          <button
            key={layout.id}
            type="button"
            aria-pressed={active}
            onClick={() => setLayout(layout.id)}
            className={`chunky flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${
              active ? 'border-ink bg-lav-200 shadow-toy-xs' : 'border-ink/40 bg-paper hover:border-ink'
            }`}
          >
            {/* Miniature of the layout's grid, drawn from the same cols/rows the renderer uses. */}
            <span
              aria-hidden
              className="grid gap-[2px] rounded-[4px] border border-ink/30 bg-lav-100 p-[3px]"
              style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }}
            >
              {Array.from({ length: layout.cols * layout.rows }, (_, i) => (
                <span key={i} className="h-1 w-3 rounded-[2px] bg-lav-400/80" />
              ))}
            </span>
            <span className="text-sm font-bold text-ink">{layout.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function FramePicker() {
  const frameId = useBoothStore((s) => s.design.frameId)
  const setFrame = useBoothStore((s) => s.setFrame)

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {FRAMES.map((frame) => {
        const active = frame.id === frameId
        const def = frame
        return (
          <button
            key={frame.id}
            type="button"
            aria-pressed={active}
            onClick={() => setFrame(frame.id)}
            title={def.label}
            className={`chunky flex flex-col items-center gap-1 rounded-xl border-2 p-2 ${
              active ? 'border-ink bg-lav-200 shadow-toy-xs' : 'border-ink/40 bg-paper hover:border-ink'
            }`}
          >
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-lg border-2 border-ink bg-paper text-ink"
              style={
                def.kind === 'flat' && def.thickness > 0
                  ? { border: `${Math.max(2, def.thickness * 26)}px solid ${def.fill ?? '#FFB3CD'}` }
                  : undefined
              }
            >
              <Ico name={def.icon} className="size-4" />
            </span>
            <span className="text-[11px] leading-tight font-bold text-ink">{def.label}</span>
          </button>
        )
      })}
    </div>
  )
}