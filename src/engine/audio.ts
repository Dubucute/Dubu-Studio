/**
 * Sound cues, synthesised with the Web Audio API.
 *
 * No audio files ship with the app: the countdown beeps and the shutter click are a few
 * oscillators, which keeps the bundle tiny and means the cues work offline.
 *
 * The AudioContext is created lazily on the first cue (browsers block it otherwise) and
 * `enabled` is a module flag mirrored from the store's sound preference.
 */
export type Cue = 'tick' | 'shutter' | 'sparkle' | 'pop'

let context: AudioContext | null = null
let enabled = true

export const setSoundEnabled = (value: boolean) => {
  enabled = value
  if (!value) void context?.suspend()
  else void context?.resume()
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  context ??= new Ctor()
  return context
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, peak = 0.16) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  // Short attack, exponential decay: plucky instead of clicky.
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration + 0.02)
}

/** A burst of filtered noise, which reads as a mechanical shutter. */
function click(ctx: AudioContext, start: number, freq: number) {
  const frames = Math.floor(ctx.sampleRate * 0.045)
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.value = 0.3
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(ctx.currentTime + start)
}

export function playCue(cue: Cue) {
  if (!enabled) return
  const ctx = audio()
  if (!ctx || ctx.state === 'suspended') return

  switch (cue) {
    case 'tick':
      tone(ctx, 760, 0, 0.1, 'sine', 0.14)
      break
    case 'pop':
      tone(ctx, 520, 0, 0.09, 'triangle', 0.16)
      break
    case 'shutter':
      click(ctx, 0, 2200)
      click(ctx, 0.07, 1500)
      break
    case 'sparkle':
      ;[1046, 1318, 1568, 2093].forEach((freq, i) => tone(ctx, freq, i * 0.055, 0.16, 'sine', 0.1))
      break
  }
}