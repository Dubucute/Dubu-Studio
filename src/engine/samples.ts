/**
 * Sample photos.
 *
 * Cameras get declined, people run out of selfies, and the layout switcher needs something to
 * show. These are drawn procedurally on a canvas — soft risograph-style colour fields with a
 * sticker shape dropped on top — so trying the app needs no camera and no bundled assets.
 */
import { createId } from '@/core/ids'
import { STICKERS, type StickerDef } from '@/core/stickers'
import type { Photo } from '@/core/types'
import { seededRandom } from './draw'
import { drawStickerDef } from './stickers'

interface Scene {
  sticker: string
  caption: string
  colors: [string, string]
  accent: string
}

const SCENES: Scene[] = [
  { sticker: 'flower', caption: 'tulip morning', colors: ['#FFE6F0', '#FFCFE2'], accent: '#93E3C8' },
  { sticker: 'moon', caption: 'stayed up late', colors: ['#E9F0FF', '#D4DEFF'], accent: '#FFC44D' },
  { sticker: 'paw', caption: 'met a friend', colors: ['#F1EBFF', '#DED2FF'], accent: '#FF9A76' },
  { sticker: 'cherry', caption: 'sweet afternoon', colors: ['#FFF0E6', '#FFD9C9'], accent: '#74BAFF' },
  { sticker: 'sparkle', caption: 'after the rain', colors: ['#ECFBF4', '#D2F3E5'], accent: '#AE90FF' },
  { sticker: 'cloud', caption: 'slow morning', colors: ['#F4F9FF', '#DCEEFF'], accent: '#FFB3CD' },
]

const W = 1000
const H = 750

const stickerById = (id: string): StickerDef | undefined => STICKERS.find((s) => s.id === id)

function paint(index: number): HTMLCanvasElement {
  const scene = SCENES[index % SCENES.length]
  const def = stickerById(scene.sticker)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const rand = seededRandom(index * 7919 + 13)

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, scene.colors[0])
  bg.addColorStop(1, scene.colors[1])
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Overlapping colour fields, the way a two-colour risograph print layers ink.
  for (let i = 0; i < 7; i++) {
    ctx.globalAlpha = 0.16 + rand() * 0.14
    ctx.fillStyle = i % 2 === 0 ? scene.accent : '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(rand() * W, rand() * H * 0.9, 160 + rand() * 260, 120 + rand() * 200, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  if (def) {
    drawStickerDef(ctx, def, {
      x: W / 2,
      y: H / 2 - 30,
      size: 380,
      rotation: (rand() - 0.5) * 18,
      color: '#453458',
    })
  }

  ctx.font = '700 60px "Quicksand", "Nunito", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#453458'
  ctx.fillText(scene.caption, W / 2, H - 74)

  ctx.font = '600 30px "Nunito", sans-serif'
  ctx.fillStyle = '#6E5C82'
  ctx.fillText('sample photo', W / 2, H - 30)

  return canvas
}

/** `count` sample photos, ready to drop into the store. */
export function makeSamplePhotos(count: number): Photo[] {
  return Array.from({ length: count }, (_, i) => {
    const canvas = paint(i)
    return {
      id: createId('ph'),
      src: canvas.toDataURL('image/jpeg', 0.9),
      width: canvas.width,
      height: canvas.height,
    }
  })
}