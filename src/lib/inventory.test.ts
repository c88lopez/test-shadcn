import { describe, expect, it } from "vitest"
import { aggregateQuantities, findStockShortages } from "./inventory"

const levels = [
  { id: "a", name: "Water Bottle", stock: 10 },
  { id: "b", name: "Energy Drink", stock: 2 },
]

describe("findStockShortages", () => {
  it("returns no shortages when stock is sufficient", () => {
    const result = findStockShortages(
      [
        { stockItemId: "a", quantity: 5 },
        { stockItemId: "b", quantity: 2 },
      ],
      levels
    )
    expect(result).toEqual([])
  })

  it("flags a line that exceeds available stock", () => {
    const result = findStockShortages(
      [{ stockItemId: "b", quantity: 5 }],
      levels
    )
    expect(result).toEqual([
      { name: "Energy Drink", available: 2, requested: 5 },
    ])
  })

  it("aggregates quantities across multiple lines for the same product", () => {
    const result = findStockShortages(
      [
        { stockItemId: "a", quantity: 6 },
        { stockItemId: "a", quantity: 6 },
      ],
      levels
    )
    expect(result).toEqual([
      { name: "Water Bottle", available: 10, requested: 12 },
    ])
  })

  it("treats an unknown product as having zero stock", () => {
    const result = findStockShortages(
      [{ stockItemId: "missing", quantity: 1 }],
      levels
    )
    expect(result).toEqual([{ name: "missing", available: 0, requested: 1 }])
  })
})

describe("aggregateQuantities", () => {
  it("returns an empty map for no lines", () => {
    expect(aggregateQuantities([]).size).toBe(0)
  })

  it("sums quantities per stock item across duplicate lines", () => {
    const totals = aggregateQuantities([
      { stockItemId: "a", quantity: 2 },
      { stockItemId: "b", quantity: 5 },
      { stockItemId: "a", quantity: 3 },
    ])
    expect(totals.get("a")).toBe(5)
    expect(totals.get("b")).toBe(5)
    expect(totals.size).toBe(2)
  })
})
