'use client'

/**
 * The camera stage.
 *
 * This component owns the camera *resource*: it opens the stream on mount and always stops
 * it on unmount, so no other layer has to think about tracks. It also owns the transient
 * countdown and shutter-flash state, because that state only exists while this component is
 * on screen.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { playCue } from '@/engine/audio'
import { cameraErrorMessage, openCamera, type CameraHandle } from '@/engine/camera'
import { grabVideoFrame } from '@/engine/photo'
import { Btn } from '@/components/ui/kit'
import { Ico } from '@/components/ui/icons'
import type { Photo } from '@/core/types'

type Status = 'starting' | 'live' | 'error'

interface CameraStageProps {
  filterCss: string
  mirror: boolean
  onCapture: (photo: Photo) => void
}

const COUNT_FROM = 3

export default function CameraStage({ filterCss, mirror, onCapture }: CameraStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const handleRef = useRef<CameraHandle | null>(null)
  const timersRef = useRef<number[]>([])
  const [status, setStatus] = useState<Status>('starting')
  const [error, setError] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [flash, setFlash] = useState(0)

  const start = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    handleRef.current?.stop()
    setStatus('starting')
    setError('')
    try {
      handleRef.current = await openCamera(video)
      setStatus('live')
    } catch (err) {
      const kind = (err as { kind?: Parameters<typeof cameraErrorMessage>[0] })?.kind ?? 'failed'
      setError(cameraErrorMessage(kind))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void start()
    return () => {
      handleRef.current?.stop()
      handleRef.current = null
      for (const id of timersRef.current) window.clearTimeout(id)
    }
  }, [start])

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }, [])

  /** 3 · 2 · 1 · Smile! — ticks, then a shutter click and the capture. */
  const runCountdown = useCallback(() => {
    const video = videoRef.current
    if (!video || count !== null) return

    setCount(COUNT_FROM)
    playCue('tick')
    for (let n = COUNT_FROM - 1; n >= 1; n--) later(() => playCue('tick'), n * 1000)

    later(() => {
      void grabVideoFrame(video, { mirror }).then((photo) => {
        onCapture(photo)
        playCue('sparkle')
      })
      setCount(null)
      setFlash((n) => n + 1)
    }, COUNT_FROM * 1000)

    later(() => playCue('shutter'), COUNT_FROM * 1000 - 120)
  }, [count, mirror, onCapture, later])

  return (
    <div className="relative">
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-blob bg-ink/90 shadow-[0_24px_50px_-26px_rgba(69,52,88,0.7)]">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Live camera preview"
          className="h-full w-full object-cover"
          style={{ filter: filterCss, transform: mirror ? 'scaleX(-1)' : undefined }}
        />

        {status === 'starting' && (
          <div className="absolute inset-0 grid place-items-center bg-ink/70 text-center">
            <p className="animate-wiggle flex items-center gap-2 font-display text-base font-bold text-white sm:text-lg">
              <Ico name="loader" className="size-5 animate-spin" />
              Starting the camera
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 grid place-items-center bg-blush-100/95 p-5 text-center">
            <div className="max-w-xs">
              <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-full bg-white text-lav-400 shadow-cute">
                <Ico name="circle-alert" className="size-6" />
              </span>
              <p className="mt-3 font-display text-base font-bold text-ink">{error}</p>
              <Btn tone="white" size="sm" className="mt-3" onClick={() => void start()}>
                <Ico name="rotate-ccw" />
                Try the camera again
              </Btn>
            </div>
          </div>
        )}

        {status === 'live' && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-ink">
            <span aria-hidden className="size-2 animate-ping rounded-full bg-blush-400" />
            Live
          </span>
        )}

        {count !== null && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span
              key={count}
              className="animate-pop font-display text-[7rem] leading-none font-bold text-white drop-shadow-[0_6px_0_rgba(69,52,88,0.35)] sm:text-[9rem]"
            >
              {count}
            </span>
          </div>
        )}

        {count === null && status === 'live' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="animate-pop rounded-full bg-white/85 px-3 py-1 text-xs font-extrabold text-ink">
              Press the shutter to shoot
            </span>
          </div>
        )}

        {/* Happy shutter flash — a white blink over the whole stage. */}
        {flash > 0 && (
          <span key={flash} aria-hidden className="animate-shutter pointer-events-none absolute inset-0 block bg-white" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={runCountdown}
          disabled={status !== 'live' || count !== null}
          aria-label="Take a photo"
          className="chunky grid size-20 place-items-center rounded-full border-4 border-white bg-blush-300 text-ink shadow-[0_10px_0_0_rgba(69,52,88,0.2)] disabled:opacity-40 sm:size-24"
        >
          <Ico name="camera" className="size-9 sm:size-10" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}