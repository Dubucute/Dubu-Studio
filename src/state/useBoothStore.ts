'use client'

/**
 * The store is the single owner of booth state.
 *
 * What lives here: durable app data (photos, the design, which step you are on) and the
 * actions that mutate it. What deliberately does *not* live here:
 *   - derived data (which layouts are legal for N photos) — components memoise it from the
 *     photo count, so there is one answer rather than two copies that can disagree
 *   - hardware resources (the camera stream) — owned by the camera component
 *   - view-only state (drag position, countdown) — owned by the component doing the work
 */
import { create } from 'zustand'
import { createDesign, createSticker, resolveLayoutId, todayStamp } from '@/core/design'
import { clampSticker } from '@/core/stickers'
import type { Photo, Step, Sticker, StripDesign } from '@/core/types'

/** Hard cap so a 40-photo dump cannot melt a phone. */
export const MAX_PHOTOS = 9

interface BoothStore {
  step: Step
  photos: Photo[]
  design: StripDesign
  /** Mirror the selfie preview (and the captured frame) like a real mirror. */
  mirror: boolean
  sound: boolean

  goTo: (step: Step) => void
  next: () => void
  back: () => void

  addPhotos: (incoming: Photo[]) => void
  removePhoto: (id: string) => void
  clearPhotos: () => void
  /** Swap two photos' positions in the roll, so the strip order changes too. */
  swapPhotos: (a: string, b: string) => void

  setFilter: (id: string) => void
  setLayout: (id: string) => void
  setFrame: (id: string) => void

  addSticker: (glyph: string, x?: number, y?: number) => void
  moveSticker: (id: string, x: number, y: number) => void
  patchSticker: (id: string, patch: Partial<Sticker>) => void
  removeSticker: (id: string) => void
  clearStickers: () => void

  setCaption: (caption: string) => void
  setPlace: (place: string) => void
  toggleDate: () => void

  toggleMirror: () => void
  toggleSound: () => void
  startOver: () => void
}

/** Keep the chosen layout legal whenever the photo count changes. */
const withLayout = (design: StripDesign, photoCount: number): StripDesign => ({
  ...design,
  layoutId: resolveLayoutId(design, photoCount),
})

export const useBoothStore = create<BoothStore>((set, get) => ({
  step: 'capture',
  photos: [],
  design: createDesign(),
  mirror: true,
  sound: true,

  goTo: (step) => set({ step }),
  next: () => set((s) => ({ step: s.step === 'capture' ? 'customize' : 'result' })),
  back: () => set((s) => ({ step: s.step === 'result' ? 'customize' : 'capture' })),

  addPhotos: (incoming) =>
    set((s) => {
      const photos = [...s.photos, ...incoming].slice(0, MAX_PHOTOS)
      return { photos, design: withLayout(s.design, photos.length) }
    }),

  removePhoto: (id) =>
    set((s) => {
      const photos = s.photos.filter((p) => p.id !== id)
      return { photos, design: withLayout(s.design, photos.length) }
    }),

  clearPhotos: () =>
    set((s) => ({ photos: [], design: withLayout(s.design, 0) })),

  swapPhotos: (a, b) =>
    set((s) => {
      const from = s.photos.findIndex((p) => p.id === a)
      const to = s.photos.findIndex((p) => p.id === b)
      if (from < 0 || to < 0 || from === to) return s
      const photos = [...s.photos]
      ;[photos[from], photos[to]] = [photos[to], photos[from]]
      return { photos }
    }),

  setFilter: (id) => set((s) => ({ design: { ...s.design, filterId: id } })),
  setLayout: (id) => set((s) => ({ design: { ...s.design, layoutId: id } })),
  setFrame: (id) => set((s) => ({ design: { ...s.design, frameId: id } })),

  addSticker: (glyph, x = 0.5, y = 0.5) =>
    set((s) => ({
      design: { ...s.design, stickers: [...s.design.stickers, clampSticker(createSticker(glyph, x, y))] },
    })),

  moveSticker: (id, x, y) =>
    set((s) => ({
      design: {
        ...s.design,
        stickers: s.design.stickers.map((st) => (st.id === id ? clampSticker({ ...st, x, y }) : st)),
      },
    })),

  patchSticker: (id, patch) =>
    set((s) => ({
      design: {
        ...s.design,
        stickers: s.design.stickers.map((st) => (st.id === id ? clampSticker({ ...st, ...patch }) : st)),
      },
    })),

  removeSticker: (id) =>
    set((s) => ({
      design: { ...s.design, stickers: s.design.stickers.filter((st) => st.id !== id) },
    })),

  clearStickers: () => set((s) => ({ design: { ...s.design, stickers: [] } })),

  setCaption: (caption) => set((s) => ({ design: { ...s.design, text: { ...s.design.text, caption } } })),
  setPlace: (place) => set((s) => ({ design: { ...s.design, text: { ...s.design.text, place } } })),
  toggleDate: () =>
    set((s) => ({ design: { ...s.design, text: { ...s.design.text, showDate: !s.design.text.showDate } } })),

  toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
  toggleSound: () => set((s) => ({ sound: !s.sound })),

  startOver: () =>
    set({
      step: 'capture',
      photos: [],
      design: createDesign(todayStamp()),
      mirror: get().mirror,
      sound: get().sound,
    }),
}))