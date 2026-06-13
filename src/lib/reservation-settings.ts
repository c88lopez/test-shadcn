/**
 * Shared, dependency-free reservation settings: opening hours + booking rules.
 * This is the single source of truth for the *shape* and defaults; the values
 * live per-club in the database (see reservation-settings.server.ts). Imported
 * by both client (settings UI, timeline) and server (rule enforcement), so it
 * must stay free of React and the DB driver.
 */

import {
  calendarDaysBetween,
  todayInZone,
  zonedWallTimeToUtcMs,
} from "@/lib/tz"

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export interface ReservationSettingsData {
  timezone: string
  hours: Record<Weekday, DayHours>
  slotDuration: number
  defaultBookingLength: number
  minAdvanceHours: number
  maxAdvanceDays: number
  cancellationCutoffHours: number
  maxConcurrentPerPlayer: number
}

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
]

export const SLOT_DURATIONS = [30, 60, 90] as const

// JS Date.getDay() (0 = Sunday) → our weekday keys.
const DAY_INDEX_TO_KEY: Weekday[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
]

export function defaultHours(): Record<Weekday, DayHours> {
  return Object.fromEntries(
    WEEKDAYS.map((d) => [
      d.key,
      { open: "08:00", close: "23:00", closed: d.key === "sun" },
    ])
  ) as Record<Weekday, DayHours>
}

export const DEFAULT_RESERVATION_SETTINGS: ReservationSettingsData = {
  timezone: "Europe/Madrid",
  hours: defaultHours(),
  slotDuration: 60,
  defaultBookingLength: 90,
  minAdvanceHours: 1,
  maxAdvanceDays: 30,
  cancellationCutoffHours: 24,
  maxConcurrentPerPlayer: 2,
}

/** Weekday key for a "YYYY-MM-DD" calendar date. */
export function weekdayKey(date: string): Weekday {
  const [y, m, d] = date.split("-").map(Number)
  return DAY_INDEX_TO_KEY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

/** Hours for "today" in the viewer's locale (used by the timeline). */
export function todayHours(settings: {
  hours: Record<Weekday, DayHours>
}): DayHours {
  return settings.hours[DAY_INDEX_TO_KEY[new Date().getDay()]]
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

// --- Booking rule validation (pure) ---

export type BookingRuleError =
  | { code: "CLOSED" }
  | { code: "OUTSIDE_HOURS"; open: string; close: string }
  | { code: "TOO_SOON"; minAdvanceHours: number }
  | { code: "TOO_FAR"; maxAdvanceDays: number }

export interface BookingWindowInput {
  date: string
  startTime: string
  durationMinutes: number
}

/**
 * Validates a booking against opening hours and the advance window. Returns the
 * first violation found, or null when the booking is allowed. Concurrency
 * (max bookings per player) needs a DB count and is enforced separately.
 */
export function validateBookingWindow(
  settings: ReservationSettingsData,
  booking: BookingWindowInput,
  now: Date = new Date()
): BookingRuleError | null {
  const day = settings.hours[weekdayKey(booking.date)]
  if (day.closed) return { code: "CLOSED" }

  const start = toMinutes(booking.startTime)
  const end = start + booking.durationMinutes
  if (start < toMinutes(day.open) || end > toMinutes(day.close)) {
    return { code: "OUTSIDE_HOURS", open: day.open, close: day.close }
  }

  const startMs = zonedWallTimeToUtcMs(
    booking.date,
    booking.startTime,
    settings.timezone
  )
  const hoursUntilStart = (startMs - now.getTime()) / 3_600_000
  if (hoursUntilStart < settings.minAdvanceHours) {
    return { code: "TOO_SOON", minAdvanceHours: settings.minAdvanceHours }
  }

  const today = todayInZone(settings.timezone, now)
  if (calendarDaysBetween(today, booking.date) > settings.maxAdvanceDays) {
    return { code: "TOO_FAR", maxAdvanceDays: settings.maxAdvanceDays }
  }

  return null
}

export type CancellationRuleError = {
  code: "CUTOFF_PASSED"
  cancellationCutoffHours: number
}

/**
 * Blocks cancelling a *future* booking that starts within the cutoff window.
 * Past bookings (already started) are always cancellable so staff can clean up.
 */
export function validateCancellation(
  settings: ReservationSettingsData,
  booking: { date: string; startTime: string },
  now: Date = new Date()
): CancellationRuleError | null {
  if (settings.cancellationCutoffHours <= 0) return null
  const startMs = zonedWallTimeToUtcMs(
    booking.date,
    booking.startTime,
    settings.timezone
  )
  const hoursUntilStart = (startMs - now.getTime()) / 3_600_000
  if (
    hoursUntilStart > 0 &&
    hoursUntilStart < settings.cancellationCutoffHours
  ) {
    return {
      code: "CUTOFF_PASSED",
      cancellationCutoffHours: settings.cancellationCutoffHours,
    }
  }
  return null
}

/** Human-readable message for a rule violation (thrown by server fns). */
export function bookingRuleMessage(
  error: BookingRuleError | CancellationRuleError
): string {
  switch (error.code) {
    case "CLOSED":
      return "The club is closed on that day. Pick another date."
    case "OUTSIDE_HOURS":
      return `That time is outside opening hours (${error.open}–${error.close}).`
    case "TOO_SOON":
      return `Bookings must be made at least ${error.minAdvanceHours}h in advance.`
    case "TOO_FAR":
      return `Bookings can't be made more than ${error.maxAdvanceDays} days ahead.`
    case "CUTOFF_PASSED":
      return `This booking can no longer be cancelled (within ${error.cancellationCutoffHours}h of start).`
  }
}
