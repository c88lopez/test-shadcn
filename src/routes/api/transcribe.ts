import { gateway, transcribe } from "ai"
import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth"
import { ApiError, apiErrorResponse } from "@/lib/api-auth"
import { isAcceptedAudioType, MAX_AUDIO_BYTES } from "@/lib/voice"

// `||` (not `??`) so an empty AI_TRANSCRIPTION_MODEL="" in .env falls back.
const MODEL =
  process.env.AI_TRANSCRIPTION_MODEL || "openai/gpt-4o-mini-transcribe"

// Multipart overhead on top of the audio itself.
const MAX_BODY_BYTES = MAX_AUDIO_BYTES + 64 * 1024

async function readAudio(request: Request): Promise<File> {
  // Reject oversized uploads before buffering the body.
  const length = Number(request.headers.get("content-length") ?? 0)
  if (length > MAX_BODY_BYTES) throw new ApiError(413, "Audio is too large.")

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    throw new ApiError(400, "Expected multipart form data.")
  }
  const audio = form.get("audio")
  if (!(audio instanceof File) || audio.size === 0) {
    throw new ApiError(400, "Missing audio.")
  }
  if (!isAcceptedAudioType(audio.type)) {
    throw new ApiError(415, "Unsupported audio type.")
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    throw new ApiError(413, "Audio is too large.")
  }
  return audio
}

// POST /api/transcribe — multipart `audio` field → { text }. Backs the voice
// input in the assistant panel; the transcript is returned to the composer
// for the user to review and send, never sent to the chat directly.
export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          })
          if (!session || session.user.status === "archived") {
            throw new ApiError(401, "Unauthorized.")
          }

          const audio = await readAudio(request)
          try {
            const { text } = await transcribe({
              model: gateway.transcription(MODEL),
              audio: new Uint8Array(await audio.arrayBuffer()),
              abortSignal: request.signal,
            })
            return Response.json({ text: text.trim() })
          } catch (error) {
            // Gateway/provider details stay in the server log.
            console.error("Transcription failed:", error)
            throw new ApiError(502, "Transcription failed.")
          }
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
    },
  },
})
