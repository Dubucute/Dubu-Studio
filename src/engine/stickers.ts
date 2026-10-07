/**
 * Canvas painters for stickers. The footer's text stamp has its own module: `footer.ts`.
 *
 * Stickers are drawn from the shape lists in `core/stickers.ts`. Because the very same list
 * is mapped to SVG for the on-screen preview, a sticker looks identical in the editor and in
 * the exported PNG — and on every platform, which is the whole point of not using emoji.
 */
import { inkFor, stickerById, type Shape, type StickerDef } from '@/core/stickers'
import type { Sticker } from '@/core/types'
import { roundRectPath, type Box } from './draw'

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

/**
 * Paint one placed sticker.
 *
 * Sticker geometry is normalized against the strip box: `x` and `size` are fractions of the
 * strip WIDTH, `y` is a fraction of the strip HEIGHT — exactly how the DOM layer positions
 * them (`left`/`width` in %, `top` in %). Passing one unit for both axes made stickers land
 * near the top of tall strips like the classic 4-cut.
 */
export function paintSticker(
  ctx: CanvasRenderingContext2D,
  sticker: Sticker,
  unit: { width: number; height: number },
) {
  const def = stickerById(sticker.defId)
  if (!def) return
  drawStickerDef(ctx, def, {
    x: sticker.x * unit.width,
    y: sticker.y * unit.height,
    size: sticker.size * unit.width,
    rotation: sticker.rotation,
    color: sticker.color,
  })
}