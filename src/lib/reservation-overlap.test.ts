import { describe, expect, it } from "vitest"
import { findOverlap, slotsOverlap, timeToMin } from "@/lib/reservation-overlap"

describe("timeToMin", () => {
  it("converts HH:MM to minutes since midnight", () => {
    expect(timeToMin("00:00")).toBe(0)
    expect(timeToMin("09:30")).toBe(570)
    expect(timeToMin("23:59")).toBe(1439)
  })
})

describe("slotsOverlap", () => {
  const base = { startTime: "09:00", durationMinutes: 90 } // 09:00–10:30

  it("detects an overlapping start", () => {
    expect(
      slotsOverlap(base, { startTime: "09:30", durationMinutes: 60 })
    ).toBe(true)
  })

  it("detects a fully contained slot", () => {
    expect(
      slotsOverlap(base, { startTime: "09:15", durationMinutes: 30 })
    ).toBe(true)
  })

  it("treats adjacent (touching) slots as non-overlapping", () => {
    expect(
      slotsOverlap(base, { startTime: "10:30", durationMinutes: 60 })
    ).toBe(false)
  })

  it("returns false for clearly separate slots", () => {
    expect(
      slotsOverlap(base, { startTime: "11:00", durationMinutes: 60 })
    ).toBe(false)
  })
})

describe("findOverlap", () => {
  const existing = [
    { id: "a", startTime: "09:00", durationMinutes: 90 },
    { id: "b", startTime: "12:00", durationMinutes: 60 },
  ]

  it("finds the conflicting reservation", () => {
    const hit = findOverlap(
      { startTime: "09:30", durationMinutes: 60 },
      existing
    )
    expect(hit?.id).toBe("a")
  })

  it("ignores the excluded id (editing the same reservation)", () => {
    const hit = findOverlap(
      { startTime: "09:00", durationMinutes: 90 },
      existing,
      "a"
    )
    expect(hit).toBeUndefined()
  })

  it("returns undefined when nothing overlaps", () => {
    const hit = findOverlap(
      { startTime: "16:00", durationMinutes: 60 },
      existing
    )
    expect(hit).toBeUndefined()
  })
})
