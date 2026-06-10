import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { coach, coachClass } from "@/db/schema"
import { currentClubId, requireClubId } from "@/lib/auth.server"

const classInput = z.object({
  coachId: z.string().min(1),
  court: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
})

export interface ClassRecord {
  id: string
  coachId: string | null
  coachName: string
  court: number
  date: string
  startTime: string
  durationMinutes: number
}

export const listClasses = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClassRecord[]> => {
    const clubId = await currentClubId()
    const rows = await db
      .select({
        id: coachClass.id,
        coachId: coachClass.coachId,
        coachName: coach.name,
        court: coachClass.court,
        date: coachClass.date,
        startTime: coachClass.startTime,
        durationMinutes: coachClass.durationMinutes,
      })
      .from(coachClass)
      .leftJoin(coach, eq(coachClass.coachId, coach.id))
      .where(eq(coachClass.clubId, clubId))
      .orderBy(asc(coachClass.date), asc(coachClass.startTime))

    return rows.map((row) => ({
      ...row,
      coachName: row.coachName ?? "—",
    }))
  }
)

export const createClass = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => classInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("coaches:manage")
    const [created] = await db
      .insert(coachClass)
      .values({ ...data, clubId })
      .returning()
    return created
  })

export const updateClass = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    classInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("coaches:manage")
    const { id, ...values } = data
    const [updated] = await db
      .update(coachClass)
      .set(values)
      .where(and(eq(coachClass.id, id), eq(coachClass.clubId, clubId)))
      .returning()
    return updated
  })

export const deleteClass = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("coaches:manage")
    await db
      .delete(coachClass)
      .where(and(eq(coachClass.id, data.id), eq(coachClass.clubId, clubId)))
    return { id: data.id }
  })
