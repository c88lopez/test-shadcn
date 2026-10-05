import { describe, expect, it } from "vitest"
import {
  appendTranscript,
  audioFileExtension,
  formatDuration,
  isAcceptedAudioType,
  pickRecordingMimeType,
} from "./voice"

describe("pickRecordingMimeType", () => {
  it("prefers WebM Opus when supported", () => {
    expect(pickRecordingMimeType(() => true)).toBe("audio/webm;codecs=opus")
  })

  it("falls back to MP4 for Safari", () => {
    expect(pickRecordingMimeType((t) => t === "audio/mp4")).toBe("audio/mp4")
  })

  it("returns undefined when nothing is supported", () => {
    expect(pickRecordingMimeType(() => false)).toBeUndefined()
  })
})

describe("isAcceptedAudioType", () => {
  it("accepts audio types, including codec parameters", () => {
    expect(isAcceptedAudioType("audio/webm;codecs=opus")).toBe(true)
    expect(isAcceptedAudioType("Audio/MP4")).toBe(true)
  })

  it("rejects non-audio and empty types", () => {
    expect(isAcceptedAudioType("video/webm")).toBe(false)
    expect(isAcceptedAudioType("text/plain")).toBe(false)
    expect(isAcceptedAudioType("")).toBe(false)
  })
})

describe("audioFileExtension", () => {
  it("maps recorder formats to file extensions", () => {
    expect(audioFileExtension("audio/webm;codecs=opus")).toBe("webm")
    expect(audioFileExtension("audio/mp4")).toBe("m4a")
    expect(audioFileExtension("audio/ogg;codecs=opus")).toBe("ogg")
    expect(audioFileExtension("audio/mpeg")).toBe("mp3")
    expect(audioFileExtension("audio/x-wav")).toBe("wav")
  })

  it("defaults to webm for unknown types", () => {
    expect(audioFileExtension("")).toBe("webm")
  })
})

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00")
    expect(formatDuration(9)).toBe("0:09")
    expect(formatDuration(75)).toBe("1:15")
    expect(formatDuration(120)).toBe("2:00")
  })

  it("floors fractions and clamps negatives", () => {
    expect(formatDuration(9.9)).toBe("0:09")
    expect(formatDuration(-3)).toBe("0:00")
  })
})

describe("appendTranscript", () => {
  it("uses the transcript when the input is empty", () => {
    expect(appendTranscript("", " hola ")).toBe("hola")
    expect(appendTranscript("   ", "hola")).toBe("hola")
  })

  it("appends to existing text with a single space", () => {
    expect(appendTranscript("players under 30 ", "with a phone")).toBe(
      "players under 30 with a phone"
    )
  })

  it("keeps the input when the transcript is blank", () => {
    expect(appendTranscript("players", "  ")).toBe("players")
  })
})
