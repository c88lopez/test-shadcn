import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { currentClubId, requireClubId } from "@/lib/auth.server"
import {
  getReservationSettingsRecord,
  upsertReservationSettingsRecord,
} from "@/lib/reservation-settings.server"

// Type-only re-export so client modules can import the shape without pulling the
// server module (and the Postgres driver) into the client bundle.
export type {
  ReservationSettingsData,
  Weekday,
  DayHours,
} from "@/lib/reservation-settings"

const dayHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
})

const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

const updateInput = z
  .object({
    timezone: z.string().min(1),
    hours: z.object(
      Object.fromEntries(weekdayKeys.map((k) => [k, dayHoursSchema])) as Record<
        (typeof weekdayKeys)[number],
        typeof dayHoursSchema
      >
    ),
    slotDuration: z.coerce.number().int().min(15).max(180),
    defaultBookingLength: z.coerce.number().int().min(15).max(360),
    minAdvanceHours: z.coerce.number().int().min(0).max(720),
    maxAdvanceDays: z.coerce.number().int().min(1).max(365),
    cancellationCutoffHours: z.coerce.number().int().min(0).max(720),
    maxConcurrentPerPlayer: z.coerce.number().int().min(1).max(50),
  })
  .partial()

// Readable by any authenticated user (the timeline and booking drawer need
// opening hours / slot config).
export const getReservationSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    const clubId = await currentClubId()
    return getReservationSettingsRecord(clubId)
  }
)

export const updateReservationSettings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("settings:manage")
    return upsertReservationSettingsRecord(clubId, data)
  })
