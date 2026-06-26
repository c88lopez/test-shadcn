import { afterEach, describe, expect, it, vi } from "vitest"
import { exportRecords, toCsv } from "./export"

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

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

describe("exportRecords", () => {
  it("downloads CSV exports with a date-stamped filename", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-26T12:00:00.000Z"))

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:csv")
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {})
    const appendChild = vi.spyOn(document.body, "appendChild")
    const removeChild = vi.spyOn(document.body, "removeChild")
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})

    exportRecords([{ Name: "Ball", Qty: 2 }], "csv", "inventory")

    expect(createObjectURL).toHaveBeenCalledOnce()
    const blob = createObjectURL.mock.calls[0][0] as Blob
    await expect(blob.text()).resolves.toBe("Name,Qty\nBall,2")

    const anchor = appendChild.mock.calls[0][0] as HTMLAnchorElement
    expect(anchor.href).toBe("blob:csv")
    expect(anchor.download).toBe("inventory-2026-06-26.csv")
    expect(click).toHaveBeenCalledOnce()
    expect(removeChild).toHaveBeenCalledWith(anchor)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv")
  })

  it("downloads JSON exports with pretty-printed payload", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-26T12:00:00.000Z"))

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:json")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const appendChild = vi.spyOn(document.body, "appendChild")

    exportRecords([{ Name: "Racket", Price: 79 }], "json", "sales")

    const blob = createObjectURL.mock.calls[0][0] as Blob
    await expect(blob.text()).resolves.toBe(
      JSON.stringify([{ Name: "Racket", Price: 79 }], null, 2)
    )

    const anchor = appendChild.mock.calls[0][0] as HTMLAnchorElement
    expect(anchor.download).toBe("sales-2026-06-26.json")
  })
})
