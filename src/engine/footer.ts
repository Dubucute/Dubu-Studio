/**
 * The stamp — the caption / place / date marking painted in the strip footer.
 *
 * This module owns the whole footer policy: where the caption sits, how the place and
 * date share a line, how text shrinks when it runs long, and how the frame's ring eats
 * into the footer on the sides and bottom. The composer hands over raw material — the
 * *un-inset* footer rect and the ring depth from `frameDepthPx` — so the inset rule
 * lives in exactly one place. A frame too thin to paint a ring (`frameDepthPx`
 * answers 0) consequently reserves no footer space either; those two facts can no
 * longer disagree because they are the same fact.
 */
import type { StampInk, StampText } from '@/core/types'
import { fontStack, type Box } from './draw'

/** The classic plum pair, used on every pale sheet. Dark sheets ship their own ink. */
const PLUM: StampInk = { caption: '#453458', meta: '#6E5C82' }

/** Fonts are read from the live DOM so canvas text matches the UI's rounded type. */
const bodyFont = () => fontStack('body', '"Nunito", sans-serif')
const displayFont = () => fontStack('.font-display', '"Quicksand", sans-serif')

/** Shrink the font until the text fits `maxWidth`, so long captions never overflow. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: string, size: number, maxWidth: number, family: string) {
  let px = size
  ctx.font = `${weight} ${px}px ${family}`
  while (px > 8 && ctx.measureText(text).width > maxWidth) {
    px -= Math.max(1, px * 0.04)
    ctx.font = `${weight} ${px}px ${family}`
  }
  return px
}

/**
 * Paint the stamp inside `footer`, the footer's full rect in pixels.
 *
 * `unit` is pixels per layout unit. `ringDepth` is how deep the active frame's ring
 * reaches into the strip — pass `frameDepthPx(frame, unit)`, whose answers below the
 * paint threshold already arrive as 0. The type scales by the room that survives the
 * inset, so a frame eating the footer bottom shrinks caption and date together instead
 * of letting them collide. `ink` is the paper's stamp palette; the dark family of
 * sheets ships light ink so the footer stays readable on a night sheet.
 */
export function paintStamp(
  ctx: CanvasRenderingContext2D,
  text: StampText,
  footer: Box,
  unit: number,
  ringDepth = 0,
  ink: StampInk = PLUM,
) {
  const caption = text.caption.trim()
  const place = text.place.trim()
  const date = text.showDate ? text.date.trim() : ''
  if (!caption && !place && !date) return
  if (footer.h <= 0 || footer.w <= 0) return

  // The ring takes the sides and the bottom of the footer. Clamped so even an absurd
  // ring leaves the box intact.
  const depth = Math.max(0, Math.min(ringDepth, footer.w / 2, footer.h / 2))
  const box: Box = {
    x: footer.x + depth,
    y: footer.y,
    w: footer.w - depth * 2,
    h: footer.h - depth,
  }

  // How much room survived the ring. <= 1, and 1 whenever no ring is painted.
  const scale = Math.min(1, box.h / footer.h)
  const maxWidth = box.w * 0.86
  ctx.save()
  ctx.textBaseline = 'middle'

  if (caption) {
    const size = fitFont(ctx, caption, '700', unit * 0.072 * scale, maxWidth, displayFont())
    ctx.fillStyle = ink.caption
    ctx.font = `700 ${size}px ${displayFont()}`
    ctx.textAlign = 'center'
    ctx.fillText(caption, box.x + box.w / 2, box.y + box.h * 0.38)
  }

  // Place sits left of centre and the date right of it — a photo-booth stamp rather than a
  // single run-on string, so long place names never collide with the date.
  const metaY = caption ? box.y + box.h * 0.76 : box.y + box.h * 0.5
  const family = bodyFont()
  const gap = unit * 0.05 * scale
  let size = unit * 0.036 * scale
  ctx.font = `600 ${size}px ${family}`
  while (
    size > 8 &&
    (place ? ctx.measureText(place).width : 0) + (date ? ctx.measureText(date).width : 0) + gap > maxWidth
  ) {
    size -= Math.max(1, size * 0.04)
    ctx.font = `600 ${size}px ${family}`
  }
  ctx.fillStyle = ink.meta
  const centreX = box.x + box.w / 2
  if (place && date) {
    ctx.textAlign = 'right'
    ctx.fillText(place, centreX - gap / 2, metaY)
    ctx.textAlign = 'left'
    ctx.fillText(date, centreX + gap / 2, metaY)
  } else {
    ctx.textAlign = 'center'
    ctx.fillText(place || date, centreX, metaY)
  }

  ctx.restore()
}
