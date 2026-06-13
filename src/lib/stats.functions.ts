import { createServerFn } from "@tanstack/react-start"
import { and, count, eq, inArray } from "drizzle-orm"
import { addDays, endOfMonth, format, startOfWeek, subMonths } from "date-fns"
import { db } from "@/db"
import {
  court,
  player,
  reservation,
  sale,
  saleItem,
  stockItem,
} from "@/db/schema"
import { currentClubId } from "@/lib/auth.server"
import { endTime } from "@/lib/classes"
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
import type { DayBucket } from "@/lib/stats"

function currentWeek(now: Date): DayBucket[] {
  const start = startOfWeek(now, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE") }
  })
}

export const getOverviewStats = createServerFn({ method: "GET" }).handler(
  async () => {
    const clubId = await currentClubId()
    const now = new Date()
    const days = currentWeek(now)
    const weekDates = days.map((d) => d.date)
    const todayStr = format(now, "yyyy-MM-dd")
    const nowMin = now.getHours() * 60 + now.getMinutes()

    const weekRes = await db
      .select({
        court: court.sortOrder,
        player: reservation.player,
        date: reservation.date,
        startTime: reservation.startTime,
        durationMinutes: reservation.durationMinutes,
        paymentStatus: reservation.paymentStatus,
      })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
      .where(
        and(
          eq(reservation.clubId, clubId),
          inArray(reservation.date, weekDates)
        )
      )

    const [activeCourtsRow] = await db
      .select({ value: count() })
      .from(court)
      .where(and(eq(court.clubId, clubId), eq(court.active, true)))

    const months = Array.from({ length: 7 }, (_, i) => {
      const d = subMonths(now, 6 - i)
      return { end: endOfMonth(d), label: format(d, "MMM") }
    })
    const players = await db
      .select({ createdAt: player.createdAt })
      .from(player)
      .where(eq(player.clubId, clubId))

    const weekly = reservationsPerDay(weekRes, days)
    const subscribers = cumulativePlayersByMonth(players, months)
    const subscribersTotal = subscribers.at(-1)?.subscribers ?? 0
    const subscribersGrowth =
      subscribersTotal - (subscribers[0]?.subscribers ?? 0)

    const today = weekRes
      .filter((r) => r.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((r) => ({
        court: r.court,
        player: r.player,
        time: `${r.startTime} – ${endTime(r.startTime, r.durationMinutes)}`,
        paid: r.paymentStatus === "paid",
      }))

    return {
      courtsOccupiedNow: occupiedCourtsNow(weekRes, todayStr, nowMin),
      activeCourts: activeCourtsRow.value,
      weekly,
      weeklyTotal: weekly.reduce((s, d) => s + d.reservations, 0),
      subscribers,
      subscribersTotal,
      subscribersGrowth,
      today,
      todayTotal: today.length,
    }
  }
)

export const getSalesStats = createServerFn({ method: "GET" }).handler(
  async () => {
    const clubId = await currentClubId()
    const now = new Date()
    const days = currentWeek(now)
    const weekDates = days.map((d) => d.date)

    const lines = await db
      .select({
        date: sale.date,
        saleId: saleItem.saleId,
        name: saleItem.name,
        quantity: saleItem.quantity,
        unitPrice: saleItem.unitPrice,
        category: stockItem.category,
      })
      .from(saleItem)
      .innerJoin(sale, eq(saleItem.saleId, sale.id))
      .leftJoin(stockItem, eq(saleItem.stockItemId, stockItem.id))
      .where(and(eq(sale.clubId, clubId), inArray(sale.date, weekDates)))

    const products = topProducts(lines, 5)
    const orders = new Set(lines.map((l) => l.saleId)).size

    return {
      dailyRevenue: revenuePerDay(lines, days),
      revenueByCategory: revenueByCategory(lines),
      topProducts: products,
      totalRevenue: totalRevenue(lines),
      totalOrders: orders,
      bestSeller: products.length > 0 ? products[0] : null,
    }
  }
)

export const getPlayerStats = createServerFn({ method: "GET" }).handler(
  async () => {
    const clubId = await currentClubId()
    const rows = await db
      .select({
        court: court.sortOrder,
        player: reservation.player,
        date: reservation.date,
        startTime: reservation.startTime,
        durationMinutes: reservation.durationMinutes,
        paymentStatus: reservation.paymentStatus,
      })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
      .where(eq(reservation.clubId, clubId))

    return {
      topReservationPlayer: topReservationPlayer(rows),
      busiestCourt: busiestCourt(rows),
    }
  }
)
