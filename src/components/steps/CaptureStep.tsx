'use client'

/**
 * Step 1 — Snap.
 *
 * Two ways in: the webcam stage, or photos from the device (file picker *and* drag & drop,
 * because people expect both). Sample photos exist so the app is fully usable — and
 * testable — with no camera and no photos to hand.
 */
import { useRef, useState } from 'react'
import CameraStage from '@/components/camera/CameraStage'
import { Btn, Switch, Window } from '@/components/ui/kit'
import { Ico } from '@/components/ui/icons'
import { filterById } from '@/core/filters'
import { layoutFor } from '@/engine/compose'
import { fileToPhoto } from '@/engine/photo'
import { makeSamplePhotos } from '@/engine/samples'
import { MAX_PHOTOS, useBoothStore } from '@/state/useBoothStore'

export default function CaptureStep() {
  const photos = useBoothStore((s) => s.photos)
  const design = useBoothStore((s) => s.design)
  const mirror = useBoothStore((s) => s.mirror)
  const sound = useBoothStore((s) => s.sound)
  const addPhotos = useBoothStore((s) => s.addPhotos)
  const removePhoto = useBoothStore((s) => s.removePhoto)
  const clearPhotos = useBoothStore((s) => s.clearPhotos)
  const toggleMirror = useBoothStore((s) => s.toggleMirror)
  const toggleSound = useBoothStore((s) => s.toggleSound)

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)

  const layout = layoutFor(design, photos.length)
  const full = photos.length >= MAX_PHOTOS

  const ingest = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (images.length === 0) return
    setBusy(true)
    try {
      const loaded = await Promise.all(images.map((file) => fileToPhoto(file)))
      addPhotos(loaded)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <CameraStage
        filterCss={filterById(design.filterId).css}
        mirror={mirror}
        onCapture={(photo) => addPhotos([photo])}
      />

      <div className="flex flex-col gap-4">
        <Window
          title="Your photos" panel
          icon="images"
          controls={
            <span className="rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-[11px] font-bold text-ink">
              {photos.length} of {MAX_PHOTOS}
            </span>
          }
        >
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <Ico name={layout.icon} className="size-4 text-lav-500" />
            Laid out as {layout.label}
          </p>

          {photos.length === 0 ? (
            <p className="well p-4 text-center text-sm font-semibold text-ink-soft">
              Nothing on the roll yet. Shoot a photo, upload some, or start with the samples.
            </p>
          ) : (
            <ul className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <li key={photo.id} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={`Photo ${index + 1}`}
                    className="size-20 rounded-lg border-2 border-ink object-cover shadow-toy-xs sm:size-24"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="chunky absolute -right-2 -top-2 grid size-7 place-items-center rounded-lg border-2 border-ink bg-mauve-500 text-white shadow-toy-xs"
                  >
                    <Ico name="x" className="size-3.5" strokeWidth={3} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {photos.length > 0 && (
            <Btn tone="paper" size="sm" className="mt-3" onClick={clearPhotos}>
              <Ico name="rotate-ccw" />
              Start the roll over
            </Btn>
          )}
        </Window>

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            void ingest(event.dataTransfer.files)
          }}
          className={`window overflow-hidden p-0 transition ${dragOver ? 'translate-x-0.5 translate-y-0.5 shadow-toy-xs' : ''}`}
        >
          <div className="window-bar bg-mint-300">
            <Ico name="upload" className="size-4" />
            <h2 className="text-sm font-bold">Or bring your own</h2>
            <span className="ml-auto flex items-center gap-1">
              <span className="win-dot" aria-hidden />
              <span className="win-dot win-dot-butter" aria-hidden />
            </span>
          </div>
          <div className="p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink-soft">
            Drop photos here or pick them from your device. They never leave this browser.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void ingest(event.target.files)
              event.target.value = ''
            }}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Btn tone="sky" onClick={() => inputRef.current?.click()} disabled={full}>
              <Ico name="upload" />
              Upload photos
            </Btn>
            <Btn tone="butter" onClick={() => addPhotos(makeSamplePhotos(4))} disabled={full || busy}>
              <Ico name="sparkles" />
              Start with samples
            </Btn>
            <Switch checked={mirror} onChange={toggleMirror} tone="lav" icon="flip-horizontal">
              Mirror
            </Switch>
            <Switch checked={sound} onChange={toggleSound} tone="mint" icon={sound ? 'volume-on' : 'volume-off'}>
              Sound
            </Switch>
          </div>

          {full && (
            <p className="well mt-3 px-3 py-2 text-sm font-bold text-ink">
              {MAX_PHOTOS} photos is the limit. Remove one to add another.
            </p>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}