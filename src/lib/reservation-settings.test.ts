import { describe, expect, it } from "vitest"
import {
  bookingRuleMessage,
  DEFAULT_RESERVATION_SETTINGS,
  defaultHours,
  todayHours,
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

describe("defaultHours", () => {
  it("opens Monday–Saturday and closes Sunday", () => {
    const hours = defaultHours()
    expect(hours.mon).toEqual({ open: "08:00", close: "23:00", closed: false })
    expect(hours.sun.closed).toBe(true)
  })
})

describe("todayHours", () => {
  it("returns the hours for the current weekday", () => {
    const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const
    const expected = settings.hours[keys[new Date().getDay()]]
    expect(todayHours(settings)).toEqual(expected)
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

describe("validateBookingWindow boundaries", () => {
  it("allows a start exactly at opening time", () => {
    const now = at(THU, "06:00")
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "08:00", durationMinutes: 60 },
        now
      )
    ).toBeNull()
  })

  it("allows an end exactly at closing time", () => {
    const now = at(THU, "09:00")
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "22:00", durationMinutes: 60 },
        now
      )
    ).toBeNull()
  })

  it("allows a booking exactly at the minimum advance window", () => {
    const now = at(THU, "11:00") // exactly 1h before a 12:00 start
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "12:00", durationMinutes: 60 },
        now
      )
    ).toBeNull()
  })

  it("allows a booking exactly at the maximum advance window", () => {
    const now = at(THU, "00:00") // today = 2026-01-15; +30 days = 2026-02-14 (Sat)
    expect(
      validateBookingWindow(
        settings,
        { date: "2026-02-14", startTime: "12:00", durationMinutes: 60 },
        now
      )
    ).toBeNull()
  })
})

describe("validateBookingWindow rule precedence", () => {
  it("reports CLOSED before an out-of-hours start", () => {
    const now = at("2026-01-10", "09:00")
    expect(
      validateBookingWindow(
        settings,
        { date: SUN, startTime: "07:00", durationMinutes: 60 },
        now
      )
    ).toEqual({ code: "CLOSED" })
  })

  it("reports OUTSIDE_HOURS before a too-soon start", () => {
    const now = at(THU, "06:45") // 15 min before a 07:00 (pre-open) start
    expect(
      validateBookingWindow(
        settings,
        { date: THU, startTime: "07:00", durationMinutes: 60 },
        now
      )
    ).toMatchObject({ code: "OUTSIDE_HOURS" })
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

  it("allows cancelling exactly at the cutoff boundary", () => {
    const now = at("2026-01-14", "12:00") // exactly 24h before a 12:00 start
    expect(
      validateCancellation(settings, { date: THU, startTime: "12:00" }, now)
    ).toBeNull()
  })

  it("allows cancelling a booking that starts exactly now", () => {
    const now = at(THU, "12:00") // hoursUntilStart === 0, not within the window
    expect(
      validateCancellation(settings, { date: THU, startTime: "12:00" }, now)
    ).toBeNull()
  })
})

describe("bookingRuleMessage", () => {
  it("formats every rule violation into a human-readable message", () => {
    expect(bookingRuleMessage({ code: "CLOSED" })).toMatch(/closed/i)
    expect(
      bookingRuleMessage({
        code: "OUTSIDE_HOURS",
        open: "08:00",
        close: "23:00",
      })
    ).toContain("08:00–23:00")
    expect(
      bookingRuleMessage({ code: "TOO_SOON", minAdvanceHours: 1 })
    ).toContain("1h")
    expect(
      bookingRuleMessage({ code: "TOO_FAR", maxAdvanceDays: 30 })
    ).toContain("30 days")
    expect(
      bookingRuleMessage({ code: "CUTOFF_PASSED", cancellationCutoffHours: 24 })
    ).toContain("24h")
  })
})
