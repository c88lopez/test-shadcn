import { describe, expect, it } from "vitest"
import { can } from "./permissions"

describe("can", () => {
  it("grants Owner and Admin full access", () => {
    for (const role of ["Owner", "Admin"]) {
      expect(can(role, "users:manage")).toBe(true)
      expect(can(role, "settings:manage")).toBe(true)
      expect(can(role, "players:manage")).toBe(true)
      expect(can(role, "reservations:manage")).toBe(true)
    }
  })

  it("lets Manager manage club data but not users or settings", () => {
    expect(can("Manager", "players:manage")).toBe(true)
    expect(can("Manager", "reservations:manage")).toBe(true)
    expect(can("Manager", "coaches:manage")).toBe(true)
    expect(can("Manager", "users:manage")).toBe(false)
    expect(can("Manager", "settings:manage")).toBe(false)
  })

  it("limits Front Desk to bookings, players and inventory", () => {
    expect(can("Front Desk", "players:manage")).toBe(true)
    expect(can("Front Desk", "reservations:manage")).toBe(true)
    expect(can("Front Desk", "inventory:manage")).toBe(true)
    expect(can("Front Desk", "coaches:manage")).toBe(false)
    expect(can("Front Desk", "users:manage")).toBe(false)
  })

  it("limits Coach to managing classes", () => {
    expect(can("Coach", "coaches:manage")).toBe(true)
    expect(can("Coach", "reservations:manage")).toBe(false)
    expect(can("Coach", "users:manage")).toBe(false)
  })

  it("denies unknown or missing roles", () => {
    expect(can(undefined, "players:manage")).toBe(false)
    expect(can(null, "players:manage")).toBe(false)
    expect(can("", "players:manage")).toBe(false)
    expect(can("Intern", "players:manage")).toBe(false)
  })
})
