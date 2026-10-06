'use client'

/**
 * Caption, place and date controls.
 *
 * The date stamp is already formatted in `core/design.ts`, so this panel only ever moves
 * strings around — the same strings the canvas renderer draws into the footer.
 */
import { Switch } from '@/components/ui/kit'
import { Ico } from '@/components/ui/icons'
import { useBoothStore } from '@/state/useBoothStore'

const IDEAS = ['besties forever', 'cutie pie', 'our era', 'no thoughts just vibes', 'one more roll']

export default function TextEditor() {
  const text = useBoothStore((s) => s.design.text)
  const setCaption = useBoothStore((s) => s.setCaption)
  const setPlace = useBoothStore((s) => s.setPlace)
  const toggleDate = useBoothStore((s) => s.toggleDate)

  const field =
    'w-full rounded-2xl border-2 border-transparent bg-white px-4 py-3 font-bold text-ink placeholder:font-semibold placeholder:text-ink-faint focus:border-lav-300 focus:outline-none'

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink-faint">Caption</span>
        <input
          value={text.caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={48}
          placeholder="besties forever"
          className={field}
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => setCaption(idea)}
            className="chunky min-h-9 rounded-full bg-blush-50 px-3 py-2 text-xs font-bold text-ink-soft hover:bg-blush-100"
          >
            {idea}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink-faint">Location</span>
        <input
          value={text.place}
          onChange={(e) => setPlace(e.target.value)}
          maxLength={28}
          placeholder="paris, spring 2026"
          className={field}
        />
      </label>

      <Switch checked={text.showDate} onChange={toggleDate} tone="butter" icon="star">
        Stamp the date
      </Switch>

      <p className="flex items-start gap-2 rounded-2xl bg-mint-100 px-3 py-2 text-xs font-semibold text-ink-soft">
        <Ico name="lock" className="mt-0.5 size-3.5 shrink-0 text-mint-400" />
        Stamps are drawn straight onto the image in your browser.
      </p>
    </div>
  )
}