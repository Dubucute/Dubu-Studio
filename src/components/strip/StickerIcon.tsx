'use client'

/**
 * SVG renderer for the sticker shape data in `core/stickers.ts`.
 *
 * This is the DOM twin of `drawStickerDef` in `engine/stickers.ts`: same shape list, same
 * offsets, same ink colours. That is what keeps the editor honest — what you drag around is
 * exactly what gets exported.
 */
import { inkFor, type Shape, type StickerDef } from '@/core/stickers'

function ShapeNode({ shape, fill }: { shape: Shape; fill: string }) {
  const colour = shape.ink ? undefined : fill
  const common = { fill: colour ?? fill }

  switch (shape.t) {
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />
    case 'ellipse':
      return (
        <ellipse
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          {...common}
          transform={shape.rot ? `rotate(${shape.rot} ${shape.cx} ${shape.cy})` : undefined}
        />
      )
    case 'rect':
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.r ?? 0}
          {...common}
          transform={
            shape.rot
              ? `rotate(${shape.rot} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`
              : undefined
          }
        />
      )
    case 'poly': {
      const cx = shape.pts.reduce((sum, p) => sum + p[0], 0) / shape.pts.length
      const cy = shape.pts.reduce((sum, p) => sum + p[1], 0) / shape.pts.length
      return (
        <polygon
          points={shape.pts.map(([x, y]) => `${x},${y}`).join(' ')}
          {...common}
          transform={shape.rot ? `rotate(${shape.rot} ${cx} ${cy})` : undefined}
        />
      )
    }
    case 'path':
      return <path d={shape.d} {...common} />
  }
}

function ShapeGroup({ shapes, color, ink }: { shapes: Shape[]; color: string; ink: string }) {
  return (
    <>
      {shapes.map((shape, i) => (
        <ShapeNode key={i} shape={shape} fill={shape.ink ? ink : color} />
      ))}
    </>
  )
}

export default function StickerIcon({
  def,
  color,
  className = '',
  shadow = true,
}: {
  def: StickerDef
  color: string
  className?: string
  /** Off in the tray, where a shadow on a 32px thumbnail just looks like a smudge. */
  shadow?: boolean
}) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      {shadow && (
        <g transform="translate(2.5 3.5)" opacity={0.14}>
          <ShapeGroup shapes={def.shapes} color="#453458" ink="#453458" />
        </g>
      )}
      <ShapeGroup shapes={def.shapes} color={color} ink={inkFor(color)} />
    </svg>
  )
}