/**
 * Low-level canvas primitives shared by the composer and the painters.
 *
 * Everything here takes/returns **pixels**. The composer is the only place that converts
 * from layout units (fractions of the strip width) to pixels, so painters stay simple and
 * resolution-agnostic.
 */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Build a rounded-rectangle path. `ctx.roundRect` is not used so we control the radii. */
export function roundRectPath(ctx: CanvasRenderingContext2D, b: Box, r: number) {
  const radius = Math.max(0, Math.min(r, b.w / 2, b.h / 2))
  const { x, y, w, h } = b
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export function fillRoundRect(ctx: CanvasRenderingContext2D, b: Box, r: number, fill: string) {
  ctx.beginPath()
  roundRectPath(ctx, b, r)
  ctx.fillStyle = fill
  ctx.fill()
}

export function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  b: Box,
  r: number,
  stroke: string,
  width = 2,
) {
  ctx.beginPath()
  roundRectPath(ctx, b, Math.max(0, r - width / 2))
  ctx.strokeStyle = stroke
  ctx.lineWidth = width
  ctx.stroke()
}

/** Fill the ring between `outer` and `inner` — the base of every decorative frame. */
export function fillRing(ctx: CanvasRenderingContext2D, outer: Box, inner: Box, outerR: number, innerR: number, fill: string) {
  ctx.beginPath()
  roundRectPath(ctx, outer, outerR)
  roundRectPath(ctx, inner, innerR)
  ctx.fillStyle = fill
  ctx.fill('evenodd')
}

/** Clip to a rounded rect, run `fn`, then restore. */
export function withClip(ctx: CanvasRenderingContext2D, b: Box, r: number, fn: () => void) {
  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, b, r)
  ctx.clip()
  fn()
  ctx.restore()
}

/** Clip to the ring between two boxes, so decorations can be painted freely inside it. */
export function withRingClip(
  ctx: CanvasRenderingContext2D,
  outer: Box,
  inner: Box,
  outerR: number,
  innerR: number,
  fn: () => void,
) {
  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, outer, outerR)
  roundRectPath(ctx, inner, innerR)
  ctx.clip('evenodd')
  fn()
  ctx.restore()
}

/**
 * Draw an image so it *covers* a box: scaled to fill, then centre-cropped.
 * This is the behaviour `object-fit: cover` gives in CSS, done manually because the
 * canvas has no equivalent.
 */
export function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, b: Box) {
  const scale = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight)
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  ctx.drawImage(img, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h)
}

/** Soft two-stop vertical gradient, used for the pastel "paper" behind the photos. */
export function paintPaper(ctx: CanvasRenderingContext2D, b: Box, colors: [string, string], radius: number) {
  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, b, radius)
  ctx.clip()

  const g = ctx.createLinearGradient(0, 0, 0, b.h)
  g.addColorStop(0, colors[0])
  g.addColorStop(1, colors[1])
  ctx.fillStyle = g
  ctx.fillRect(b.x, b.y, b.w, b.h)

  // A couple of big, very soft highlights so the paper does not look flat.
  for (const [cx, cy, r, alpha] of [
    [0.18, 0.08, 0.5, 0.22],
    [0.86, 0.94, 0.55, 0.16],
  ] as const) {
    const rg = ctx.createRadialGradient(b.x + cx * b.w, b.y + cy * b.h, 0, b.x + cx * b.w, b.y + cy * b.h, r * b.w)
    rg.addColorStop(0, `rgba(255,255,255,${alpha})`)
    rg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = rg
    ctx.fillRect(b.x, b.y, b.w, b.h)
  }
  ctx.restore()
}

/**
 * Walk the outline of a box at a fixed arc-length step, returning points plus the tangent
 * angle at each one. Frames use this to place flowers, hearts or perforations evenly along
 * any rectangle without hard-coding per-edge loops.
 */
export function walkPerimeter(
  b: Box,
  step: number,
): { x: number; y: number; angle: number }[] {
  const w = b.w
  const h = b.h
  const total = 2 * (w + h)
  const points: { x: number; y: number; angle: number }[] = []
  const at = (d: number) => {
    let t = d % total
    if (t < 0) t += total
    if (t < w) return { x: b.x + t, y: b.y, angle: 0 }
    t -= w
    if (t < h) return { x: b.x + w, y: b.y + t, angle: Math.PI / 2 }
    t -= h
    if (t < w) return { x: b.x + w - t, y: b.y + h, angle: Math.PI }
    t -= w
    return { x: b.x, y: b.y + h - t, angle: (3 * Math.PI) / 2 }
  }
  for (let d = step / 2; d < total; d += step) points.push(at(d))
  return points
}

/** Tiny deterministic PRNG so paper speckles never flicker between redraws. */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Read a font family from a real element so canvas matches the UI typography. */
export function fontStack(selector: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const el = document.querySelector(selector)
  const value = el ? getComputedStyle(el).fontFamily : ''
  return value && value !== 'serif' ? value : fallback
}