'use client'

/**
 * The app shell.
 *
 * Owns nothing but the frame around the steps: the header, the stepper and the action bar.
 * All booth state comes from the store; the one thing the shell does is keep the sound
 * preference in sync with the audio engine.
 */
import { useEffect } from 'react'
import CaptureStep from '@/components/steps/CaptureStep'
import CustomizeStep from '@/components/steps/CustomizeStep'
import ResultStep from '@/components/steps/ResultStep'
import { Btn, Mascot, Stepper } from '@/components/ui/kit'
import { Ico } from '@/components/ui/icons'
import { setSoundEnabled } from '@/engine/audio'
import { useBoothStore } from '@/state/useBoothStore'
import type { Step } from '@/core/types'

const NEXT_LABEL: Record<Exclude<Step, 'result'>, string> = {
  capture: 'Style my strip',
  customize: 'Save my strip',
}

export default function BoothApp() {
  const step = useBoothStore((s) => s.step)
  const photos = useBoothStore((s) => s.photos)
  const sound = useBoothStore((s) => s.sound)
  const toggleSound = useBoothStore((s) => s.toggleSound)
  const goTo = useBoothStore((s) => s.goTo)
  const next = useBoothStore((s) => s.next)
  const back = useBoothStore((s) => s.back)

  // The audio engine holds the flag; the store holds the preference.
  useEffect(() => {
    setSoundEnabled(sound)
  }, [sound])

  const hasPhotos = photos.length > 0
  const canJump = (target: Step) => (target === 'capture' ? true : hasPhotos)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-lav-400">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
          <span className="chunky grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-paper shadow-toy-xs">
            <Mascot className="size-9" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-xl leading-tight font-bold text-ink sm:text-2xl">
              Dubu Studio
            </h1>
            <p className="truncate text-xs font-bold text-ink/80 sm:text-sm">
              Photo strips made in your browser
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1 text-xs font-bold text-ink sm:inline-flex">
              <Ico name="lock" className="size-3.5" />
              On-device only
            </span>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={sound}
              aria-label={sound ? 'Mute sounds' : 'Turn sounds on'}
              className={`chunky grid size-9 place-items-center rounded-lg border-2 border-ink shadow-toy-xs ${
                sound ? 'win-dot-butter text-ink' : 'bg-paper text-ink-faint'
              }`}
            >
              <Ico name={sound ? 'volume-on' : 'volume-off'} className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto mb-5 w-full max-w-2xl sm:mb-7">
          <Stepper step={step} onSelect={goTo} canJump={canJump} />
        </div>

        {/* `key` restarts the entry animation on each step change — motion that answers a
            deliberate action rather than decoration on load. */}
        <div key={step} className="animate-rise">
          {step === 'capture' && <CaptureStep />}
          {step === 'customize' && <CustomizeStep />}
          {step === 'result' && <ResultStep />}
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 border-t-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <Btn tone="paper" onClick={back} disabled={step === 'capture'}>
            <Ico name="arrow-left" />
            Back
          </Btn>

          <p className="ml-auto hidden text-sm font-semibold text-ink-faint sm:block">
            {step === 'capture' && 'Photos stay on this device'}
            {step === 'customize' && 'Tap anything to change it'}
            {step === 'result' && 'Saved images are never uploaded'}
          </p>

          {step !== 'result' && (
            <Btn tone="ink" size="lg" onClick={next} disabled={!hasPhotos}>
              {NEXT_LABEL[step]}
              <Ico name="arrow-right" />
            </Btn>
          )}
        </div>
      </footer>
    </div>
  )
}