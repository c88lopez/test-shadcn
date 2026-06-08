// Pure, dependency-free booking-overlap helpers. Kept separate from
// `reservations.functions.ts` (which imports server-only `db`) so the logic can
// be unit-tested and reused on both sides.

export interface TimeSlot {
  startTime: string // "HH:MM"
  durationMinutes: number
}

export function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** True when two time slots overlap (touching edges do not count). */
export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  const aStart = timeToMin(a.startTime)
  const aEnd = aStart + a.durationMinutes
  const bStart = timeToMin(b.startTime)
  const bEnd = bStart + b.durationMinutes
  return aStart < bEnd && bStart < aEnd
}

/** Returns the first existing slot that overlaps the candidate, if any. */
export function findOverlap<T extends TimeSlot & { id?: string }>(
  candidate: TimeSlot,
  existing: T[],
  excludeId?: string
): T | undefined {
  return existing.find(
    (slot) =>
      !(excludeId && slot.id === excludeId) && slotsOverlap(candidate, slot)
  )
}
