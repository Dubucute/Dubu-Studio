/**
 * Webcam lifecycle.
 *
 * The stream is a hardware resource, so it is owned by the camera component (not the
 * store): the component opens it while the Capture step is mounted and always closes it on
 * unmount. This module only knows how to start and stop a stream and how to explain the
 * three ways it can fail.
 */

export type CameraErrorKind = 'unsupported' | 'denied' | 'failed'

export interface CameraHandle {
  stream: MediaStream
  stop: () => void
}

export async function openCamera(video: HTMLVideoElement): Promise<CameraHandle> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('unsupported'), { kind: 'unsupported' as CameraErrorKind })
  }

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 1920 },
        height: { ideal: 1440 },
      },
    })
  } catch (err) {
    const name = (err as DOMException)?.name
    const kind: CameraErrorKind =
      name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError'
        ? 'denied'
        : 'failed'
    throw Object.assign(new Error(kind), { kind })
  }

  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  await video.play().catch(() => undefined)

  return {
    stream,
    stop: () => {
      for (const track of stream.getTracks()) track.stop()
      if (video.srcObject === stream) video.srcObject = null
    },
  }
}

/** Turn a failure into something a human wants to read. */
export function cameraErrorMessage(kind: CameraErrorKind): string {
  switch (kind) {
    case 'unsupported':
      return 'This browser has no camera API — no worries, just upload photos instead!'
    case 'denied':
      return 'Camera permission was declined. You can allow it in your browser settings, or just upload photos.'
    default:
      return 'That camera did not want to wake up. Try again, or upload photos instead.'
  }
}