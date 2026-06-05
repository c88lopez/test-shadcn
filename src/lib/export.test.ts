import { describe, expect, it } from "vitest"
import { toCsv } from "./export"

describe("toCsv", () => {
  it("returns an empty string for no records", () => {
    expect(toCsv([])).toBe("")
  })

  it("uses the keys of the first record as the header row", () => {
    const csv = toCsv([{ Name: "Ball", Price: 2.5 }])
    expect(csv).toBe("Name,Price\nBall,2.5")
  })

  it("serializes multiple rows", () => {
    const csv = toCsv([
      { Name: "Ball", Qty: 3 },
      { Name: "Towel", Qty: 1 },
    ])
    expect(csv).toBe("Name,Qty\nBall,3\nTowel,1")
  })

  it("quotes and escapes values containing commas, quotes or newlines", () => {
    const csv = toCsv([
      { Note: "a,b", Quote: 'he said "hi"', Multi: "line1\nline2" },
    ])
    expect(csv).toBe('Note,Quote,Multi\n"a,b","he said ""hi""","line1\nline2"')
  })

  it("renders null and undefined as empty cells", () => {
    const csv = toCsv([{ A: null, B: undefined, C: 0 }])
    expect(csv).toBe("A,B,C\n,,0")
  })
})
