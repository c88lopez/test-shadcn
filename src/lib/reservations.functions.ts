import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { reservation } from "@/db/schema"
import { requirePermission, requireSession } from "@/lib/auth.server"
import { findOverlap, timeToMin } from "@/lib/reservation-overlap"

const reservationInput = z.object({
  court: z.coerce.number().int().positive(),
  player: z.string().min(1),
  date: z.string().min(1), // "YYYY-MM-DD"
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]),
})

// Returns an overlapping reservation on the same court+date, if any.
async function findConflict(input: {
  court: number
  date: string
  startTime: string
  durationMinutes: number
  excludeId?: string
}) {
  const sameSlot = await db
    .select()
    .from(reservation)
    .where(
      and(eq(reservation.court, input.court), eq(reservation.date, input.date))
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
  async () => {
    await requireSession()
    return db
      .select()
      .from(reservation)
      .orderBy(
        asc(reservation.date),
        asc(reservation.court),
        asc(reservation.startTime)
      )
  }
)

export const createReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reservationInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission("reservations:manage")
    const conflict = await findConflict(data)
    if (conflict) conflictError(conflict)
    const [created] = await db
      .insert(reservation)
      .values({ ...data, bookedBy: session.user.name })
      .returning()
    return created
  })

export const updateReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    reservationInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("reservations:manage")
    const { id, ...values } = data
    const conflict = await findConflict({ ...values, excludeId: id })
    if (conflict) conflictError(conflict)
    const [updated] = await db
      .update(reservation)
      .set(values)
      .where(eq(reservation.id, id))
      .returning()
    return updated
  })

export const deleteReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("reservations:manage")
    await db.delete(reservation).where(eq(reservation.id, data.id))
    return { id: data.id }
  })
