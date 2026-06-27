import { describe, expect, it, vi } from "vitest"
import type { TFunction } from "i18next"
import { AppError, translateError } from "./errors"

// Minimal fake translator: echoes the key plus any params so assertions can see
// that the code and interpolation values were passed through.
const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key) as unknown as TFunction

describe("AppError", () => {
  it("serializes its code and params into the message", () => {
    const err = new AppError("errors.booking.tooSoon", { hours: 2 })
    expect(err.code).toBe("errors.booking.tooSoon")
    expect(err.params).toEqual({ hours: 2 })
    expect(JSON.parse(err.message)).toMatchObject({
      __appError: true,
      code: "errors.booking.tooSoon",
      params: { hours: 2 },
    })
  })
})

describe("translateError", () => {
  it("translates an AppError using its code and params", () => {
    const result = translateError(
      new AppError("errors.reservation.conflict", {
        start: "10:00",
        end: "11:00",
        player: "Ana",
      }),
      t
    )
    expect(result).toContain("errors.reservation.conflict")
    expect(result).toContain("Ana")
  })

  it("falls back to the provided fallback for a non-AppError", () => {
    expect(translateError(new Error("boom"), t, "fallback")).toBe("fallback")
  })

  it("uses the raw message when there is no fallback", () => {
    expect(translateError(new Error("boom"), t)).toBe("boom")
  })

  it("uses a generic message for non-Error values with no fallback", () => {
    const generic = vi.fn(() => "generic") as unknown as TFunction
    expect(translateError("nope", generic)).toBe("generic")
  })
})
