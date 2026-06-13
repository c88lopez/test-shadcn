import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { court, reservation } from "@/db/schema"
import {
  currentClubId,
  requireClubId,
  requirePermission,
  resolveActiveClubId,
} from "@/lib/auth.server"
import { assertCourtBookable } from "@/lib/courts.server"
import {
  assertBookingAllowed,
  assertCancellationAllowed,
} from "@/lib/reservation-settings.server"
import { findOverlap, timeToMin } from "@/lib/reservation-overlap"

const reservationInput = z.object({
  courtId: z.string().min(1),
  player: z.string().min(1),
  date: z.string().min(1), // "YYYY-MM-DD"
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]),
})

// Reservation enriched with its court's display name/number for the UI.
export interface ReservationListItem {
  id: string
  courtId: string
  courtName: string
  courtNumber: number
  player: string
  bookedBy: string
  date: string
  startTime: string
  durationMinutes: number
  paymentStatus: string
}

// Returns an overlapping reservation on the same court+date within the club.
async function findConflict(
  clubId: string,
  input: {
    courtId: string
    date: string
    startTime: string
    durationMinutes: number
    excludeId?: string
  }
) {
  const sameSlot = await db
    .select()
    .from(reservation)
    .where(
      and(
        eq(reservation.clubId, clubId),
        eq(reservation.courtId, input.courtId),
        eq(reservation.date, input.date)
      )
    )
  return findOverlap(input, sameSlot, input.excludeId)
}

function conflictError(conflict: {
  startTime: string
  durationMinutes: number
  player: string
}): never {
  const endMin = timeToMin(conflict.startTime) + conflict.durationMinutes
  const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(
    endMin % 60
  ).padStart(2, "0")}`
  throw new Error(
    `Court is already booked ${conflict.startTime}–${end} (${conflict.player}). Pick another time or court.`
  )
}

export const listReservations = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReservationListItem[]> => {
    const clubId = await currentClubId()
    return db
      .select({
        id: reservation.id,
        courtId: reservation.courtId,
        courtName: court.name,
        courtNumber: court.sortOrder,
        player: reservation.player,
        bookedBy: reservation.bookedBy,
        date: reservation.date,
        startTime: reservation.startTime,
        durationMinutes: reservation.durationMinutes,
        paymentStatus: reservation.paymentStatus,
      })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
      .where(eq(reservation.clubId, clubId))
      .orderBy(
        asc(reservation.date),
        asc(court.sortOrder),
        asc(reservation.startTime)
      )
  }
)

export const createReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reservationInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission("reservations:manage")
    const clubId = await resolveActiveClubId(session.user)
    if (!clubId) throw new Error("This action requires a club context.")
    await assertCourtBookable(clubId, data.courtId)
    await assertBookingAllowed(clubId, data)
    const conflict = await findConflict(clubId, data)
    if (conflict) conflictError(conflict)
    const [created] = await db
      .insert(reservation)
      .values({ ...data, bookedBy: session.user.name, clubId })
      .returning()
    return created
  })

export const updateReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    reservationInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("reservations:manage")
    const { id, ...values } = data
    await assertCourtBookable(clubId, values.courtId)
    await assertBookingAllowed(clubId, values, { excludeId: id })
    const conflict = await findConflict(clubId, { ...values, excludeId: id })
    if (conflict) conflictError(conflict)
    const [updated] = await db
      .update(reservation)
      .set(values)
      .where(and(eq(reservation.id, id), eq(reservation.clubId, clubId)))
      .returning()
    return updated
  })

export const deleteReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("reservations:manage")
    const existing = await db
      .select({
        date: reservation.date,
        startTime: reservation.startTime,
      })
      .from(reservation)
      .where(and(eq(reservation.id, data.id), eq(reservation.clubId, clubId)))
      .limit(1)
    if (existing.length > 0)
      await assertCancellationAllowed(clubId, existing[0])
    await db
      .delete(reservation)
      .where(and(eq(reservation.id, data.id), eq(reservation.clubId, clubId)))
    return { id: data.id }
  })
