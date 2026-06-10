import { createServerFn } from "@tanstack/react-start"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { sale, saleItem, stockItem } from "@/db/schema"
import {
  currentClubId,
  requirePermission,
  resolveActiveClubId,
} from "@/lib/auth.server"
import { findStockShortages } from "@/lib/inventory"
import type { SaleLineItem } from "@/lib/sales"

const saleInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        stockItemId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().positive(),
      })
    )
    .min(1),
})

export interface SaleRecord {
  id: string
  date: string
  soldBy: string
  items: SaleLineItem[]
}

export const listSales = createServerFn({ method: "GET" }).handler(
  async (): Promise<SaleRecord[]> => {
    const clubId = await currentClubId()
    const sales = await db
      .select()
      .from(sale)
      .where(eq(sale.clubId, clubId))
      .orderBy(desc(sale.date), desc(sale.createdAt))
    const saleIds = sales.map((s) => s.id)
    const lines =
      saleIds.length > 0
        ? await db
            .select()
            .from(saleItem)
            .where(inArray(saleItem.saleId, saleIds))
        : []

    const linesBySale = new Map<string, SaleLineItem[]>()
    for (const line of lines) {
      const arr = linesBySale.get(line.saleId) ?? []
      arr.push({
        item: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })
      linesBySale.set(line.saleId, arr)
    }

    return sales.map((s) => ({
      id: s.id,
      date: s.date,
      soldBy: s.soldBy,
      items: linesBySale.get(s.id) ?? [],
    }))
  }
)

export const createSale = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => saleInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission("inventory:manage")
    const clubId = await resolveActiveClubId(session.user)
    if (!clubId) throw new Error("This action requires a club context.")

    return db.transaction(async (tx) => {
      const ids = [...new Set(data.items.map((i) => i.stockItemId))]
      const levels = await tx
        .select({
          id: stockItem.id,
          name: stockItem.name,
          stock: stockItem.stock,
        })
        .from(stockItem)
        .where(and(inArray(stockItem.id, ids), eq(stockItem.clubId, clubId)))

      const shortages = findStockShortages(data.items, levels)
      if (shortages.length > 0) {
        const detail = shortages
          .map((s) => `${s.name} (need ${s.requested}, have ${s.available})`)
          .join(", ")
        throw new Error(`Not enough stock: ${detail}`)
      }

      const nameById = new Map(levels.map((l) => [l.id, l.name]))
      const [createdSale] = await tx
        .insert(sale)
        .values({ date: data.date, soldBy: session.user.name, clubId })
        .returning()

      await tx.insert(saleItem).values(
        data.items.map((i) => ({
          saleId: createdSale.id,
          stockItemId: i.stockItemId,
          name: nameById.get(i.stockItemId) ?? "",
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      )

      // Decrement stock for each distinct product sold.
      const soldQty = new Map<string, number>()
      for (const i of data.items) {
        soldQty.set(
          i.stockItemId,
          (soldQty.get(i.stockItemId) ?? 0) + i.quantity
        )
      }
      for (const [id, qty] of soldQty) {
        await tx
          .update(stockItem)
          .set({ stock: sql`${stockItem.stock} - ${qty}` })
          .where(inArray(stockItem.id, [id]))
      }

      return createdSale
    })
  })
