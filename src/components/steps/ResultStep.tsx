'use client'

/**
 * Step 3 — Save.
 *
 * The only place that produces a file. The strip is re-rendered by the same `renderStrip`
 * used for the preview, just at export width, so what is downloaded is what was on screen.
 */
import { useState } from 'react'
import StripCanvas from '@/components/strip/StripCanvas'
import { Btn } from '@/components/ui/kit'
import { Ico } from '@/components/ui/icons'
import { EXPORT_WIDTH } from '@/engine/compose'
import { downloadBlob, exportStripPng, shareBlob, suggestedFilename } from '@/engine/export'
import { playCue } from '@/engine/audio'
import { useBoothStore } from '@/state/useBoothStore'

/** One-off celebration for arriving here; the reduced-motion rule in globals.css stops it. */
const CONFETTI = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 5.1 + (i % 3) * 7) % 100}%`,
  delay: `${(i % 7) * 0.12}s`,
  color: ['#FFB3CD', '#CBB6FF', '#93E3C8', '#FFE28A', '#A5D6FF'][i % 5],
  size: 8 + (i % 4) * 3,
}))

export default function ResultStep() {
  const photos = useBoothStore((s) => s.photos)
  const design = useBoothStore((s) => s.design)
  const back = useBoothStore((s) => s.back)

  const [working, setWorking] = useState(false)
  const [note, setNote] = useState('')
  const [celebrate] = useState(() => CONFETTI)

  const build = () => exportStripPng(design, photos)

  const save = async () => {
    setWorking(true)
    setNote('')
    try {
      const blob = await build()
      downloadBlob(blob, suggestedFilename())
      setNote(`Saved a ${EXPORT_WIDTH}px wide PNG. No watermark, no account.`)
      playCue('sparkle')
    } catch {
      setNote('That export did not finish. Try again — if it keeps failing, try a smaller set of photos.')
    } finally {
      setWorking(false)
    }
  }

  const share = async () => {
    setWorking(true)
    setNote('')
    try {
      const blob = await build()
      const shared = await shareBlob(blob, suggestedFilename())
      setNote(shared ? 'Sent to your share sheet.' : 'Sharing is not available in this browser. Download instead.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {celebrate.map((bit, i) => (
          <span
            key={i}
            className="confetti-bit"
            style={{
              left: bit.left,
              animationDelay: bit.delay,
              width: bit.size,
              height: bit.size * 1.3,
              background: bit.color,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-center">
        <div>
          <StripCanvas
            design={design}
            photos={photos}
            label="Your finished photo strip"
            className="ring-4 ring-white"
          />
        </div>

        <div className="cute-card rounded-blob p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold">Your strip is ready</h2>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {photos.length} photos, exported at {EXPORT_WIDTH}px wide. Everything was drawn in
            this browser.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Btn tone="ink" size="lg" block onClick={() => void save()} disabled={working}>
              <Ico name={working ? 'loader' : 'download'} className={working ? 'animate-spin' : ''} />
              {working ? 'Preparing the PNG' : 'Download the PNG'}
            </Btn>
            <Btn tone="white" block onClick={() => void share()} disabled={working}>
              <Ico name="share" />
              Share it
            </Btn>
            <Btn tone="lav" block onClick={back} disabled={working}>
              <Ico name="arrow-left" />
              Keep styling
            </Btn>
          </div>

          {note && (
            <p
              role="status"
              className="mt-4 flex items-start gap-2 rounded-2xl bg-mint-100 px-3 py-2 text-sm font-semibold text-ink"
            >
              <Ico name="check" className="mt-0.5 size-4 shrink-0 text-mint-400" />
              {note}
            </p>
          )}

          <p className="mt-4 flex items-start gap-2 text-xs font-semibold text-ink-faint">
            <Ico name="lock" className="mt-0.5 size-3.5 shrink-0" />
            No uploads, no tracking, no watermark. Close the tab and it is gone.
          </p>
        </div>
      </div>
    </div>
  )
}