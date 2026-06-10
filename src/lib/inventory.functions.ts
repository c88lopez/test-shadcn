import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { stockItem } from "@/db/schema"
import { currentClubId, requireClubId } from "@/lib/auth.server"

const stockItemInput = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
})

export const listStockItems = createServerFn({ method: "GET" }).handler(
  async () => {
    const clubId = await currentClubId()
    return db
      .select()
      .from(stockItem)
      .where(eq(stockItem.clubId, clubId))
      .orderBy(asc(stockItem.name))
  }
)

export const createStockItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => stockItemInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await requireClubId("inventory:manage")
    const [created] = await db
      .insert(stockItem)
      .values({ ...data, clubId })
      .returning()
    return created
  })

export const updateStockItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    stockItemInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("inventory:manage")
    const { id, ...values } = data
    const [updated] = await db
      .update(stockItem)
      .set(values)
      .where(and(eq(stockItem.id, id), eq(stockItem.clubId, clubId)))
      .returning()
    return updated
  })

export const setStockLevel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ id: z.string().min(1), stock: z.coerce.number().int().min(0) })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("inventory:manage")
    const [updated] = await db
      .update(stockItem)
      .set({ stock: data.stock })
      .where(and(eq(stockItem.id, data.id), eq(stockItem.clubId, clubId)))
      .returning()
    return updated
  })

export const deleteStockItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const clubId = await requireClubId("inventory:manage")
    await db
      .delete(stockItem)
      .where(and(eq(stockItem.id, data.id), eq(stockItem.clubId, clubId)))
    return { id: data.id }
  })
