/**
 * Tiny timezone helpers built on `Intl` (no extra deps). Used server-side to
 * compare a club-local booking time against "now" when enforcing booking rules.
 * These intentionally ignore sub-minute precision and rare DST-transition edge
 * cases — good enough for advance-window / cutoff checks.
 */

// The UTC offset (ms) that `timeZone` is at for the given instant.
function offsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const parts = dtf.formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  )
  return asUtc - instant.getTime()
}

/**
 * Converts a wall-clock time in `timeZone` (date "YYYY-MM-DD" + "HH:MM") into a
 * UTC epoch in ms.
 */
export function zonedWallTimeToUtcMs(
  date: string,
  time: string,
  timeZone: string
): number {
  const [y, mo, d] = date.split("-").map(Number)
  const [h, mi] = time.split(":").map(Number)
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi)
  // Subtract the zone offset to land on the real instant. One correction pass is
  // sufficient outside of DST jumps.
  const offset = offsetMs(new Date(naiveUtc), timeZone)
  return naiveUtc - offset
}

/** Today's calendar date ("YYYY-MM-DD") in the given timezone. */
export function todayInZone(timeZone: string, now: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return dtf.format(now) // en-CA formats as YYYY-MM-DD
}

/** Whole calendar days from `fromDate` to `toDate` (both "YYYY-MM-DD"). */
export function calendarDaysBetween(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number)
  const [ty, tm, td] = toDate.split("-").map(Number)
  const from = Date.UTC(fy, fm - 1, fd)
  const to = Date.UTC(ty, tm - 1, td)
  return Math.round((to - from) / 86_400_000)
}
