/**
 * Core types shared by every layer.
 *
 * Layering rule for this app (dependencies only ever point this way):
 *   core  <-  engine  (canvas + media, no UI)
 *   core  <-  state   (Zustand store, no UI)
 *   core + engine + state  <-  components (React)
 *
 * Nothing in `core/` may import React, the DOM, or the store.
 */

/** One captured or uploaded picture, already downscaled to a web-friendly size. */
export interface Photo {
  id: string
  /** Data URL. Kept in memory so the whole strip stays client-side. */
  src: string
  width: number
  height: number
}

/**
 * A sticker placed on the strip.
 *
 * Position and size are stored *normalized* (fractions of the strip box) instead of
 * pixels. That is what lets the on-screen preview and the high-res export be the exact
 * same drawing code at different output widths — see `engine/compose.ts`.
 */
export interface Sticker {
  id: string
  /** Key into `STICKERS` — the vector shape set, never an emoji. */
  defId: string
  /** Center x, 0..1 across the strip. */
  x: number
  /** Center y, 0..1 down the strip. */
  y: number
  /** Diameter as a fraction of the strip width. */
  size: number
  /** Rotation in degrees. */
  rotation: number
  /** Fill hex, from the sticker palette. */
  color: string
}

/** The optional caption / date / location stamp under the photos. */
export interface StampText {
  caption: string
  place: string
  showDate: boolean
  /** Pre-formatted string so server and client can never disagree about locale. */
  date: string
}

/** The two ink colours the footer stamp paints with: caption, then the place/date row. */
export interface StampInk {
  caption: string
  meta: string
}

/**
 * The paper background the photos sit on: a two-stop vertical gradient plus a speckle
 * accent. Each frame carries the sheet that matches its border (`core/frames.ts`), so
 * background and frame are always chosen together.
 */
export interface Paper {
  /** [top, bottom] gradient stops. Pale sheets pair with the classic plum stamp ink. */
  colors: [string, string]
  /** Accent colour for the scattered paper speckles. */
  speckle: string
  /**
   * Stamp ink override for the dark family of sheets — pale plum text vanishes on a
   * night sheet, so the sheet that needs light type says so here. Omitted means the
   * stamp's classic plum pair.
   */
  ink?: StampInk
}

/** Everything about how a strip looks. The photos themselves live beside it. */
export interface StripDesign {
  filterId: string
  layoutId: string
  frameId: string
  stickers: Sticker[]
  text: StampText
}

export type Step = 'capture' | 'customize' | 'result'

/**
 * The three guided steps shown in the stepper.
 * `icon` is a name the UI resolves to a Lucide component — `core/` never imports React.
 */
export const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'capture', label: 'Snap', icon: 'camera' },
  { id: 'customize', label: 'Style', icon: 'palette' },
  { id: 'result', label: 'Save', icon: 'download' },
]