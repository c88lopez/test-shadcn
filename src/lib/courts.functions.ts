import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { currentClubId, requireClubId } from "@/lib/auth.server"
import {
  countCourtUsageRecord,
  createCourtRecord,
  deleteCourtRecord,
  listCourtRecords,
  updateCourtRecord,
} from "@/lib/courts.server"

// Type-only re-export so client imports keep working without pulling the server
// module into the client bundle.
export type { CourtRecord, CourtUsage } from "@/lib/courts.server"

const courtTypeSchema = z.enum(["indoor", "outdoor"])

const createInput = z.object({
  name: z.string().min(1),
  type: courtTypeSchema.default("indoor"),
  active: z.boolean().default(true),
})

const updateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  type: courtTypeSchema.optional(),
  active: z.boolean().optional(),
})

const idInput = z.object({ id: z.string().min(1) })

// Readable by any authenticated user in the club (the reservation timeline and
// booking drawer both need the court list).
export const listCourts = createServerFn({ method: "GET" }).handler(
  async () => {
    const clubId = await currentClubId()
    return listCourtRecords(clubId)
  }
)

export const createCourt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("settings:manage")
    return createCourtRecord(clubId, data)
  })

export const updateCourt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("settings:manage")
    return updateCourtRecord(clubId, data)
  })

export const countCourtUsage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await currentClubId()
    return countCourtUsageRecord(clubId, data.id)
  })

export const deleteCourt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("settings:manage")
    return deleteCourtRecord(clubId, data.id)
  })
