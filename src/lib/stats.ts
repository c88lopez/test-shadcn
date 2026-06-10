// Pure, dependency-light aggregation helpers for dashboard metrics. Kept free of
// any server-only imports (no `db`) so they can be unit-tested and reused on both
// sides. The server stats functions fetch raw rows and delegate the number
// crunching to these reducers.

import { timeToMin } from "@/lib/reservation-overlap"

export interface DayBucket {
  /** ISO date, "yyyy-MM-dd". */
  date: string
  /** Short human label, e.g. "Mon". */
  label: string
}

export interface ReservationRow {
  court: number
  player: string
  date: string
  startTime: string
  durationMinutes: number
  paymentStatus: string
}

export interface SaleLineRow {
  date: string
  name: string
  quantity: number
  unitPrice: number
  category: string | null
}

export interface PlayerRow {
  createdAt: Date
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Distinct courts with a reservation in progress at `nowMin` on `today`. */
export function occupiedCourtsNow(
  rows: ReservationRow[],
  today: string,
  nowMin: number
): number {
  const courts = new Set<number>()
  for (const r of rows) {
    if (r.date !== today) continue
    const start = timeToMin(r.startTime)
    if (start <= nowMin && nowMin < start + r.durationMinutes) {
      courts.add(r.court)
    }
  }
  return courts.size
}

/** Reservation count per day, in the order of the supplied buckets. */
export function reservationsPerDay(
  rows: ReservationRow[],
  days: DayBucket[]
): { day: string; reservations: number }[] {
  return days.map((d) => ({
    day: d.label,
    reservations: rows.filter((r) => r.date === d.date).length,
  }))
}

/** Revenue (quantity × unitPrice) per day, in the order of the supplied buckets. */
export function revenuePerDay(
  rows: SaleLineRow[],
  days: DayBucket[]
): { day: string; revenue: number }[] {
  return days.map((d) => ({
    day: d.label,
    revenue: round2(
      rows
        .filter((r) => r.date === d.date)
        .reduce((sum, r) => sum + r.quantity * r.unitPrice, 0)
    ),
  }))
}

/** Revenue grouped by product category. Null categories bucket into "Other". */
export function revenueByCategory(
  rows: SaleLineRow[]
): { category: string; revenue: number }[] {
  const totals = new Map<string, number>()
  for (const r of rows) {
    const key = r.category ?? "Other"
    totals.set(key, (totals.get(key) ?? 0) + r.quantity * r.unitPrice)
  }
  return [...totals.entries()]
    .map(([category, revenue]) => ({ category, revenue: round2(revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
}

/** Top `n` products by revenue. */
export function topProducts(
  rows: SaleLineRow[],
  n: number
): { name: string; sales: number }[] {
  const totals = new Map<string, number>()
  for (const r of rows) {
    totals.set(r.name, (totals.get(r.name) ?? 0) + r.quantity * r.unitPrice)
  }
  return [...totals.entries()]
    .map(([name, sales]) => ({ name, sales: round2(sales) }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, n)
}

/** Total revenue across all supplied sale lines. */
export function totalRevenue(rows: SaleLineRow[]): number {
  return round2(rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0))
}

/** The single highest entry of a count map, or null when empty. */
function topEntry<T>(counts: Map<T, number>): { key: T; count: number } | null {
  let best: { key: T; count: number } | null = null
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count }
  }
  return best
}

/** Player with the most reservations, or null when there are none. */
export function topReservationPlayer(
  rows: ReservationRow[]
): { name: string; count: number } | null {
  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r.player, (counts.get(r.player) ?? 0) + 1)
  const top = topEntry(counts)
  return top ? { name: top.key, count: top.count } : null
}

/** Court with the most reservations, or null when there are none. */
export function busiestCourt(
  rows: ReservationRow[]
): { court: number; count: number } | null {
  const counts = new Map<number, number>()
  for (const r of rows) counts.set(r.court, (counts.get(r.court) ?? 0) + 1)
  const top = topEntry(counts)
  return top ? { court: top.key, count: top.count } : null
}

/**
 * Cumulative player count at the end of each supplied month. `months` is an array
 * of { date: last day of month (ISO), label } buckets in chronological order.
 */
export function cumulativePlayersByMonth(
  players: PlayerRow[],
  months: { end: Date; label: string }[]
): { month: string; subscribers: number }[] {
  return months.map((m) => ({
    month: m.label,
    subscribers: players.filter((p) => p.createdAt <= m.end).length,
  }))
}
