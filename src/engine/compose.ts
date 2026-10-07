/**
 * The composer — one renderer for the whole app.
 *
 * `renderStrip(design, photos, width)` is called with a small width for the live preview
 * and with EXPORT_WIDTH for the download. Because every measurement comes from
 * `stripMetrics()` in layout units and is multiplied by the output width at the last
 * moment, the two are pixel-identical compositions at different resolutions. There is no
 * second "export renderer" to drift out of sync.
 */
import { filterById } from '@/core/filters'
import { frameById } from '@/core/frames'
import { columnLayout, layoutById, selectableLayouts, stripMetrics } from '@/core/layouts'
import type { Photo, StripDesign } from '@/core/types'
import {
  drawImageCover,
  fillRoundRect,
  paintPaper,
  roundRectPath,
  seededRandom,
  strokeRoundRect,
  withClip,
  type Box,
} from './draw'
import { frameDepthPx, paintFrame } from './borders'
import { paintStamp } from './footer'
import { imageFor } from './photo'
import { paintSticker } from './stickers'

/** Preview render width in CSS px; export is 4x that. */
export const PREVIEW_WIDTH = 640
export const EXPORT_WIDTH = 2400

/** Same fallback chain the store uses, so the renderer never draws a mismatched layout. */
export const layoutFor = (design: StripDesign, photoCount: number) =>
  layoutById(design.layoutId) ??
  selectableLayouts(photoCount)[0] ??
  columnLayout(photoCount)

export function renderStrip(
  design: StripDesign,
  photos: Photo[],
  width: number,
  /** The live preview draws stickers as interactive DOM instead, so it opts out here. */
  { withStickers = true }: { withStickers?: boolean } = {},
): HTMLCanvasElement {
  const layout = layoutFor(design, photos.length)
  const metrics = stripMetrics(layout)

  const canvas = document.createElement('canvas')
  const W = Math.max(64, Math.round(width))
  const H = Math.round(W * metrics.height)
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingQuality = 'high'

  /** 1 layout unit === 1 pixel of output width. Everything below is in pixels. */
  const u = W
  const strip: Box = { x: 0, y: 0, w: W, h: H }

  // 1+2. Paper and frame are one choice: every frame carries the sheet that suits it,
  // so the background is painted first and the decorative border — with its cut-outs
  // showing paper through — sits on it, under the photos.
  const frame = frameById(design.frameId)
  const paper = frame.paper
  paintPaper(ctx, strip, paper.colors, u * 0.03)
  paintSpeckles(ctx, strip, u, photos.length, paper.speckle)
  paintFrame(ctx, frame, strip, u, paper.colors[0])

  // 3. Photo cells.
  const radius = layout.radius * u
  const polaroidFrame = layout.cell === 'polaroid' ? layout.frame * u : 0

  metrics.cells.forEach((cell, index) => {
    const cellBox: Box = { x: cell.x * u, y: cell.y * u, w: cell.w * u, h: cell.h * u }
    const photoBox: Box = polaroidFrame
      ? {
          x: cellBox.x + polaroidFrame,
          y: cellBox.y + polaroidFrame,
          w: cellBox.w - polaroidFrame * 2,
          // The bottom edge keeps extra room: that is the polaroid caption margin.
          h: cellBox.h - polaroidFrame * 1.15,
        }
      : cellBox

    const photo = photos[index]
    const image = photo ? imageFor(photo) : null

    if (polaroidFrame) {
      // White card with a hard, small lift so it reads as paper, not fog.
      ctx.save()
      ctx.shadowColor = 'rgba(74, 59, 92, 0.28)'
      ctx.shadowBlur = u * 0.01
      ctx.shadowOffsetY = u * 0.018
      fillRoundRect(ctx, cellBox, radius, '#FFFFFF')
      ctx.restore()
    }

    if (image) {
      // `ctx.filter` accepts the same CSS filter string as the live video preview,
      // so the shot you framed and the shot in the strip match.
      ctx.filter = filterById(design.filterId).css
      withClip(ctx, photoBox, polaroidFrame ? u * 0.008 : radius, () => {
        drawImageCover(ctx, image, photoBox)
      })
      ctx.filter = 'none'
    } else {
      paintPlaceholder(ctx, photoBox)
    }

    if (!polaroidFrame) {
      strokeRoundRect(ctx, photoBox, radius, 'rgba(255, 255, 255, 0.92)', Math.max(1.5, u * 0.005))
    }
  })

  // 4. Caption / date stamp in the footer. The stamp module owns how the frame's ring
  // eats into the footer; the composer hands over the full footer rect and how deep
  // the ring is, so the inset policy lives in exactly one place.
  const footer: Box = {
    x: 0,
    y: metrics.footerTop * u,
    w: W,
    h: (metrics.height - metrics.footerTop) * u,
  }
  paintStamp(ctx, design.text, footer, u, frameDepthPx(frame, u), paper.ink)

  // 5. Stickers are flattened last in the exported artwork. The preview skips this step —
  // its stickers are DOM elements layered on top, so drawing them here too would show two.
  if (withStickers) for (const sticker of design.stickers) paintSticker(ctx, sticker, { width: W, height: H })

  return canvas
}

/** Deterministic paper texture — a redraw never reshuffles the dots. */
function paintSpeckles(
  ctx: CanvasRenderingContext2D,
  strip: Box,
  u: number,
  seed: number,
  /** Accent from the paper preset, so the dots match the sheet. */
  accent: string,
) {
  const rand = seededRandom(seed * 977 + 31)
  ctx.save()
  ctx.beginPath()
  ctx.rect(strip.x, strip.y, strip.w, strip.h)
  ctx.clip()
  for (let i = 0; i < 46; i++) {
    const r = u * (0.004 + rand() * 0.007)
    ctx.globalAlpha = 0.18 + rand() * 0.2
    ctx.fillStyle = i % 5 === 0 ? accent : '#FFFFFF'
    ctx.beginPath()
    ctx.arc(strip.x + rand() * strip.w, strip.y + rand() * strip.h, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Friendly tile shown when a photo is missing or not decoded yet. */
function paintPlaceholder(ctx: CanvasRenderingContext2D, box: Box) {
  const g = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h)
  g.addColorStop(0, '#F4EFFF')
  g.addColorStop(1, '#DCE9FF')
  ctx.fillStyle = g
  ctx.fillRect(box.x, box.y, box.w, box.h)

  // A small vector picture mark, drawn rather than typed so it never depends on an emoji font.
  const s = Math.min(box.w, box.h) * 0.52
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  roundRectPath(ctx, { x: cx - s / 2, y: cy - s / 2, w: s, h: s * 0.76 }, s * 0.14)
  ctx.fill()
  ctx.fillStyle = '#FFB3CD'
  ctx.beginPath()
  ctx.arc(cx - s * 0.16, cy - s * 0.12, s * 0.07, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#CBB6FF'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.42, cy + s * 0.28)
  ctx.lineTo(cx - s * 0.06, cy - s * 0.1)
  ctx.lineTo(cx + s * 0.18, cy + s * 0.16)
  ctx.lineTo(cx + s * 0.3, cy + s * 0.06)
  ctx.lineTo(cx + s * 0.44, cy + s * 0.28)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}