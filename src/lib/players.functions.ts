import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { player } from "@/db/schema"
import { currentClubId, requireClubId } from "@/lib/auth.server"

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
    const clubId = await currentClubId()
    return db
      .select()
      .from(player)
      .where(eq(player.clubId, clubId))
      .orderBy(asc(player.fullName))
  }
)

export const createPlayer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => playerInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("players:manage")
    const [created] = await db
      .insert(player)
      .values({ ...data, clubId })
      .returning()
    return created
  })

export const updatePlayer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    playerInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("players:manage")
    const { id, ...values } = data
    const [updated] = await db
      .update(player)
      .set(values)
      .where(and(eq(player.id, id), eq(player.clubId, clubId)))
      .returning()
    return updated
  })

export const deletePlayer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("players:manage")
    await db
      .delete(player)
      .where(and(eq(player.id, data.id), eq(player.clubId, clubId)))
    return { id: data.id }
  })
