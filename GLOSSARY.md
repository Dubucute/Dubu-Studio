# Dubu Studio — Glossary

Domain names used across the code and its docs. The code is the definition; entries here
exist so a proposal can say a name and be understood.

**Footer** — the band of the strip below the photos, from `metrics.footerTop` to the
bottom edge. Geometry lives in `core/layouts.ts` (`stripMetrics`).

**Stamp** — the caption / place / date marking painted in the footer. The stamp module
(`engine/footer.ts`) owns everything about it: where the lines sit, how text shrinks when
it runs long, and how much room the frame takes from the footer. Its data is `StampText`
(`core/types.ts`).

**Ring depth** — how many pixels the active frame's ring actually eats into the strip,
answered by exactly one function: `frameDepthPx` (`engine/borders.ts`). It is 0 when the
frame is too thin to paint, so a frame that is not drawn reserves nothing — not from the
photos, and not from the stamp.

**Paper** — the speckled sheet the photos sit on. It belongs to the frame, not to
the design: every `FrameDef` carries the `Paper` (`colors`, `speckle`) whose palette
matches its ring, so picking a border picks the background. The composer paints the
paper first and the frame's cut-outs show it through. Pale sheets use the classic
plum **Stamp** ink; the dark family of frames ships light ink with its sheet
(`Paper.ink`), because a night sheet and plum type would swallow the footer.
