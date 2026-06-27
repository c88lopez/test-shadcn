import { and, count, eq, gte, ne } from "drizzle-orm"
import { db } from "@/db"
import { clubReservationSettings, reservation } from "@/db/schema"
import {
  bookingRuleError,
  DEFAULT_RESERVATION_SETTINGS,
  validateBookingWindow,
  validateCancellation,
} from "@/lib/reservation-settings"
import type {
  BookingWindowInput,
  ReservationSettingsData,
} from "@/lib/reservation-settings"
import { todayInZone } from "@/lib/tz"
import { AppError } from "@/lib/errors"

// Pure data-access + rule enforcement for per-club reservation settings (no
// auth). Kept server-only so the Postgres driver never leaks into the client
// bundle. Wrapped by reservation-settings.functions.ts (session/permission) and
// used by reservations.functions.ts when persisting bookings.

function toData(
  row: typeof clubReservationSettings.$inferSelect
): ReservationSettingsData {
  return {
    timezone: row.timezone,
    hours: row.hours,
    slotDuration: row.slotDuration,
    defaultBookingLength: row.defaultBookingLength,
    minAdvanceHours: row.minAdvanceHours,
    maxAdvanceDays: row.maxAdvanceDays,
    cancellationCutoffHours: row.cancellationCutoffHours,
    maxConcurrentPerPlayer: row.maxConcurrentPerPlayer,
  }
}

// Loads a club's settings, falling back to defaults if no row exists yet (a
// club created before this table, or mid-provisioning).
export async function getReservationSettingsRecord(
  clubId: string
): Promise<ReservationSettingsData> {
  const rows = await db
    .select()
    .from(clubReservationSettings)
    .where(eq(clubReservationSettings.clubId, clubId))
    .limit(1)
  if (rows.length === 0) return DEFAULT_RESERVATION_SETTINGS
  return toData(rows[0])
}

export type ReservationSettingsPatch = Partial<ReservationSettingsData>

// Creates or updates a club's settings row, merging the patch over current
// values (or defaults for a brand-new row).
export async function upsertReservationSettingsRecord(
  clubId: string,
  patch: ReservationSettingsPatch
): Promise<ReservationSettingsData> {
  const current = await getReservationSettingsRecord(clubId)
  const next: ReservationSettingsData = { ...current, ...patch }
  await db
    .insert(clubReservationSettings)
    .values({ clubId, ...next })
    .onConflictDoUpdate({
      target: clubReservationSettings.clubId,
      set: { ...next, updatedAt: new Date() },
    })
  return next
}

// Idempotent: gives a club a default settings row if it doesn't have one. Used
// when provisioning a new club and when seeding.
export async function seedDefaultReservationSettings(
  clubId: string
): Promise<void> {
  await db
    .insert(clubReservationSettings)
    .values({ clubId, ...DEFAULT_RESERVATION_SETTINGS })
    .onConflictDoNothing()
}

// Enforces opening hours, advance window, and per-player concurrency. Throws a
// user-facing Error on the first violation. `excludeId` skips the reservation
// being edited so updates don't conflict with themselves.
export async function assertBookingAllowed(
  clubId: string,
  booking: BookingWindowInput & { player: string },
  options: { excludeId?: string } = {}
): Promise<void> {
  const settings = await getReservationSettingsRecord(clubId)

  const windowError = validateBookingWindow(settings, booking)
  if (windowError) throw bookingRuleError(windowError)

  // Concurrency: how many other upcoming reservations this player already has.
  const today = todayInZone(settings.timezone)
  const filters = [
    eq(reservation.clubId, clubId),
    eq(reservation.player, booking.player),
    gte(reservation.date, today),
  ]
  if (options.excludeId) filters.push(ne(reservation.id, options.excludeId))
  const [{ value: upcoming }] = await db
    .select({ value: count() })
    .from(reservation)
    .where(and(...filters))
  if (upcoming >= settings.maxConcurrentPerPlayer) {
    throw new AppError("errors.booking.concurrency", {
      player: booking.player,
      max: settings.maxConcurrentPerPlayer,
    })
  }
}

// Enforces the cancellation cutoff before deleting a future reservation.
export async function assertCancellationAllowed(
  clubId: string,
  booking: { date: string; startTime: string }
): Promise<void> {
  const settings = await getReservationSettingsRecord(clubId)
  const error = validateCancellation(settings, booking)
  if (error) throw bookingRuleError(error)
}
