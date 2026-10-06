'use client'

/**
 * Presentational primitives.
 *
 * These know nothing about booth state — they take props and render. Keeping them together
 * makes the "cute" language (chunky press feel, pastel fills, rounded everything) live in one
 * file instead of being reinvented per component.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { STEPS, type Step } from '@/core/types'
import { Ico } from './icons'

type Tone = 'blush' | 'lav' | 'mint' | 'butter' | 'sky' | 'white' | 'ink'

const TONES: Record<Tone, string> = {
  blush: 'bg-blush-300 text-ink hover:bg-blush-200',
  lav: 'bg-lav-300 text-ink hover:bg-lav-200',
  mint: 'bg-mint-300 text-ink hover:bg-mint-200',
  butter: 'bg-butter-300 text-ink hover:bg-butter-200',
  sky: 'bg-sky-300 text-ink hover:bg-sky-200',
  white: 'bg-white text-ink hover:bg-blush-50',
  ink: 'bg-ink text-white hover:bg-ink-soft',
}

const SIZES = {
  sm: 'min-h-9 px-3.5 text-sm',
  md: 'min-h-11 px-5 text-base',
  lg: 'min-h-13 px-6 text-base sm:text-lg sm:min-h-14',
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone
  size?: keyof typeof SIZES
  block?: boolean
}

export function Btn({ tone = 'blush', size = 'md', block, className = '', children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`chunky inline-flex items-center justify-center gap-2 rounded-full font-extrabold whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-45 ${TONES[tone]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

/** Selectable pill used by every picker (filters, layouts, frames). */
export function Chip({
  active,
  icon,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; icon?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...rest}
      className={`chunky inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-2 text-sm font-bold ${
        active ? 'border-ink/60 bg-white text-ink' : 'border-transparent bg-white/70 text-ink-soft hover:bg-white'
      } ${className}`}
    >
      {icon && <Ico name={icon} className="size-4" />}
      {children}
    </button>
  )
}

/** Section shell used by every panel in the Style step. */
export function Card({
  icon,
  title,
  hint,
  action,
  children,
}: {
  icon?: string
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="cute-card rounded-blob p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        {icon && <Ico name={icon} className="size-5 text-lav-400" />}
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {hint && <span className="text-xs font-semibold text-ink-faint">{hint}</span>}
        {action && <div className="ml-auto">{action}</div>}
      </header>
      {children}
    </section>
  )
}

/** Rounded pill toggle (date stamp, mirror, sound). */
export function Switch({
  checked,
  onChange,
  icon,
  children,
  tone = 'mint',
}: {
  checked: boolean
  onChange: () => void
  icon?: string
  children: ReactNode
  tone?: Tone
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`chunky inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold ${
        checked ? TONES[tone] : 'bg-white/70 text-ink-soft'
      }`}
    >
      <span
        aria-hidden
        className={`grid size-5 place-items-center rounded-full bg-white/90 text-ink transition-transform ${
          checked ? 'scale-110' : 'scale-90 opacity-50'
        }`}
      >
        {checked ? <Ico name="check" className="size-3" strokeWidth={3} /> : null}
      </span>
      {icon && <Ico name={icon} className="size-4" />}
      {children}
    </button>
  )
}

/** The app mascot: a lil' blob camera with a blink. */
export function Mascot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`animate-float ${className}`} role="img" aria-label="Peachy camera mascot">
      <rect x="21" y="4" width="22" height="10" rx="5" fill="#E2D6FF" />
      <rect x="4" y="12" width="56" height="48" rx="20" fill="#CBB6FF" />
      <rect x="4" y="12" width="56" height="48" rx="20" fill="url(#mascotShine)" />
      <g className="animate-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <ellipse cx="22" cy="24" rx="3.4" ry="4.2" fill="#453458" />
        <ellipse cx="42" cy="24" rx="3.4" ry="4.2" fill="#453458" />
      </g>
      <ellipse cx="13" cy="33" rx="4" ry="2.6" fill="#FFB3CD" opacity="0.85" />
      <ellipse cx="51" cy="33" rx="4" ry="2.6" fill="#FFB3CD" opacity="0.85" />
      <circle cx="32" cy="41" r="12" fill="#FFFFFF" stroke="#453458" strokeWidth="2.5" />
      <circle cx="32" cy="41" r="6" fill="#FFB3CD" />
      <circle cx="29.5" cy="38.5" r="1.8" fill="#FFFFFF" opacity="0.9" />
      <defs>
        <linearGradient id="mascotShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** The guided flow: tap a step to jump back, later steps stay locked until there are photos. */
export function Stepper({
  step,
  onSelect,
  canJump,
}: {
  step: Step
  onSelect: (step: Step) => void
  canJump: (step: Step) => boolean
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === step)
  return (
    <nav aria-label="Photo booth steps" className="w-full">
      <ol className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((item, index) => {
          const done = index < currentIndex
          const active = item.id === step
          const enabled = canJump(item.id)
          return (
            <li key={item.id} className="flex flex-1 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => enabled && onSelect(item.id)}
                disabled={!enabled}
                aria-current={active ? 'step' : undefined}
                className={`chunky flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 font-extrabold sm:gap-2 sm:px-4 ${
                  active
                    ? 'bg-white text-ink'
                    : enabled
                      ? 'bg-white/60 text-ink-soft hover:bg-white'
                      : 'cursor-not-allowed bg-white/35 text-ink-faint'
                }`}
              >
                <Ico name={done ? 'check' : item.icon} className="size-4 shrink-0 sm:size-5" />
                <span className="truncate text-xs sm:text-sm">{item.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <span aria-hidden className="hidden h-1 w-4 shrink-0 rounded-full bg-white/70 sm:block" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}