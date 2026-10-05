// Shared, dependency-free helpers for the assistant's voice input. Used by the
// browser recorder (hook) and the /api/transcribe route.

// Recordings auto-stop after this long, keeping uploads (and cost) bounded.
export const MAX_RECORDING_SECONDS = 120

// Two minutes of Opus is ~1 MB; the cap leaves room for less efficient codecs
// (e.g. Safari's AAC in MP4) while rejecting anything unreasonable.
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024

// MediaRecorder formats in order of preference. Chrome/Firefox support WebM
// (Opus); Safari only records MP4 (AAC).
const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
]

/** First preferred recording format the browser supports, if any. */
export function pickRecordingMimeType(
  isTypeSupported: (type: string) => boolean
): string | undefined {
  return RECORDING_MIME_TYPES.find((type) => isTypeSupported(type))
}

function baseMimeType(mimeType: string): string {
  return mimeType.split(";")[0].trim().toLowerCase()
}

export function isAcceptedAudioType(mimeType: string): boolean {
  return baseMimeType(mimeType).startsWith("audio/")
}

// Transcription APIs infer the container from the file name, so uploads need a
// matching extension.
export function audioFileExtension(mimeType: string): string {
  switch (baseMimeType(mimeType)) {
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a"
    case "audio/ogg":
      return "ogg"
    case "audio/mpeg":
      return "mp3"
    case "audio/wav":
    case "audio/x-wav":
      return "wav"
    default:
      return "webm"
  }
}

/** Formats whole seconds as m:ss (e.g. 75 → "1:15"). */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`
}

/** Appends a transcript to whatever the user already typed. */
export function appendTranscript(current: string, transcript: string): string {
  const head = current.trimEnd()
  const tail = transcript.trim()
  if (!head) return tail
  if (!tail) return head
  return `${head} ${tail}`
}
