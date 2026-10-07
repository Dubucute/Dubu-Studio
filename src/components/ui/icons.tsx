'use client'

/**
 * Icon registry.
 *
 * `core/` describes icons by name (a plain string) so it never imports React. This module is
 * the single place where those names become Lucide components, which keeps the whole UI on
 * one icon language and makes a missing name a one-line fix instead of a hunt.
 */
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Candy,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  CircleOff,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  Film,
  FlipHorizontal2,
  Flower,
  Gift,
  Grid2x2,
  Heart,
  Images,
  Info,
  LayoutGrid,
  LoaderCircle,
  Lock,
  Moon,
  MousePointerClick,
  Palette,
  PenLine,
  Plus,
  RotateCcw,
  Rows3,
  Scissors,
  Share2,
  Sparkles,
  Square,
  Star,
  Sun,
  Ticket,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Wand2,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react'

const REGISTRY: Record<string, LucideIcon> = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  camera: Camera,
  candy: Candy,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'circle-alert': CircleAlert,
  'circle-dashed': CircleDashed,
  'circle-off': CircleOff,
  clapperboard: Clapperboard,
  download: Download,
  eye: Eye,
  'eye-off': EyeOff,
  film: Film,
  'flip-horizontal': FlipHorizontal2,
  flower: Flower,
  gift: Gift,
  grid: Grid2x2,
  heart: Heart,
  images: Images,
  info: Info,
  'layout-grid': LayoutGrid,
  loader: LoaderCircle,
  lock: Lock,
  moon: Moon,
  'mouse-pointer': MousePointerClick,
  palette: Palette,
  'pen-line': PenLine,
  plus: Plus,
  'rotate-ccw': RotateCcw,
  rows: Rows3,
  scissors: Scissors,
  share: Share2,
  sparkles: Sparkles,
  square: Square,
  star: Star,
  sun: Sun,
  ticket: Ticket,
  trash: Trash2,
  upload: Upload,
  'volume-on': Volume2,
  'volume-off': VolumeX,
  wand: Wand2,
  waves: Waves,
  x: X,
}

export const hasIcon = (name: string): boolean => name in REGISTRY

/**
 * Render an icon by name. Unknown names fall back to a dashed circle so a typo is visible
 * rather than silently rendering nothing.
 */
export function Ico({
  name,
  className = 'size-4',
  strokeWidth = 2.4,
}: {
  name: string
  className?: string
  strokeWidth?: number
}) {
  const Icon = REGISTRY[name] ?? CircleDashed
  return <Icon aria-hidden focusable="false" className={className} strokeWidth={strokeWidth} />
}