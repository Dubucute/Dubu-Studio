/**
 * Export: compose at print-ish resolution, encode a PNG, save or share it.
 *
 * Nothing is uploaded — the bytes are produced from a canvas in this tab and handed to the
 * browser's own download or share sheet. No watermark, no account, no server.
 */
import type { Photo, StripDesign } from '@/core/types'
import { EXPORT_WIDTH, renderStrip } from './compose'
import { ensureImages } from './photo'

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the photo strip'))),
      type,
      quality,
    )
  })

/**
 * Render the strip at high resolution and return it as a PNG blob.
 * Fonts and images are awaited first so emoji and rounded type never render as fallback.
 */
export async function exportStripPng(
  design: StripDesign,
  photos: Photo[],
  width = EXPORT_WIDTH,
): Promise<Blob> {
  await ensureImages(photos)
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready.catch(() => undefined)
  }
  const canvas = renderStrip(design, photos, width)
  return toBlob(canvas, 'image/png')
}

export const suggestedFilename = (date = new Date()): string => {
  const stamp = date.toISOString().slice(0, 10)
  return `peachy-strip-${stamp}.png`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before dropping the URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Use the native share sheet when it can take a file; return false when unavailable. */
export async function shareBlob(blob: Blob, filename: string): Promise<boolean> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (!nav.share || !nav.canShare) return false
  const file = new File([blob], filename, { type: blob.type })
  if (!nav.canShare({ files: [file] })) return false
  try {
    await nav.share({ files: [file], title: 'My photo strip' })
    return true
  } catch {
    return false
  }
}