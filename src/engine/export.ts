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
  return `dubu-strip-${stamp}.png`
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

/**
 * Use the native share sheet when it can take a file. Desktop browsers usually refuse
 * image files, so this reports *why* it did not work and the caller picks a fallback:
 * share a link to the app, then copy the link. A cancel is its own outcome — dismissing
 * the share sheet is not "unavailable".
 */
export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported'

export async function shareBlob(blob: Blob, filename: string): Promise<ShareOutcome> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (!nav.share || !nav.canShare) return 'unsupported'
  const file = new File([blob], filename, { type: blob.type })
  if (!nav.canShare({ files: [file] })) return 'unsupported'
  try {
    await nav.share({ files: [file], title: 'My photo strip' })
    return 'shared'
  } catch (err) {
    return (err as DOMException)?.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

/** Link-share fallback for browsers that reject files but do have a share sheet. */
export async function sharePageLink(): Promise<ShareOutcome> {
  if (!navigator.share) return 'unsupported'
  try {
    await navigator.share({
      title: 'Dubu Studio — photo strips made in your browser',
      text: 'Make a cute photo strip — every photo stays on your own device.',
      url: window.location.href,
    })
    return 'shared'
  } catch (err) {
    return (err as DOMException)?.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

/** Last resort: the clipboard. True when the link landed there. */
export async function copyPageLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    return true
  } catch {
    return false
  }
}