/**
 * Frame (paper border) definitions.
 *
 * A frame is described declaratively here — a `kind`, a thickness, a palette, and the
 * paper the photos sit on — and the actual painting lives in `engine/borders.ts`.
 * Adding a new look therefore means adding one entry here plus (optionally) one
 * painter, never touching the composer.
 *
 * The paper travels *with* the frame: picking a border picks the sheet that matches
 * it, so there is no separate background axis that can clash with the ring. Pale
 * sheets use the classic plum stamp ink; the dark family (Black → Eclipse, last five
 * entries) ships light ink with its sheet (`Paper.ink`) so keeps the footer readable
 * on a night background.
 *
 * `icon` is a Lucide icon *name*: `core/` stays free of React, the UI resolves the name.
 */
import type { Paper } from './types'

export type FrameKind = 'flat' | 'doodle' | 'floral' | 'hearts' | 'scallop' | 'film' | 'stripe' | 'ribbon' | 'stitch'

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
  /** The sheet the photos sit on — the background the composer paints under the ring. */
  paper: Paper
}

/** Sheets referenced by name below so a shared palette is visibly shared once. */
const rose: Paper = { colors: ['#FFF6FB', '#FFDCEA'], speckle: '#FF9EC4' }
const lilac: Paper = { colors: ['#F7F2FF', '#E4D8FF'], speckle: '#AE90FF' }
const sheetMint: Paper = { colors: ['#F2FFFA', '#CFF4E5'], speckle: '#5CCFAE' }
const custard: Paper = { colors: ['#FFFCEF', '#FFF1CB'], speckle: '#FFC44D' }
const sheetSky: Paper = { colors: ['#F1FAFF', '#D2EBFF'], speckle: '#74BAFF' }
const cream: Paper = { colors: ['#FFFDFA', '#F7EFFA'], speckle: '#453458' }
const meadow: Paper = { colors: ['#FBFFF6', '#EAF9E4'], speckle: '#A8E6C4' }
const blossom: Paper = { colors: ['#FFF5F8', '#FFE1EC'], speckle: '#FF6FA5' }
const ice: Paper = { colors: ['#F4FBFF', '#DBF1FF'], speckle: '#7FC4F0' }
const newsprint: Paper = { colors: ['#FAFAF6', '#EFEDE4'], speckle: '#B9B4A4' }
const candy: Paper = { colors: ['#FFF7FB', '#FFE9F3'], speckle: '#BDE3FF' }
const giftWrap: Paper = { colors: ['#FFF4F8', '#FFE0EE'], speckle: '#FF8FB8' }
const linen: Paper = { colors: ['#FFF8F9', '#FFECF1'], speckle: '#D8799F' }

/** The dark family: night sheets carry light stamp ink so the footer stays legible. */
const soot: Paper = { colors: ['#332C3F', '#17131F'], speckle: '#6E6482', ink: { caption: '#F4EEFB', meta: '#BFB2D6' } }
const navy: Paper = { colors: ['#2A3358', '#161C36'], speckle: '#7D8FCB', ink: { caption: '#EAF0FF', meta: '#A9B8E8' } }
const graphiteSheet: Paper = { colors: ['#3A3348', '#211C2C'], speckle: '#8C7FAA', ink: { caption: '#F1EAFB', meta: '#C3B6DC' } }
const slate: Paper = { colors: ['#343D47', '#1E242B'], speckle: '#93A3B2', ink: { caption: '#F4F7FA', meta: '#B9C4CE' } }
const nightbloom: Paper = { colors: ['#332247', '#1B1230'], speckle: '#FF8FC4', ink: { caption: '#FBEFF7', meta: '#D2A8C8' } }

export const FRAMES: FrameDef[] = [
  { id: 'none', label: 'No frame', icon: 'circle-off', kind: 'flat', thickness: 0, paper: rose },
  { id: 'blush', label: 'Blush', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#FFB3CD', paper: rose },
  { id: 'lavender', label: 'Lavender', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#CBB6FF', paper: lilac },
  { id: 'mint', label: 'Mint', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#93E3C8', paper: sheetMint },
  { id: 'butter', label: 'Butter', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#FFE28A', paper: custard },
  { id: 'sky', label: 'Sky', icon: 'square', kind: 'flat', thickness: 0.045, fill: '#A5D6FF', paper: sheetSky },
  { id: 'doodle', label: 'Doodle', icon: 'pen-line', kind: 'doodle', thickness: 0.03, ink: '#453458', paper: cream },
  { id: 'floral', label: 'Floral', icon: 'flower', kind: 'floral', thickness: 0.055, ink: '#FF7FB0', accent: '#A8E6C4', paper: meadow },
  { id: 'hearts', label: 'Hearts', icon: 'heart', kind: 'hearts', thickness: 0.055, ink: '#FF6FA5', paper: blossom },
  { id: 'scallop', label: 'Scallop', icon: 'waves', kind: 'scallop', thickness: 0.05, fill: '#CFEBFF', ink: '#7FC4F0', paper: ice },
  { id: 'film', label: 'Film', icon: 'clapperboard', kind: 'film', thickness: 0.05, fill: '#FFFFFF', ink: '#453458', paper: newsprint },
  { id: 'stripe', label: 'Stripes', icon: 'candy', kind: 'stripe', thickness: 0.05, fill: '#FFD6E8', accent: '#BDE3FF', paper: candy },
  { id: 'ribbon', label: 'Ribbon', icon: 'gift', kind: 'ribbon', thickness: 0.05, fill: '#FFD9E8', accent: '#FF8FB8', paper: giftWrap },
  { id: 'stitch', label: 'Stitch', icon: 'scissors', kind: 'stitch', thickness: 0.05, fill: '#FFF1F4', ink: '#453458', paper: linen },

  // The dark family — same painters, night palettes.
  { id: 'black', label: 'Black', icon: 'square', kind: 'flat', thickness: 0.05, fill: '#17131F', paper: soot },
  { id: 'midnight', label: 'Midnight', icon: 'candy', kind: 'stripe', thickness: 0.05, fill: '#1D2440', accent: '#33406E', paper: navy },
  { id: 'graphite', label: 'Graphite', icon: 'scissors', kind: 'stitch', thickness: 0.05, fill: '#2B2634', ink: '#CFC4E6', paper: graphiteSheet },
  { id: 'chalk', label: 'Chalkboard', icon: 'pen-line', kind: 'doodle', thickness: 0.035, ink: '#F2ECFF', paper: slate },
  { id: 'eclipse', label: 'Eclipse', icon: 'heart', kind: 'hearts', thickness: 0.055, fill: '#1B1626', ink: '#FF8FC4', paper: nightbloom },
]

const BY_ID = new Map(FRAMES.map((f) => [f.id, f]))

export const frameById = (id: string): FrameDef => BY_ID.get(id) ?? FRAMES[0]
