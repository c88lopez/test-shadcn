import { timeToMin } from "@/lib/reservation-overlap"

export type ClassStatus = "Upcoming" | "Ongoing" | "Completed"

/**
 * Derives a class's status from its scheduled date/time and duration relative to
 * `now`. Deriving (rather than storing) keeps the status accurate over time
 * without a background job.
 *
 * - before the start    → "Upcoming"
 * - within the session   → "Ongoing"
 * - after it ends        → "Completed"
 */
export function classStatus(
  date: string, // "YYYY-MM-DD"
  startTime: string, // "HH:MM"
  durationMinutes: number,
  now: Date = new Date()
): ClassStatus {
  const start = new Date(`${date}T${startTime}:00`)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  if (now < start) return "Upcoming"
  if (now < end) return "Ongoing"
  return "Completed"
}

/** Formats a duration in minutes as "<n> min" for display. */
export function formatDuration(durationMinutes: number): string {
  return `${durationMinutes} min`
}

/** Converts "HH:MM" + duration into an end-time "HH:MM" (same-day). */
export function endTime(startTime: string, durationMinutes: number): string {
  const total = timeToMin(startTime) + durationMinutes
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
