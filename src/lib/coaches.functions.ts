import { createServerFn } from "@tanstack/react-start"
import { asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { coach } from "@/db/schema"
import { requirePermission, requireSession } from "@/lib/auth.server"

const coachInput = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
})

export const listCoaches = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireSession()
    return db.select().from(coach).orderBy(asc(coach.name))
  }
)

export const createCoach = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => coachInput.parse(data))
  .handler(async ({ data }) => {
    await requirePermission("coaches:manage")
    const [created] = await db
      .insert(coach)
      .values({ ...data, birthday: data.birthday ?? null })
      .returning()
    return created
  })

export const updateCoach = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    coachInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("coaches:manage")
    const { id, ...values } = data
    const [updated] = await db
      .update(coach)
      .set({ ...values, birthday: values.birthday ?? null })
      .where(eq(coach.id, id))
      .returning()
    return updated
  })

export const deleteCoach = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("coaches:manage")
    await db.delete(coach).where(eq(coach.id, data.id))
    return { id: data.id }
  })
