/**
 * Sticker library — vector shapes, no emoji.
 *
 * Each sticker is a list of primitives in a 100x100 box. Two renderers consume that same
 * list: `engine/stickers.ts` fills them onto a canvas (for the exported PNG) and
 * `components/strip/StickerIcon.tsx` maps them to SVG (for the interactive preview). One
 * definition therefore renders identically in both places — and identically on Windows,
 * macOS and Android, which emoji fonts cannot promise.
 *
 * Colours live here too, so a sticker recoloured by the user is still one value in one place.
 */
import type { Sticker } from './types'

export type Shape =
  | { t: 'circle'; cx: number; cy: number; r: number; ink?: boolean }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot?: number; ink?: boolean }
  | { t: 'rect'; x: number; y: number; w: number; h: number; r?: number; rot?: number; ink?: boolean }
  | { t: 'poly'; pts: [number, number][]; rot?: number; ink?: boolean }
  | { t: 'path'; d: string; ink?: boolean }

export type StickerGroupId = 'heart' | 'sparkle' | 'nature' | 'cute' | 'party'

export interface StickerDef {
  id: string
  name: string
  group: StickerGroupId
  shapes: Shape[]
  /** Default fill; the user can recolour any sticker from the palette. */
  color: string
}

export const STICKER_GROUPS: { id: StickerGroupId; label: string }[] = [
  { id: 'heart', label: 'Hearts' },
  { id: 'sparkle', label: 'Sparkles' },
  { id: 'nature', label: 'Garden' },
  { id: 'cute', label: 'Cute' },
  { id: 'party', label: 'Party' },
]

export const STICKER_COLORS = [
  '#FF8FB8',
  '#FFB3CD',
  '#AE90FF',
  '#93E3C8',
  '#FFC44D',
  '#FF9A76',
  '#74BAFF',
  '#453458',
] as const

/** Dark fills need light detail (eyes, dots); everything else keeps the plum ink. */
export function inkFor(color: string): string {
  const hex = color.replace('#', '')
  if (hex.length < 6) return '#453458'
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance < 0.42 ? '#FFFFFF' : '#453458'
}

const HEART = 'M50 86 C50 86 12 62 12 38 C12 24 22 16 33 16 C41 16 47 20 50 26 C53 20 59 16 67 16 C78 16 88 24 88 38 C88 62 50 86 50 86 Z'

export const STICKERS: StickerDef[] = [
  {
    id: 'heart',
    name: 'Heart',
    group: 'heart',
    color: '#FF8FB8',
    shapes: [{ t: 'path', d: HEART }],
  },
  {
    id: 'bow',
    name: 'Bow',
    group: 'heart',
    color: '#FF8FB8',
    shapes: [
      { t: 'path', d: 'M50 52 C32 26 12 32 14 52 C16 72 34 76 50 52 Z' },
      { t: 'path', d: 'M50 52 C68 26 88 32 86 52 C84 72 66 76 50 52 Z' },
      { t: 'circle', cx: 50, cy: 52, r: 9, ink: true },
    ],
  },
  {
    id: 'cherry',
    name: 'Cherries',
    group: 'heart',
    color: '#FF7B94',
    shapes: [
      { t: 'rect', x: 28, y: 12, w: 5, h: 38, r: 2.5, rot: -18 },
      { t: 'rect', x: 67, y: 12, w: 5, h: 38, r: 2.5, rot: 18 },
      { t: 'ellipse', cx: 68, cy: 16, rx: 12, ry: 5, rot: -28 },
      { t: 'circle', cx: 30, cy: 66, r: 17 },
      { t: 'circle', cx: 70, cy: 66, r: 17 },
    ],
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    group: 'sparkle',
    color: '#AE90FF',
    shapes: [
      { t: 'poly', pts: [[50, 6], [58, 42], [94, 50], [58, 58], [50, 94], [42, 58], [6, 50], [42, 42]] },
      { t: 'poly', pts: [[82, 8], [85, 17], [94, 20], [85, 23], [82, 32], [79, 23], [70, 20], [79, 17]] },
    ],
  },
  {
    id: 'star',
    name: 'Star',
    group: 'sparkle',
    color: '#FFC44D',
    shapes: [
      {
        t: 'poly',
        pts: [
          [50, 6], [75.9, 16.4], [66.7, 46.6], [91.8, 65.6], [60.3, 66.2], [50, 94],
          [39.7, 66.2], [8.2, 65.6], [33.3, 46.6], [24.1, 16.4],
        ],
      },
    ],
  },
  {
    id: 'moon',
    name: 'Moon',
    group: 'sparkle',
    color: '#FFE28A',
    shapes: [
      { t: 'path', d: 'M64 8 A46 46 0 1 0 64 92 A36 36 0 1 1 64 8 Z' },
      { t: 'poly', pts: [[18, 20], [21, 29], [30, 32], [21, 35], [18, 44], [15, 35], [6, 32], [15, 29]] },
    ],
  },
  {
    id: 'flower',
    name: 'Flower',
    group: 'nature',
    color: '#FF8FB8',
    shapes: [
      { t: 'ellipse', cx: 50, cy: 30, rx: 17, ry: 11, rot: -90 },
      { t: 'ellipse', cx: 69, cy: 43.8, rx: 17, ry: 11, rot: -18 },
      { t: 'ellipse', cx: 61.8, cy: 66.2, rx: 17, ry: 11, rot: 54 },
      { t: 'ellipse', cx: 38.2, cy: 66.2, rx: 17, ry: 11, rot: 126 },
      { t: 'ellipse', cx: 31, cy: 43.8, rx: 17, ry: 11, rot: 198 },
      { t: 'circle', cx: 50, cy: 50, r: 13, ink: true },
    ],
  },
  {
    id: 'leaf',
    name: 'Leaf',
    group: 'nature',
    color: '#5CCFAE',
    shapes: [
      { t: 'path', d: 'M50 92 C18 70 18 32 50 8 C82 32 82 70 50 92 Z' },
      { t: 'rect', x: 47, y: 24, w: 6, h: 56, r: 3, ink: true },
    ],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    group: 'nature',
    color: '#AE90FF',
    shapes: [
      { t: 'ellipse', cx: 30, cy: 38, rx: 20, ry: 15, rot: -25 },
      { t: 'ellipse', cx: 70, cy: 38, rx: 20, ry: 15, rot: 25 },
      { t: 'ellipse', cx: 31, cy: 68, rx: 16, ry: 11, rot: 22 },
      { t: 'ellipse', cx: 69, cy: 68, rx: 16, ry: 11, rot: -22 },
      { t: 'ellipse', cx: 50, cy: 54, rx: 5, ry: 24, ink: true },
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    group: 'nature',
    color: '#A5D6FF',
    shapes: [
      { t: 'circle', cx: 32, cy: 58, r: 19 },
      { t: 'circle', cx: 50, cy: 44, r: 25 },
      { t: 'circle', cx: 69, cy: 58, r: 17 },
      { t: 'rect', x: 28, y: 54, w: 45, h: 18, r: 9 },
    ],
  },
  {
    id: 'smile',
    name: 'Smiley',
    group: 'cute',
    color: '#FFC44D',
    shapes: [
      { t: 'circle', cx: 50, cy: 50, r: 43 },
      { t: 'circle', cx: 36, cy: 40, r: 5.5, ink: true },
      { t: 'circle', cx: 64, cy: 40, r: 5.5, ink: true },
      { t: 'path', d: 'M31 58 A19 19 0 0 1 69 58 A14 14 0 0 0 31 58 Z', ink: true },
    ],
  },
  {
    id: 'paw',
    name: 'Paw',
    group: 'cute',
    color: '#C3A6FF',
    shapes: [
      { t: 'ellipse', cx: 50, cy: 68, rx: 26, ry: 21 },
      { t: 'circle', cx: 24, cy: 34, r: 10 },
      { t: 'circle', cx: 41, cy: 20, r: 10 },
      { t: 'circle', cx: 61, cy: 20, r: 10 },
      { t: 'circle', cx: 77, cy: 34, r: 10 },
    ],
  },
  {
    id: 'cupcake',
    name: 'Cupcake',
    group: 'cute',
    color: '#FFB3CD',
    shapes: [
      { t: 'poly', pts: [[26, 48], [74, 48], [66, 88], [34, 88]] },
      { t: 'circle', cx: 50, cy: 42, r: 21 },
      { t: 'circle', cx: 50, cy: 16, r: 7, ink: true },
    ],
  },
  {
    id: 'gift',
    name: 'Gift',
    group: 'party',
    color: '#93E3C8',
    shapes: [
      { t: 'ellipse', cx: 37, cy: 22, rx: 12, ry: 8, rot: -25 },
      { t: 'ellipse', cx: 63, cy: 22, rx: 12, ry: 8, rot: 25 },
      { t: 'circle', cx: 50, cy: 22, r: 6, ink: true },
      { t: 'rect', x: 12, y: 32, w: 76, h: 18, r: 9 },
      { t: 'rect', x: 16, y: 46, w: 68, h: 40, r: 8 },
      { t: 'rect', x: 45, y: 32, w: 10, h: 54, r: 4, ink: true },
    ],
  },
  {
    id: 'crown',
    name: 'Crown',
    group: 'party',
    color: '#FFC44D',
    shapes: [
      { t: 'poly', pts: [[12, 70], [22, 26], [38, 50], [50, 16], [62, 50], [78, 26], [88, 70]] },
      { t: 'rect', x: 12, y: 66, w: 76, h: 18, r: 8 },
      { t: 'circle', cx: 33, cy: 75, r: 4, ink: true },
      { t: 'circle', cx: 50, cy: 75, r: 4, ink: true },
      { t: 'circle', cx: 67, cy: 75, r: 4, ink: true },
    ],
  },
  {
    id: 'bubble',
    name: 'Speech bubble',
    group: 'party',
    color: '#FFB3CD',
    shapes: [
      { t: 'rect', x: 8, y: 14, w: 84, h: 54, r: 18 },
      { t: 'poly', pts: [[30, 64], [30, 92], [56, 64]] },
      { t: 'circle', cx: 32, cy: 41, r: 5, ink: true },
      { t: 'circle', cx: 50, cy: 41, r: 5, ink: true },
      { t: 'circle', cx: 68, cy: 41, r: 5, ink: true },
    ],
  },
]

const BY_ID = new Map(STICKERS.map((s) => [s.id, s]))

export const stickerById = (id: string): StickerDef | undefined => BY_ID.get(id)
export const stickersInGroup = (group: StickerGroupId): StickerDef[] =>
  STICKERS.filter((s) => s.group === group)

/** Fraction of strip width for a freshly dropped sticker. */
export const DEFAULT_STICKER_SIZE = 0.17
export const MIN_STICKER_SIZE = 0.08
export const MAX_STICKER_SIZE = 0.42

export const clampSticker = (s: Sticker): Sticker => ({
  ...s,
  // Clamp so a sticker can never be dragged completely off the strip.
  x: Math.min(0.99, Math.max(0.01, s.x)),
  y: Math.min(0.99, Math.max(0.01, s.y)),
  size: Math.min(MAX_STICKER_SIZE, Math.max(MIN_STICKER_SIZE, s.size)),
})