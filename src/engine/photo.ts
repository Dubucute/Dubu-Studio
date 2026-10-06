/**
 * Photo intake and the decoded-image cache.
 *
 * Photos are stored as downscaled data URLs. That costs a bit of memory but means the
 * whole strip — capture, edit, export — happens on one device with zero network calls,
 * which is the privacy promise this app makes.
 *
 * The image cache is a module-level `Map` on purpose: decoded `HTMLImageElement`s are DOM
 * resources, not application state, so they do not belong in the store.
 */
import { createId } from '@/core/ids'
import type { Photo } from '@/core/types'

/** Longest edge kept for any photo. Keeps memory sane on phones. */
const MAX_EDGE = 1600

const cache = new Map<string, HTMLImageElement>()

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = src
  })

/** Synchronous cache lookup used by the composer; `null` means "not decoded yet". */
export const imageFor = (photo: Photo): HTMLImageElement | null => cache.get(photo.id) ?? null

/** Decode every photo (deduped by id). Resolves even if one image fails. */
export async function ensureImages(photos: Photo[]): Promise<void> {
  await Promise.all(
    photos.map(async (photo) => {
      const cached = cache.get(photo.id)
      if (cached && cached.complete && cached.naturalWidth > 0) return
      try {
        cache.set(photo.id, await loadImage(photo.src))
      } catch {
        // A broken photo should not take the whole strip down; the composer draws a placeholder.
      }
    }),
  )
}

const photoFromCanvas = (canvas: HTMLCanvasElement, id = createId('ph')): Photo => ({
  id,
  src: canvas.toDataURL('image/jpeg', 0.92),
  width: canvas.width,
  height: canvas.height,
})

function drawScaled(img: HTMLImageElement, maxEdge: number, mirror = false): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

/** Turn a user-picked file into a downscaled `Photo`. */
export async function fileToPhoto(file: File): Promise<Photo> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return photoFromCanvas(drawScaled(img, MAX_EDGE))
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Copy the current video frame into a `Photo`. `mirror` matches the live preview. */
export async function grabVideoFrame(
  video: HTMLVideoElement,
  { mirror = false }: { mirror?: boolean } = {},
): Promise<Photo> {
  const w = video.videoWidth || video.clientWidth
  const h = video.videoHeight || video.clientHeight
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  if (mirror) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return photoFromCanvas(canvas)
}