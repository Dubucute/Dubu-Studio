# Peachy Studio

A cute, privacy-first photobooth that runs entirely in the browser. Snap or upload photos, style
them, and download a high-resolution PNG strip — no sign-up, no uploads, no watermark.

![stack](https://img.shields.io/badge/Next.js-16-000?logo=next.js) ![react](https://img.shields.io/badge/React-19-087ea4?logo=react) ![tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
```

## Deploy to Vercel from git

The app is a stock Next.js App Router project, so Vercel needs no extra configuration.

1. Push this repository to GitHub, GitLab or Bitbucket.
2. In Vercel, **Add New → Project** and import the repo.
3. Leave the framework preset as *Next.js*. Vercel detects `npm run build` and the `.next`
   output; no environment variables are required.
4. Deploy. Every push to the production branch redeploys automatically.

Camera access needs a secure context, which Vercel's HTTPS domains provide. `localhost` works
for local development.

## How it works

Three layers, each depending only on the one below:

```
src/core/     pure logic — no React, no DOM
src/engine/   canvas + media — imperative, framework-free
src/state/    the Zustand store — the single owner of booth data
src/components/ React views — read state, call actions, render
```

| Module | Responsibility |
| --- | --- |
| `core/layouts.ts` | Layout definitions **and** all strip geometry (`stripMetrics`), in strip-width units |
| `core/filters.ts` | Filter presets as CSS `filter` strings, shared by the preview and the canvas |
| `core/stickers.ts` | Sticker shapes as vector primitives, plus the colour palette |
| `core/frames.ts` | Declarative frame definitions (kind, thickness, palette) |
| `core/design.ts` | Design defaults and the "which layout is legal right now" policy |
| `engine/compose.ts` | `renderStrip()` — the one renderer used by both preview and export |
| `engine/borders.ts` | Frame painters (doodle, floral, hearts, scallop, film, stripe, flat) |
| `engine/photo.ts` | Photo intake, downscaling, and the decoded-image cache |
| `engine/export.ts` | High-res PNG encoding, download and Web Share |
| `engine/camera.ts` | Webcam lifecycle and friendly error mapping |
| `engine/audio.ts` | Countdown and shutter cues, synthesised with the Web Audio API |
| `engine/samples.ts` | Procedurally drawn sample photos |

### Why stickers are shapes, not emoji

Each sticker is a list of primitives (`circle`, `ellipse`, `rect`, `poly`, `path`) in a 100×100
box. `engine/stickers.ts` fills them onto a canvas and `components/strip/StickerIcon.tsx` maps
them to SVG, so the editor and the exported PNG render the same artwork — identically on
Windows, macOS and Android, which emoji fonts cannot promise.

### Why preview and export match

`renderStrip(design, photos, width)` measures everything in strip-width units and multiplies by
the output width at the last moment. The preview calls it at roughly 600px, the download at
2400px. There is no second renderer to drift out of sync, and filters use one CSS string in
both the live `<video>` preview and `ctx.filter`.

### State ownership

- **Store (`state/useBoothStore.ts`)**: photos, the design, the current step. It also owns the
  policy that keeps the chosen layout valid when the photo count changes.
- **Components**: everything transient — the camera stream, countdown, drag position, selected
  sticker, export status.
- **Engine**: the decoded-image cache, which is a DOM resource rather than app state.

Derived data (which layouts are legal for N photos) is memoised in the components from the
photo count rather than duplicated in the store, so there is exactly one answer.

## Features

- Webcam capture with a 3-2-1 countdown, shutter flash and synthesised sound cues
- Upload by file picker or drag and drop, plus procedurally drawn samples for trying it out
- Seven strip layouts (classic strip, double strip, polaroid, pair, grids) with a generated
  column layout for any photo count
- Ten filters that apply live to the camera preview and to the exported strip
- Twelve decorative frames drawn procedurally (no image assets)
- Sixteen vector stickers, draggable, resizable, tiltable and recolourable
- Caption, location and date stamps
- 2400px PNG download with no watermark, plus Web Share where available
- Works from 320px phones to wide desktops; respects `prefers-reduced-motion`

## Privacy

Photos are read into memory, downscaled, and composited on a canvas in the browser tab. There
is no server, no account and no analytics. Fonts are self-hosted by `next/font`, so the app
makes no third-party requests at runtime.