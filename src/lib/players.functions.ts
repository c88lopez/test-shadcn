import { createServerFn } from "@tanstack/react-start"
import { eq, asc } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { player } from "@/db/schema"
import { requirePermission, requireSession } from "@/lib/auth.server"

const playerInput = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  age: z.coerce.number().int().min(5).max(99),
  gender: z.enum(["Male", "Female"]),
  category: z.string().min(1),
})

export const listPlayers = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireSession()
    return db.select().from(player).orderBy(asc(player.fullName))
  }
)

export const createPlayer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => playerInput.parse(data))
  .handler(async ({ data }) => {
    await requirePermission("players:manage")
    const [created] = await db.insert(player).values(data).returning()
    return created
  })

export const updatePlayer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    playerInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("players:manage")
    const { id, ...values } = data
    const [updated] = await db
      .update(player)
      .set(values)
      .where(eq(player.id, id))
      .returning()
    return updated
  })

export const deletePlayer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("players:manage")
    await db.delete(player).where(eq(player.id, data.id))
    return { id: data.id }
  })
