'use client'

/**
 * Presentational primitives for the toy-OS look.
 *
 * Every surface is a window: a cream body, a plum outline, a coloured title bar with small
 * square controls and a hard pink shadow. The pieces here know nothing about booth state —
 * they take props and render — so the whole visual language lives in one file.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { STEPS, type Step } from '@/core/types'
import { Ico } from './icons'

type Tone = 'lav' | 'blush' | 'mint' | 'butter' | 'sky' | 'paper' | 'ink'

const TONES: Record<Tone, string> = {
  lav: 'bg-lav-400 text-ink hover:bg-lav-300',
  blush: 'bg-blush-300 text-ink hover:bg-blush-200',
  mint: 'bg-mint-300 text-ink hover:bg-mint-200',
  butter: 'bg-butter-300 text-ink hover:bg-butter-200',
  sky: 'bg-sky-300 text-ink hover:bg-sky-200',
  paper: 'bg-paper text-ink hover:bg-blush-100',
  ink: 'bg-ink text-paper hover:bg-ink-soft',
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

export function Btn({ tone = 'lav', size = 'md', block, className = '', children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`chunky inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink shadow-toy-xs font-extrabold whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-45 ${TONES[tone]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

/** Selectable tile used by every picker (filters, layouts, frames). */
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
      className={`chunky inline-flex items-center gap-1.5 rounded-xl border-2 shadow-toy-xs ${
        active ? 'border-ink bg-lav-200' : 'border-ink/45 bg-paper text-ink-soft hover:border-ink hover:bg-paper'
      } px-3 py-2 text-sm font-bold ${className}`}
    >
      {icon && <Ico name={icon} className="size-4" />}
      {children}
    </button>
  )
}

/**
 * A panel in the toy-OS chrome: title bar, square controls, content below.
 * `tone` picks the title-bar fill; `mauve` is reserved for the one committing action.
 */
export function Window({
  title,
  icon,
  tone = 'lav',
  controls,
  bar,
  panel = false,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string
  icon?: string
  tone?: 'lav' | 'mauve' | 'blush' | 'mint' | 'butter'
  /** Replace the decorative dots with real controls. */
  controls?: ReactNode
  /** Extra content between the dots and the title (rare). */
  bar?: ReactNode
  /** Draw the content area as a recessed pink panel, like the reference's main window. */
  panel?: boolean
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  const barTone =
    tone === 'mauve'
      ? 'window-bar-accent'
      : tone === 'blush'
        ? 'bg-blush-300'
        : tone === 'mint'
          ? 'bg-mint-300'
          : tone === 'butter'
            ? 'bg-butter-300'
            : ''

  return (
    <section className={`window overflow-hidden ${className}`}>
      <header className={`window-bar ${barTone}`}>
        {icon && <Ico name={icon} className="size-4 shrink-0" />}
        <h2 className="truncate text-sm font-bold">{title}</h2>
        {bar}
        <div className="ml-auto flex items-center gap-1">
          {controls ?? (
            <>
              <span className="win-dot" aria-hidden />
              <span className="win-dot" aria-hidden />
              <span className="win-dot win-dot-butter" aria-hidden />
            </>
          )}
        </div>
      </header>
      <div className={`p-4 sm:p-5 ${panel ? 'well m-2 mt-0 rounded-t-none border-t-0 sm:m-3 sm:mt-0' : ''} ${bodyClassName}`}>{children}</div>
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
      className={`chunky inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold shadow-toy-xs ${
        checked ? TONES[tone] : 'bg-paper text-ink-soft'
      }`}
    >
      <span
        aria-hidden
        className={`grid size-5 place-items-center rounded-full border-2 border-ink bg-paper transition-transform ${
          checked ? 'scale-110' : 'scale-90 opacity-50'
        }`}
      >
        {checked ? <Ico name="check" className="size-3" strokeWidth={3.5} /> : null}
      </span>
      {icon && <Ico name={icon} className="size-4" />}
      {children}
    </button>
  )
}

/** The mascot: a plum-outlined camera blob that blinks. */
export function Mascot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`animate-float ${className}`} role="img" aria-label="Dubu camera mascot">
      <rect x="21" y="4" width="22" height="10" rx="4" fill="#E2D6FF" stroke="#43223F" strokeWidth="2" />
      <rect x="4" y="12" width="56" height="48" rx="16" fill="#A78BFA" stroke="#43223F" strokeWidth="2.5" />
      <g className="animate-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <ellipse cx="22" cy="24" rx="3.4" ry="4.2" fill="#43223F" />
        <ellipse cx="42" cy="24" rx="3.4" ry="4.2" fill="#43223F" />
      </g>
      <ellipse cx="13" cy="32" rx="4" ry="2.6" fill="#FFAAD0" />
      <ellipse cx="51" cy="32" rx="4" ry="2.6" fill="#FFAAD0" />
      <circle cx="32" cy="41" r="12" fill="#FFF8FB" stroke="#43223F" strokeWidth="2.5" />
      <circle cx="32" cy="41" r="6" fill="#FF8FB8" />
      <circle cx="29.5" cy="38.5" r="1.8" fill="#FFF8FB" />
      <path d="M6 52 Q32 60 58 52" stroke="#43223F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** The guided flow, drawn as window tabs: plum outline, hard shadow, active tab filled. */
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
      <ol className="flex items-stretch gap-2 sm:gap-3">
        {STEPS.map((item, index) => {
          const done = index < currentIndex
          const active = item.id === step
          const enabled = canJump(item.id)
          const fill = active ? 'bg-lav-400 text-ink' : done ? 'bg-mint-300 text-ink' : 'bg-paper text-ink-faint'
          return (
            <li key={item.id} className="flex flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => enabled && onSelect(item.id)}
                disabled={!enabled}
                aria-current={active ? 'step' : undefined}
                className={`chunky flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2 shadow-toy-xs font-extrabold sm:gap-2 sm:px-4 ${fill} ${
                  enabled ? 'border-ink' : 'cursor-not-allowed border-ink/40'
                }`}
              >
                <Ico name={done ? 'check' : item.icon} className="size-4 shrink-0 sm:size-5" />
                <span className="truncate text-xs sm:text-sm">{item.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <span aria-hidden className="hidden h-0.5 w-5 shrink-0 rounded-full bg-ink/25 sm:block" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}