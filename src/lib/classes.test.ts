import { describe, expect, it } from "vitest"
import { classStatus, endTime } from "./classes"

describe("classStatus", () => {
  const date = "2026-06-15"
  const start = "10:00"
  const duration = 90 // ends 11:30

  it("is Upcoming before the start time", () => {
    expect(
      classStatus(date, start, duration, new Date("2026-06-15T09:59:00"))
    ).toBe("Upcoming")
  })

  it("is Ongoing at the start time", () => {
    expect(
      classStatus(date, start, duration, new Date("2026-06-15T10:00:00"))
    ).toBe("Ongoing")
  })

  it("is Ongoing during the session", () => {
    expect(
      classStatus(date, start, duration, new Date("2026-06-15T11:00:00"))
    ).toBe("Ongoing")
  })

  it("is Completed once the session has ended", () => {
    expect(
      classStatus(date, start, duration, new Date("2026-06-15T11:30:00"))
    ).toBe("Completed")
  })

  it("is Upcoming on an earlier day and Completed on a later day", () => {
    expect(
      classStatus(date, start, duration, new Date("2026-06-14T23:59:00"))
    ).toBe("Upcoming")
    expect(
      classStatus(date, start, duration, new Date("2026-06-16T00:01:00"))
    ).toBe("Completed")
  })
})

describe("endTime", () => {
  it("adds the duration to the start time", () => {
    expect(endTime("10:00", 90)).toBe("11:30")
    expect(endTime("09:30", 60)).toBe("10:30")
  })
})
