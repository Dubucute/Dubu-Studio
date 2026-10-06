/**
 * Filter presets.
 *
 * The `css` string is the single source of truth for a filter. It is applied in three
 * places, so it must stay a plain CSS `filter` value:
 *   1. `style={{ filter }}` on the live <video> preview  -> what you see while shooting
 *   2. `ctx.filter` when a photo is drawn into the strip -> what ends up in the PNG
 *   3. the little filter thumbnails in the picker
 *
 * Sharing one string means the preview and the exported strip match exactly.
 */
export interface FilterDef {
  id: string
  label: string
  /** A valid CSS `filter` value, applied to video elements and canvas alike. */
  css: string
  /** Two swatch colours for the little circular preview chip. */
  swatch: [string, string]
}

export const FILTERS: FilterDef[] = [
  { id: 'original', label: 'Original', css: 'none', swatch: ['#F7F5FF', '#C9C2E8'] },
  { id: 'warm-vintage', label: 'Warm Vintage', css: 'sepia(0.32) saturate(1.2) contrast(0.94) brightness(1.06)', swatch: ['#F3D9BE', '#B98B63'] },
  { id: 'soft-cafe', label: 'Soft Cafe', css: 'sepia(0.16) saturate(0.92) contrast(0.9) brightness(1.08)', swatch: ['#E8D5C4', '#A98467'] },
  { id: 'golden-hour', label: 'Golden Hour', css: 'sepia(0.18) saturate(1.35) brightness(1.1) hue-rotate(-8deg)', swatch: ['#FFD79A', '#F08A5D'] },
  { id: 'pastel-dream', label: 'Pastel Dream', css: 'saturate(1.15) brightness(1.14) contrast(0.86) hue-rotate(6deg)', swatch: ['#FFE3F1', '#CDB8FF'] },
  { id: 'film-fade', label: 'Film Fade', css: 'contrast(0.9) saturate(0.85) brightness(1.07)', swatch: ['#E6E1DA', '#A9A29B'] },
  { id: 'cool-mist', label: 'Cool Mist', css: 'saturate(0.85) hue-rotate(-10deg) brightness(1.09) contrast(0.95)', swatch: ['#DCEBFF', '#8FB6E0'] },
  { id: 'sunny-day', label: 'Sunny Day', css: 'saturate(1.3) brightness(1.12) contrast(1.03)', swatch: ['#FFF2B8', '#FFC44D'] },
  { id: 'mono', label: 'B&W', css: 'grayscale(1) contrast(1.1)', swatch: ['#FFFFFF', '#8E8E93'] },
  { id: 'noir', label: 'Noir', css: 'grayscale(1) contrast(1.4) brightness(0.94)', swatch: ['#E7E7EA', '#4A4A52'] },
]

const BY_ID = new Map(FILTERS.map((f) => [f.id, f]))

/** Unknown ids fall back to the first filter instead of throwing in the renderer. */
export const filterById = (id: string): FilterDef => BY_ID.get(id) ?? FILTERS[0]