/**
 * Frame (paper border) definitions.
 *
 * A frame is described declaratively here — a `kind`, a thickness and a palette — and the
 * actual painting lives in `engine/borders.ts`. Adding a new look therefore means adding
 * one entry here plus (optionally) one painter, never touching the composer.
 *
 * `icon` is a Lucide icon *name*: `core/` stays free of React, the UI resolves the name.
 */
export type FrameKind = 'flat' | 'doodle' | 'floral' | 'hearts' | 'scallop' | 'film' | 'stripe'

export interface FrameDef {
  id: string
  label: string
  icon: string
  kind: FrameKind
  /** Border thickness as a fraction of the strip width. */
  thickness: number
  /** Solid paper colour used by `flat`, `scallop` and `film`. */
  fill?: string
  /** Ink used for strokes and shapes. */
  ink?: string
  /** Secondary colour for two-tone effects (floral leaves, stripe pairs). */
  accent?: string
}

export const FRAMES: FrameDef[] = [
  { id: 'none', label: 'No frame', icon: 'circle-off', kind: 'flat', thickness: 0 },
  { id: 'blush', label: 'Blush', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#FFB3CD' },
  { id: 'lavender', label: 'Lavender', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#CBB6FF' },
  { id: 'mint', label: 'Mint', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#93E3C8' },
  { id: 'butter', label: 'Butter', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#FFE28A' },
  { id: 'sky', label: 'Sky', icon: 'square', kind: 'flat', thickness: 0.045, fill: '#A5D6FF' },
  { id: 'doodle', label: 'Doodle', icon: 'pen-line', kind: 'doodle', thickness: 0.03, ink: '#453458' },
  { id: 'floral', label: 'Floral', icon: 'flower', kind: 'floral', thickness: 0.055, ink: '#FF7FB0', accent: '#A8E6C4' },
  { id: 'hearts', label: 'Hearts', icon: 'heart', kind: 'hearts', thickness: 0.055, ink: '#FF6FA5' },
  { id: 'scallop', label: 'Scallop', icon: 'waves', kind: 'scallop', thickness: 0.05, fill: '#CFEBFF', ink: '#7FC4F0' },
  { id: 'film', label: 'Film', icon: 'clapperboard', kind: 'film', thickness: 0.05, fill: '#FFFFFF', ink: '#453458' },
  { id: 'stripe', label: 'Stripes', icon: 'candy', kind: 'stripe', thickness: 0.05, fill: '#FFD6E8', accent: '#BDE3FF' },
]

const BY_ID = new Map(FRAMES.map((f) => [f.id, f]))

export const frameById = (id: string): FrameDef => BY_ID.get(id) ?? FRAMES[0]