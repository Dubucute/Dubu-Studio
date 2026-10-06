/**
 * Pure design policy.
 *
 * Everything here is a function of its inputs — no clocks, no randomness, no DOM — so it
 * can run on the server, inside the store, or in the renderer without surprises. The one
 * exception is `todayStamp`, which takes the date it should format as an argument so the
 * caller decides what "now" means.
 */
import { selectableLayouts } from './layouts'
import { createId } from './ids'
import { DEFAULT_STICKER_SIZE, stickerById } from './stickers'
import type { Sticker, StripDesign } from './types'

/** `6 OCT 2026` — hand-formatted so server and client can never disagree about locale. */
export function todayStamp(now: Date = new Date()): string {
  const day = now.getDate()
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${day} ${month} ${now.getFullYear()}`
}

export const createDesign = (date = todayStamp()): StripDesign => ({
  filterId: 'original',
  layoutId: 'strip-4',
  frameId: 'none',
  stickers: [],
  text: { caption: '', place: '', showDate: true, date },
})

export const createSticker = (
  defId: string,
  x = 0.5,
  y = 0.5,
  size = DEFAULT_STICKER_SIZE,
): Sticker => ({
  id: createId('stk'),
  defId,
  x,
  y,
  size,
  rotation: 0,
  color: stickerById(defId)?.color ?? '#FF8FB8',
})

/**
 * Keep `layoutId` usable for `photoCount` photos.
 *
 * The store owns this decision, so there is exactly one place that answers "which layout is
 * legal right now" instead of every component re-deriving it.
 */
export function resolveLayoutId(design: StripDesign, photoCount: number): string {
  const options = selectableLayouts(photoCount)
  return options.some((l) => l.id === design.layoutId) ? design.layoutId : options[0].id
}