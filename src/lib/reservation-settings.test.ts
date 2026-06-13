import { describe, expect, it } from "vitest"
import {
  DEFAULT_RESERVATION_SETTINGS,
  validateBookingWindow,
  validateCancellation,
  weekdayKey,
} from "./reservation-settings"

// Use UTC so wall-clock math is deterministic. Defaults: Mon–Sat 08:00–23:00,
// Sun closed; minAdvance 1h, maxAdvance 30d, cutoff 24h.
const settings = { ...DEFAULT_RESERVATION_SETTINGS, timezone: "UTC" }

// 2026-01-15 is a Thursday; 2026-01-18 is a Sunday.
const THU = "2026-01-15"
const SUN = "2026-01-18"

function at(date: string, time: string): Date {
  return new Date(`${date}T${time}:00Z`)
}

describe("weekdayKey", () => {
  it("maps calendar dates to weekday keys", () => {
    expect(weekdayKey(THU)).toBe("thu")
    expect(weekdayKey(SUN)).toBe("sun")
  })
})

describe("validateBookingWindow", () => {
  it("allows a valid in-hours booking made far enough ahead", () => {
    const now = at(THU, "09:00")
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "12:00", durationMinutes: 60 },
        now
      )
    ).toBeNull()
  })

  it("rejects bookings on a closed day", () => {
    const now = at("2026-01-10", "09:00")
    expect(
      validateBookingWindow(
        settings,
        { date: SUN, startTime: "12:00", durationMinutes: 60 },
        now
      )
    ).toEqual({ code: "CLOSED" })
  })

  it("rejects a start before opening", () => {
    const now = at("2026-01-10", "09:00")
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "07:00", durationMinutes: 60 },
        now
      )
    ).toMatchObject({ code: "OUTSIDE_HOURS" })
  })

  it("rejects an end after closing", () => {
    const now = at("2026-01-10", "09:00")
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "22:30", durationMinutes: 60 },
        now
      )
    ).toMatchObject({ code: "OUTSIDE_HOURS" })
  })

  it("rejects bookings inside the minimum advance window", () => {
    const now = at(THU, "11:30") // 30 min before a 12:00 start
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "12:00", durationMinutes: 60 },
        now
      )
    ).toEqual({ code: "TOO_SOON", minAdvanceHours: 1 })
  })

  it("rejects bookings beyond the maximum advance window", () => {
    const now = at(THU, "00:00")
    expect(
      validateBookingWindow(
        settings,
        { date: "2026-03-02", startTime: "12:00", durationMinutes: 60 },
        now
      )
    ).toEqual({ code: "TOO_FAR", maxAdvanceDays: 30 })
  })
})

describe("validateCancellation", () => {
  it("blocks cancelling a future booking within the cutoff", () => {
    const now = at(THU, "10:00") // 2h before a 12:00 start, cutoff 24h
    expect(
      validateCancellation(settings, { date: THU, startTime: "12:00" }, now)
    ).toEqual({ code: "CUTOFF_PASSED", cancellationCutoffHours: 24 })
  })

  it("allows cancelling a past booking", () => {
    const now = at(THU, "13:00") // already started
    expect(
      validateCancellation(settings, { date: THU, startTime: "12:00" }, now)
    ).toBeNull()
  })

  it("allows cancelling far enough ahead of the cutoff", () => {
    const now = at("2026-01-13", "12:00") // 48h before
    expect(
      validateCancellation(settings, { date: THU, startTime: "12:00" }, now)
    ).toBeNull()
  })

  it("never blocks when the cutoff is zero", () => {
    const now = at(THU, "11:59")
    expect(
      validateCancellation(
        { ...settings, cancellationCutoffHours: 0 },
        { date: THU, startTime: "12:00" },
        now
      )
    ).toBeNull()
  })
})
