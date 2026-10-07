/**
 * Strip layouts and their geometry.
 *
 * Geometry is expressed in *strip-width units*: x runs 0..1 across the strip, y runs
 * 0..`height`. The renderer multiplies everything by the output pixel width, so a single
 * layout definition drives both the on-screen preview and the 2400px export — the canvas
 * never has to know whether it is drawing a thumbnail or a print.
 */
export interface Layout {
  id: string
  label: string
  /** Name of a Lucide icon, resolved by the UI layer. */
  icon: string
  cols: number
  rows: number
  /** width / height of one photo cell. */
  photoAspect: number
  /** Outer margin, as a fraction of the strip width. */
  pad: number
  /** Gap between cells, as a fraction of the strip width. */
  gap: number
  /** Space reserved at the bottom for the caption stamp, as a fraction of the width. */
  footer: number
  /** Cell corner rounding, as a fraction of the strip width. */
  radius: number
  /** `ring` = thin white hairline, `polaroid` = thick white frame with caption space. */
  cell: 'ring' | 'polaroid'
  /** Polaroid frame thickness, as a fraction of the strip width. */
  frame: number
}

/** One photo slot in strip-width units. */
export interface Cell {
  x: number
  y: number
  w: number
  h: number
}

export interface Metrics {
  /** Always 1: the strip box is the unit box. */
  width: number
  /** Total height, in strip-width units (so aspect ratio = height). */
  height: number
  cells: Cell[]
  /** y where the footer stamp starts. */
  footerTop: number
  /** Individual cell geometry, reused by the renderer for frames and placeholders. */
  cellW: number
  cellH: number
}

export const LAYOUTS: Layout[] = [
  {
    id: 'strip-2',
    label: 'Pair',
    icon: 'rows',
    cols: 1,
    rows: 2,
    photoAspect: 4 / 3,
    pad: 0.07,
    gap: 0.03,
    footer: 0.14,
    radius: 0.035,
    cell: 'ring',
    frame: 0,
  },
  {
    id: 'strip-4',
    label: 'Classic Strip',
    icon: 'film',
    cols: 1,
    rows: 4,
    photoAspect: 4 / 3,
    pad: 0.07,
    gap: 0.028,
    footer: 0.13,
    radius: 0.035,
    cell: 'ring',
    frame: 0,
  },
  {
    id: 'strip-6',
    label: 'Double Strip',
    icon: 'ticket',
    cols: 2,
    rows: 3,
    photoAspect: 4 / 3,
    pad: 0.06,
    gap: 0.026,
    footer: 0.12,
    radius: 0.03,
    cell: 'ring',
    frame: 0,
  },
  {
    id: 'polaroid-4',
    label: 'Polaroid',
    icon: 'images',
    cols: 2,
    rows: 2,
    photoAspect: 1,
    pad: 0.07,
    gap: 0.055,
    footer: 0.11,
    radius: 0.012,
    cell: 'polaroid',
    frame: 0.055,
  },
  {
    id: 'grid-2',
    label: 'Best Two',
    icon: 'heart',
    cols: 2,
    rows: 1,
    photoAspect: 1,
    pad: 0.07,
    gap: 0.03,
    footer: 0.14,
    radius: 0.04,
    cell: 'ring',
    frame: 0,
  },
  {
    id: 'grid-4',
    label: 'Square Grid',
    icon: 'grid',
    cols: 2,
    rows: 2,
    photoAspect: 1,
    pad: 0.06,
    gap: 0.028,
    footer: 0.12,
    radius: 0.035,
    cell: 'ring',
    frame: 0,
  },
  {
    id: 'grid-6',
    label: 'Postcard Six',
    icon: 'layout-grid',
    cols: 3,
    rows: 2,
    photoAspect: 1,
    pad: 0.05,
    gap: 0.024,
    footer: 0.11,
    radius: 0.028,
    cell: 'ring',
    frame: 0,
  },
]

const BY_ID = new Map(LAYOUTS.map((l) => [l.id, l]))

export const layoutById = (id: string): Layout | undefined => BY_ID.get(id)

/** A vertical stack that fits any photo count (used for 1, 3, 5, 7, 8 photos). */
export const columnLayout = (photos: number): Layout => ({
  ...LAYOUTS[0],
  id: `column-${photos}`,
  label: `Column ${photos}`,
  icon: 'rows',
  rows: photos,
})

/**
 * Which layouts may be offered for a given number of photos.
 *
 * Policy: a layout is only offered when its slot count matches the photo count exactly, so a
 * layout can never quietly drop photos. Counts no fixed layout fits get a generated vertical
 * column, which always fits.
 */
export function selectableLayouts(photoCount: number): Layout[] {
  const exact = LAYOUTS.filter((l) => l.cols * l.rows === photoCount)
  return exact.length > 0 ? exact : [columnLayout(photoCount)]
}

/**
 * Geometry for a layout. Pure: same input, same numbers, no DOM.
 *
 * The slot count comes from the layout, never from the photo count — the caller guarantees a
 * layout whose slots match the photos (see `selectableLayouts`).
 */
export function stripMetrics(layout: Layout): Metrics {
  const cols = layout.cols
  const rows = layout.rows
  // `cellW`/`cellH` always describe the whole cell including any polaroid frame;
  // the photo inside is inset by the frame.
  const cellW = (1 - layout.pad * 2 - layout.gap * (cols - 1)) / cols
  const frame = layout.cell === 'polaroid' ? layout.frame : 0
  const photoW = cellW - frame * 2
  const photoH = photoW / layout.photoAspect
  const cellH = frame ? photoH + frame * 1.15 : photoH

  const gridH = rows * cellH + layout.gap * (rows - 1)
  const footerTop = layout.pad * 2 + gridH
  const cells: Cell[] = []

  for (let i = 0; i < rows * cols; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    cells.push({
      x: layout.pad + col * (cellW + layout.gap),
      y: layout.pad + row * (cellH + layout.gap),
      w: cellW,
      h: cellH,
    })
  }

  return { width: 1, height: footerTop + layout.footer, cells, footerTop, cellW, cellH }
}