export interface StockLevel {
  id: string
  name: string
  stock: number
}

export interface SaleLine {
  stockItemId: string
  quantity: number
}

export interface StockShortage {
  name: string
  available: number
  requested: number
}

/**
 * Given the line items of a sale and the current stock levels, returns the
 * items that don't have enough stock to fulfil the sale. Quantities for the
 * same product across multiple lines are aggregated. An empty array means the
 * sale can be fulfilled.
 */
export function findStockShortages(
  lines: SaleLine[],
  levels: StockLevel[]
): StockShortage[] {
  const requested = new Map<string, number>()
  for (const line of lines) {
    requested.set(
      line.stockItemId,
      (requested.get(line.stockItemId) ?? 0) + line.quantity
    )
  }

  const byId = new Map(levels.map((level) => [level.id, level]))
  const shortages: StockShortage[] = []
  for (const [id, quantity] of requested) {
    const level = byId.get(id)
    const available = level?.stock ?? 0
    if (quantity > available) {
      shortages.push({
        name: level?.name ?? id,
        available,
        requested: quantity,
      })
    }
  }
  return shortages
}
