import { describe, expect, it } from "vitest"
import { saleTotal } from "./sales"

describe("saleTotal", () => {
  it("returns 0 for a sale with no items", () => {
    expect(saleTotal({ items: [] })).toBe(0)
  })

  it("multiplies quantity by unit price for a single line item", () => {
    expect(
      saleTotal({ items: [{ item: "Ball", quantity: 3, unitPrice: 2.5 }] })
    ).toBe(7.5)
  })

  it("sums multiple line items", () => {
    const total = saleTotal({
      items: [
        { item: "Water", quantity: 6, unitPrice: 1.5 },
        { item: "Energy Drink", quantity: 3, unitPrice: 2.5 },
      ],
    })
    expect(total).toBeCloseTo(16.5)
  })
})
