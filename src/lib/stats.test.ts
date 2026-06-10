import { describe, it, expect } from "vitest"
import {
  busiestCourt,
  cumulativePlayersByMonth,
  occupiedCourtsNow,
  reservationsPerDay,
  revenueByCategory,
  revenuePerDay,
  topProducts,
  topReservationPlayer,
  totalRevenue,
} from "@/lib/stats"
import type { DayBucket, ReservationRow, SaleLineRow } from "@/lib/stats"

function res(p: Partial<ReservationRow>): ReservationRow {
  return {
    court: 1,
    player: "A",
    date: "2026-06-08",
    startTime: "10:00",
    durationMinutes: 90,
    paymentStatus: "paid",
    ...p,
  }
}

function line(p: Partial<SaleLineRow>): SaleLineRow {
  return {
    date: "2026-06-08",
    name: "Item",
    quantity: 1,
    unitPrice: 10,
    category: "Drinks",
    ...p,
  }
}

describe("occupiedCourtsNow", () => {
  it("counts distinct courts with a reservation in progress", () => {
    const rows = [
      res({ court: 1, startTime: "09:00", durationMinutes: 90 }), // 09:00-10:30
      res({ court: 1, startTime: "10:00", durationMinutes: 60 }), // overlaps too, same court
      res({ court: 2, startTime: "10:00", durationMinutes: 60 }), // 10:00-11:00
      res({ court: 3, startTime: "12:00", durationMinutes: 60 }), // not yet
    ]
    // now = 10:15 -> courts 1 and 2 active
    expect(occupiedCourtsNow(rows, "2026-06-08", 10 * 60 + 15)).toBe(2)
  })

  it("ignores other days and exact end edges", () => {
    const rows = [
      res({ court: 1, date: "2026-06-07", startTime: "10:00" }),
      res({ court: 2, startTime: "09:00", durationMinutes: 60 }), // ends exactly 10:00
    ]
    expect(occupiedCourtsNow(rows, "2026-06-08", 10 * 60)).toBe(0)
  })
})

describe("reservationsPerDay", () => {
  it("buckets reservations by date in order", () => {
    const days: DayBucket[] = [
      { date: "2026-06-08", label: "Mon" },
      { date: "2026-06-09", label: "Tue" },
    ]
    const rows = [
      res({ date: "2026-06-08" }),
      res({ date: "2026-06-08" }),
      res({ date: "2026-06-09" }),
    ]
    expect(reservationsPerDay(rows, days)).toEqual([
      { day: "Mon", reservations: 2 },
      { day: "Tue", reservations: 1 },
    ])
  })
})

describe("revenue helpers", () => {
  const rows = [
    line({ date: "2026-06-08", category: "Drinks", quantity: 2, unitPrice: 3 }),
    line({
      date: "2026-06-08",
      category: "Equipment",
      quantity: 1,
      unitPrice: 100,
    }),
    line({ date: "2026-06-09", category: "Drinks", quantity: 1, unitPrice: 3 }),
    line({
      date: "2026-06-09",
      category: null,
      name: "Gone",
      quantity: 1,
      unitPrice: 5,
    }),
  ]

  it("sums revenue per day", () => {
    const days: DayBucket[] = [
      { date: "2026-06-08", label: "Mon" },
      { date: "2026-06-09", label: "Tue" },
    ]
    expect(revenuePerDay(rows, days)).toEqual([
      { day: "Mon", revenue: 106 },
      { day: "Tue", revenue: 8 },
    ])
  })

  it("groups revenue by category with Other fallback", () => {
    expect(revenueByCategory(rows)).toEqual([
      { category: "Equipment", revenue: 100 },
      { category: "Drinks", revenue: 9 },
      { category: "Other", revenue: 5 },
    ])
  })

  it("ranks top products", () => {
    expect(topProducts(rows, 2)).toEqual([
      { name: "Item", sales: 109 },
      { name: "Gone", sales: 5 },
    ])
  })

  it("totals all revenue", () => {
    expect(totalRevenue(rows)).toBe(114)
  })
})

describe("leaderboards", () => {
  it("finds the top reservation player and busiest court", () => {
    const rows = [
      res({ player: "A", court: 1 }),
      res({ player: "A", court: 2 }),
      res({ player: "B", court: 2 }),
    ]
    expect(topReservationPlayer(rows)).toEqual({ name: "A", count: 2 })
    expect(busiestCourt(rows)).toEqual({ court: 2, count: 2 })
  })

  it("returns null when empty", () => {
    expect(topReservationPlayer([])).toBeNull()
    expect(busiestCourt([])).toBeNull()
  })
})

describe("cumulativePlayersByMonth", () => {
  it("counts players registered on or before each month end", () => {
    const players = [
      { createdAt: new Date("2026-04-15T00:00:00Z") },
      { createdAt: new Date("2026-05-20T00:00:00Z") },
      { createdAt: new Date("2026-06-15T00:00:00Z") },
    ]
    const months = [
      { end: new Date("2026-04-30T23:59:59Z"), label: "Apr" },
      { end: new Date("2026-05-31T23:59:59Z"), label: "May" },
      { end: new Date("2026-06-30T23:59:59Z"), label: "Jun" },
    ]
    expect(cumulativePlayersByMonth(players, months)).toEqual([
      { month: "Apr", subscribers: 1 },
      { month: "May", subscribers: 2 },
      { month: "Jun", subscribers: 3 },
    ])
  })
})
