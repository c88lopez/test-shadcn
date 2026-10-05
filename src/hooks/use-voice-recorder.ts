import { useCallback, useEffect, useRef, useState } from "react"
import {
  audioFileExtension,
  MAX_RECORDING_SECONDS,
  pickRecordingMimeType,
} from "@/lib/voice"

export type VoiceStatus = "idle" | "recording" | "transcribing"
export type VoiceError = "permissionDenied" | "noSpeech" | "failed"

interface Options {
  onTranscript: (text: string) => void
  onError: (error: VoiceError) => void
}

// Records from the microphone and transcribes via /api/transcribe. The
// transcript is handed to `onTranscript`; sending it is left to the caller.
export function useVoiceRecorder({ onTranscript, onError }: Options) {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const [elapsed, setElapsed] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const cancelledRef = useRef(false)
  const callbacksRef = useRef({ onTranscript, onError })

  useEffect(() => {
    callbacksRef.current = { onTranscript, onError }
  }, [onTranscript, onError])

  // Feature-detect after mount so SSR and hydration render the same markup.
  // `mediaDevices` is missing on insecure (non-HTTPS, non-localhost) origins.
  useEffect(() => {
    setSupported(
      typeof MediaRecorder !== "undefined" && "mediaDevices" in navigator
    )
  }, [])

  // Discard an in-progress recording when the component unmounts.
  useEffect(
    () => () => {
      cancelledRef.current = true
      if (recorderRef.current?.state === "recording") recorderRef.current.stop()
    },
    []
  )

  async function upload(blob: Blob) {
    setStatus("transcribing")
    try {
      const body = new FormData()
      body.append("audio", blob, `recording.${audioFileExtension(blob.type)}`)
      const res = await fetch("/api/transcribe", { method: "POST", body })
      if (!res.ok) throw new Error(`Transcription failed (${res.status})`)
      const { text } = (await res.json()) as { text?: string }
      if (text) callbacksRef.current.onTranscript(text)
      else callbacksRef.current.onError("noSpeech")
    } catch {
      callbacksRef.current.onError("failed")
    } finally {
      setStatus("idle")
    }
  }

  async function start() {
    if (status !== "idle") return
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError")
      callbacksRef.current.onError(denied ? "permissionDenied" : "failed")
      return
    }

    const mimeType = pickRecordingMimeType((t) =>
      MediaRecorder.isTypeSupported(t)
    )
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    )
    const chunks: Blob[] = []
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000)
      setElapsed(seconds)
      if (seconds >= MAX_RECORDING_SECONDS && recorder.state === "recording") {
        recorder.stop()
      }
    }, 250)

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      window.clearInterval(timer)
      stream.getTracks().forEach((track) => track.stop())
      recorderRef.current = null
      if (cancelledRef.current) {
        setStatus("idle")
        return
      }
      void upload(
        new Blob(chunks, { type: recorder.mimeType || mimeType || "" })
      )
    }

    cancelledRef.current = false
    recorderRef.current = recorder
    recorder.start()
    setElapsed(0)
    setStatus("recording")
  }

  // Stable so callers can use them in effects (e.g. cancel on panel close).
  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
  }, [])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    stop()
  }, [stop])

  return { supported, status, elapsed, start, stop, cancel }
}
