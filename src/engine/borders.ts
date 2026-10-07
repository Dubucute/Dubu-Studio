/**
 * Frame painters.
 *
 * Each painter receives the *outer* strip box in pixels and a thickness, and is responsible
 * only for how its look is drawn. The shared technique:
 *   1. fill the ring between the outer box and an inset box  (the "paper" band)
 *   2. clip to that ring and scatter decorations along the perimeter
 * so decorations never bleed into the photos.
 *
 * Corners are kept deliberately tight (hard edges) rather than puffy — the pastel paper
 * gradient behind the cells provides the softness, the frame itself reads as crisp.
 */
import type { FrameDef, FrameKind } from '@/core/frames'
import { fillRing, type Box, walkPerimeter, withRingClip } from './draw'

interface PainterArgs {
  ctx: CanvasRenderingContext2D
  frame: FrameDef
  outer: Box
  t: number
  /** Paper colour showing through cut-outs, so notches blend into the background. */
  inner: string
}

type Painter = (args: PainterArgs) => void

const ink = (ctx: CanvasRenderingContext2D, frame: FrameDef) => frame.ink ?? '#4A3B5C'
const accent = (ctx: CanvasRenderingContext2D, frame: FrameDef) => frame.accent ?? frame.ink ?? '#4A3B5C'

/** Tight corner radii for a hard, crisp frame edge — not puffy. */
const outerR = (t: number) => Math.min(t * 0.55, 9)
const innerR = (t: number) => Math.min(t * 0.45, 7)

const flat: Painter = ({ ctx, frame, outer, t }) => {
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), frame.fill ?? '#FFB3CD')
  // A faint dashed inner line keeps the solid colour from reading as a plain rectangle.
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = Math.max(1, t * 0.08)
  ctx.setLineDash([t * 0.34, t * 0.3])
  const dashed = inset(outer, t * 0.62)
  ctx.strokeRect(dashed.x, dashed.y, dashed.w, dashed.h)
  ctx.restore()
}

const doodle: Painter = ({ ctx, frame, outer, t }) => {
  // Two passes with different jitter read as a hand-drawn line.
  for (const pass of [0, 1]) {
    ctx.save()
    ctx.strokeStyle = pass === 0 ? ink(ctx, frame) : 'rgba(255,255,255,0.75)'
    ctx.lineWidth = t * (pass === 0 ? 0.5 : 0.26)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const pts = walkPerimeter(inset(outer, t * 0.5), t * 0.85)
    pts.forEach((p, i) => {
      const wobble = Math.sin((i + pass * 3) * 2.4) * t * 0.12
      const x = p.x + Math.sin(p.angle) * wobble
      const y = p.y - Math.cos(p.angle) * wobble
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
  // A crisp hairline under the doodle line so it never looks fuzzy.
  ctx.save()
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = ink(ctx, frame)
  ctx.lineWidth = Math.max(0.5, t * 0.04)
  ctx.setLineDash([])
  ctx.strokeRect(t * 0.5, t * 0.5, outer.w - t, outer.h - t)
  ctx.restore()
}

const floral: Painter = ({ ctx, frame, outer, t, inner }) => {
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), inner)
  withRingClip(ctx, outer, inset(outer, t), outerR(t), innerR(t), () => {
    const step = Math.max(t * 1.25, 18)
    for (const p of walkPerimeter(inset(outer, t * 0.5), step)) {
      const size = t * 0.3
      // Petals, centre dot, and a leaf on the opposite side of the band.
      ctx.fillStyle = ink(ctx, frame)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + p.angle
        ctx.beginPath()
        ctx.ellipse(p.x + Math.cos(a) * size * 0.6, p.y + Math.sin(a) * size * 0.6, size * 0.5, size * 0.38, a, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#FFF3B8'
      ctx.beginPath()
      ctx.arc(p.x, p.y, size * 0.34, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = accent(ctx, frame)
      ctx.beginPath()
      ctx.ellipse(p.x - Math.sin(p.angle) * size * 1.5, p.y + Math.cos(p.angle) * size * 1.5, size * 0.55, size * 0.3, p.angle, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

const hearts: Painter = ({ ctx, frame, outer, t }) => {
  // The ring base is the frame's own paper colour; the classic Hearts keeps its pink.
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), frame.fill ?? '#FFECF4')
  withRingClip(ctx, outer, inset(outer, t), outerR(t), innerR(t), () => {
    const step = Math.max(t * 1.15, 16)
    for (const p of walkPerimeter(inset(outer, t * 0.5), step)) {
      drawHeart(ctx, p.x, p.y, t * 0.3, ink(ctx, frame), p.angle + Math.PI / 2)
    }
  })
}

const scallop: Painter = ({ ctx, frame, outer, t, inner }) => {
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), frame.fill ?? '#CFEBFF')
  withRingClip(ctx, outer, inset(outer, t), outerR(t), innerR(t), () => {
    // Bumps punched along the inner edge give the classic scalloped paper look.
    const step = Math.max(t * 0.9, 14)
    ctx.fillStyle = inner
    for (const p of walkPerimeter(inset(outer, t), step)) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, t * 0.52, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = ink(ctx, frame)
    for (const p of walkPerimeter(inset(outer, t * 0.55), step * 1.6)) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, t * 0.11, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

const film: Painter = ({ ctx, frame, outer, t, inner }) => {
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), frame.fill ?? '#FFFFFF')
  withRingClip(ctx, outer, inset(outer, t), outerR(t), innerR(t), () => {
    ctx.fillStyle = ink(ctx, frame)
    const step = Math.max(t * 1.05, 14)
    for (const p of walkPerimeter(inset(outer, t * 0.5), step)) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillRect(-t * 0.22, -t * 0.3, t * 0.44, t * 0.6)
      ctx.restore()
    }
  })
  // Hairline edge so the white band reads on white paper.
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = ink(ctx, frame)
  ctx.lineWidth = Math.max(1, t * 0.05)
  ctx.strokeRect(t * 0.5, t * 0.5, outer.w - t, outer.h - t)
  ctx.restore()
}

const stripe: Painter = ({ ctx, frame, outer, t }) => {
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), frame.fill ?? '#FFD6E8')
  withRingClip(ctx, outer, inset(outer, t), outerR(t), innerR(t), () => {
    ctx.save()
    ctx.strokeStyle = accent(ctx, frame)
    ctx.lineWidth = t * 0.42
    ctx.lineCap = 'round'
    const gap = t * 0.82
    const span = outer.w + outer.h
    for (let d = -outer.h; d < span; d += gap) {
      ctx.beginPath()
      ctx.moveTo(d, 0)
      ctx.lineTo(d + outer.h, outer.h)
      ctx.stroke()
    }
    ctx.restore()
  })
}

const inset = (b: Box, amount: number): Box => ({
  x: b.x + amount,
  y: b.y + amount,
  w: Math.max(0, b.w - amount * 2),
  h: Math.max(0, b.h - amount * 2),
})

/**
 * A gift-ribbon band: solid paper colour with a little bow tied at each corner.
 *
 * Everything is drawn inside the ring's t×t corner square, so `withRingClip` can never
 * eat part of a bow — decorations further in would be clipped away entirely.
 */
const ribbon: Painter = ({ ctx, frame, outer, t }) => {
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), frame.fill ?? '#FFD9E8')
  withRingClip(ctx, outer, inset(outer, t), outerR(t), innerR(t), () => {
    const bow = frame.accent ?? '#FF8FB8'
    const inkColour = ink(ctx, frame)
    const corners: [number, number, number, number][] = [
      [outer.x, outer.y, 1, 1],
      [outer.x + outer.w, outer.y, -1, 1],
      [outer.x + outer.w, outer.y + outer.h, -1, -1],
      [outer.x, outer.y + outer.h, 1, -1],
    ]
    for (const [cx, cy, sx, sy] of corners) {
      // Centre of the corner square of the band.
      ctx.save()
      ctx.translate(cx + sx * t * 0.5, cy + sy * t * 0.5)
      // Rotate so the loops spread along the two band arms, knot at the corner.
      ctx.rotate(Math.atan2(sy, -sx))
      ctx.fillStyle = bow
      // Two loops, one into each band arm. No tails: a mirrored bow needs flipped
      // handedness that rotation cannot express, and loops + knot already read as a bow.
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(side * t * 0.3, 0, t * 0.24, t * 0.14, side * 0.25, 0, Math.PI * 2)
        ctx.fill()
      }
      // Knot.
      ctx.fillStyle = inkColour
      ctx.beginPath()
      ctx.arc(0, 0, t * 0.11, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  })
  // A crisp hairline so the band reads on pale paper.
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.strokeStyle = ink(ctx, frame)
  ctx.lineWidth = Math.max(0.5, t * 0.04)
  ctx.strokeRect(t * 0.5, t * 0.5, outer.w - t, outer.h - t)
  ctx.restore()
}

/** A dashed "sewn" line border on a pale fill — looks hand-finished. */
const stitch: Painter = ({ ctx, frame, outer, t }) => {
  fillRing(ctx, outer, inset(outer, t), outerR(t), innerR(t), frame.fill ?? '#FFF1F4')
  ctx.save()
  ctx.strokeStyle = frame.ink ?? '#453458'
  ctx.lineWidth = Math.max(1, t * 0.18)
  ctx.setLineDash([t * 0.18, t * 0.2])
  ctx.lineDashOffset = 0
  ctx.strokeRect(t * 0.5, t * 0.5, outer.w - t, outer.h - t)
  ctx.restore()
  // Small cross-stitch ticks along the inner edge for a sewn look.
  ctx.save()
  ctx.strokeStyle = frame.ink ?? '#453458'
  ctx.lineWidth = Math.max(0.5, t * 0.05)
  const step = Math.max(t * 0.9, 12)
  for (const p of walkPerimeter(inset(outer, t * 0.6), step)) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)
    ctx.beginPath()
    ctx.moveTo(-t * 0.05, 0)
    ctx.lineTo(t * 0.05, 0)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

export function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill: string,
  rotation = 0,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(0, size * 0.3)
  ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.5, -size, 0, -size * 0.4)
  ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.3, 0, size * 0.3)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const PAINTERS: Record<Exclude<FrameKind, 'none'>, Painter> = {
  flat,
  doodle,
  floral,
  hearts,
  scallop,
  film,
  stripe,
  ribbon,
  stitch,
}

/**
 * How deep the frame's ring actually reaches into the strip, in pixels — the single
 * answer to "how much room does this frame eat?" It is 0 when the frame is too thin
 * to paint at all, so anything that reserves space for the ring reserves nothing.
 * Both `paintFrame` and the footer stamp go through here; they can no longer disagree
 * about whether a sub-2px ring exists.
 */
export function frameDepthPx(frame: FrameDef, unit: number): number {
  const t = frame.thickness * unit
  // "No frame" is simply a frame with no thickness, so it needs no special case here.
  return t < 2 ? 0 : t
}

/** Paint the decorative border around the strip. `unit` is pixels per layout unit. */
export function paintFrame(ctx: CanvasRenderingContext2D, frame: FrameDef, outer: Box, unit: number, innerColor: string) {
  const t = frameDepthPx(frame, unit)
  if (t === 0) return
  const painter = PAINTERS[frame.kind]
  painter({ ctx, frame, outer, t, inner: innerColor })
}