import { createServerFn } from "@tanstack/react-start"
import { asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { stockItem } from "@/db/schema"
import { requirePermission, requireSession } from "@/lib/auth.server"

const stockItemInput = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
})

export const listStockItems = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireSession()
    return db.select().from(stockItem).orderBy(asc(stockItem.name))
  }
)

export const createStockItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => stockItemInput.parse(data))
  .handler(async ({ data }) => {
    await requirePermission("inventory:manage")
    const [created] = await db.insert(stockItem).values(data).returning()
    return created
  })

export const updateStockItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    stockItemInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("inventory:manage")
    const { id, ...values } = data
    const [updated] = await db
      .update(stockItem)
      .set(values)
      .where(eq(stockItem.id, id))
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
    await requirePermission("inventory:manage")
    const [updated] = await db
      .update(stockItem)
      .set({ stock: data.stock })
      .where(eq(stockItem.id, data.id))
      .returning()
    return updated
  })

export const deleteStockItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("inventory:manage")
    await db.delete(stockItem).where(eq(stockItem.id, data.id))
    return { id: data.id }
  })
