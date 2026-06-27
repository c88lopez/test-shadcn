import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { tournament } from "@/db/schema"
import { currentClubId, requireClubId } from "@/lib/auth.server"

const tournamentInput = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  format: z.enum(["round_robin", "elimination", "double_elimination"]),
  maxTeams: z.coerce.number().int().min(2),
})

export const listTournaments = createServerFn({ method: "GET" }).handler(
  async () => {
    const clubId = await currentClubId()
    return db
      .select()
      .from(tournament)
      .where(eq(tournament.clubId, clubId))
      .orderBy(asc(tournament.date), asc(tournament.name))
  }
)

export const createTournament = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tournamentInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("tournaments:manage")
    const [created] = await db
      .insert(tournament)
      .values({ ...data, clubId })
      .returning()
    return created
  })

export const updateTournament = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    tournamentInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("tournaments:manage")
    const { id, ...values } = data
    const [updated] = await db
      .update(tournament)
      .set(values)
      .where(and(eq(tournament.id, id), eq(tournament.clubId, clubId)))
      .returning()
    return updated
  })

export const deleteTournament = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("tournaments:manage")
    await db
      .delete(tournament)
      .where(and(eq(tournament.id, data.id), eq(tournament.clubId, clubId)))
    return { id: data.id }
  })
