/**
 * Canvas painters for stickers and the text stamp.
 *
 * Stickers are drawn from the shape lists in `core/stickers.ts`. Because the very same list
 * is mapped to SVG for the on-screen preview, a sticker looks identical in the editor and in
 * the exported PNG — and on every platform, which is the whole point of not using emoji.
 */
import { inkFor, stickerById, type Shape, type StickerDef } from '@/core/stickers'
import type { StampText, Sticker } from '@/core/types'
import { fontStack, roundRectPath, type Box } from './draw'

/** Shapes are authored in a 100x100 box centred on (50, 50). */
const BOX = 100

const rotateAbout = (ctx: CanvasRenderingContext2D, degrees: number | undefined, cx: number, cy: number, fn: () => void) => {
  if (!degrees) return fn()
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.translate(-cx, -cy)
  fn()
  ctx.restore()
}

/** Fill one shape list. `shadow` paints the same list once, offset, as a soft drop shadow. */
export function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], fill: string, ink: string) {
  for (const shape of shapes) {
    ctx.fillStyle = shape.ink ? ink : fill
    ctx.beginPath()
    switch (shape.t) {
      case 'circle':
        ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'ellipse':
        rotateAbout(ctx, shape.rot, shape.cx, shape.cy, () => {
          ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2)
          ctx.fill()
        })
        break
      case 'rect': {
        const box: Box = { x: shape.x, y: shape.y, w: shape.w, h: shape.h }
        rotateAbout(ctx, shape.rot, shape.x + shape.w / 2, shape.y + shape.h / 2, () => {
          roundRectPath(ctx, box, shape.r ?? 0)
          ctx.fill()
        })
        break
      }
      case 'poly': {
        const cx = shape.pts.reduce((sum, p) => sum + p[0], 0) / shape.pts.length
        const cy = shape.pts.reduce((sum, p) => sum + p[1], 0) / shape.pts.length
        rotateAbout(ctx, shape.rot, cx, cy, () => {
          ctx.moveTo(shape.pts[0][0], shape.pts[0][1])
          for (const [x, y] of shape.pts.slice(1)) ctx.lineTo(x, y)
          ctx.closePath()
          ctx.fill()
        })
        break
      }
      case 'path':
        // Path2D keeps hand-written bezier data intact instead of re-tracing it.
        ctx.fill(new Path2D(shape.d))
        break
    }
  }
}

/** Draw a sticker definition centred on (x, y) at `size` pixels wide. */
export function drawStickerDef(
  ctx: CanvasRenderingContext2D,
  def: StickerDef,
  opts: { x: number; y: number; size: number; rotation?: number; color?: string; shadow?: boolean },
) {
  const scale = opts.size / BOX
  ctx.save()
  ctx.translate(opts.x, opts.y)
  ctx.rotate(((opts.rotation ?? 0) * Math.PI) / 180)
  ctx.scale(scale, scale)
  ctx.translate(-BOX / 2, -BOX / 2)

  if (opts.shadow !== false) {
    ctx.save()
    ctx.translate(2.5, 3.5)
    drawShapes(ctx, def.shapes, 'rgba(69, 52, 88, 0.14)', 'rgba(69, 52, 88, 0.14)')
    ctx.restore()
  }

  drawShapes(ctx, def.shapes, opts.color ?? def.color, inkFor(opts.color ?? def.color))
  ctx.restore()
}

/** Paint one placed sticker. `unit` is pixels per layout unit (i.e. the output width). */
export function paintSticker(ctx: CanvasRenderingContext2D, sticker: Sticker, unit: number) {
  const def = stickerById(sticker.defId)
  if (!def) return
  drawStickerDef(ctx, def, {
    x: sticker.x * unit,
    y: sticker.y * unit,
    size: sticker.size * unit,
    rotation: sticker.rotation,
    color: sticker.color,
  })
}

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

/** Draw the caption / date / place stamp in the strip footer. */
export function paintStamp(ctx: CanvasRenderingContext2D, text: StampText, box: Box, unit: number) {
  const caption = text.caption.trim()
  const place = text.place.trim()
  const date = text.showDate ? text.date.trim() : ''
  if (!caption && !place && !date) return

  const maxWidth = box.w * 0.86
  ctx.save()
  ctx.textBaseline = 'middle'

  if (caption) {
    const size = fitFont(ctx, caption, '700', unit * 0.072, maxWidth, displayFont())
    ctx.fillStyle = '#453458'
    ctx.font = `700 ${size}px ${displayFont()}`
    ctx.textAlign = 'center'
    ctx.fillText(caption, box.x + box.w / 2, box.y + box.h * 0.38)
  }

  // Place sits left of centre and the date right of it — a photo-booth stamp rather than a
  // single run-on string, so long place names never collide with the date.
  const metaY = caption ? box.y + box.h * 0.76 : box.y + box.h * 0.5
  const family = bodyFont()
  const gap = unit * 0.05
  let size = unit * 0.036
  ctx.font = `600 ${size}px ${family}`
  while (
    size > 8 &&
    (place ? ctx.measureText(place).width : 0) + (date ? ctx.measureText(date).width : 0) + gap > maxWidth
  ) {
    size -= Math.max(1, size * 0.04)
    ctx.font = `600 ${size}px ${family}`
  }
  ctx.fillStyle = '#6E5C82'
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