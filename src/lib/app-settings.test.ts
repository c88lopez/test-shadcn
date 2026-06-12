import { afterEach, describe, expect, it } from "vitest"
import {
  clampNumber,
  DEFAULT_APP_SETTINGS,
  formatCurrency,
  formatHour,
  formatTimeRange,
  formatTimeString,
  getCurrencySymbol,
  loadAppSettings,
} from "./app-settings"

afterEach(() => {
  localStorage.clear()
})

describe("formatCurrency", () => {
  it("formats amounts with a $ symbol and two decimals", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50")
    expect(formatCurrency(0)).toBe("$0.00")
  })
})

describe("getCurrencySymbol", () => {
  it("returns the dollar sign", () => {
    expect(getCurrencySymbol()).toBe("$")
  })
})

describe("formatTimeString", () => {
  it("keeps 24h format unchanged", () => {
    expect(formatTimeString("09:30", "24h")).toBe("09:30")
  })

  it("converts to 12h with AM/PM", () => {
    expect(formatTimeString("09:30", "12h")).toBe("9:30 AM")
    expect(formatTimeString("13:05", "12h")).toBe("1:05 PM")
    expect(formatTimeString("00:00", "12h")).toBe("12:00 AM")
    expect(formatTimeString("12:00", "12h")).toBe("12:00 PM")
  })

  it("returns the input untouched when it is not a valid time", () => {
    expect(formatTimeString("n/a", "12h")).toBe("n/a")
  })
})

describe("formatTimeRange", () => {
  it("formats both ends of a range", () => {
    expect(formatTimeRange("09:00 – 10:30", "12h")).toBe("9:00 AM – 10:30 AM")
  })

  it("returns the input when the separator is missing", () => {
    expect(formatTimeRange("09:00", "12h")).toBe("09:00")
  })
})

describe("formatHour", () => {
  it("pads 24h hours", () => {
    expect(formatHour(9, "24h")).toBe("09:00")
  })

  it("uses AM/PM for 12h", () => {
    expect(formatHour(13, "12h")).toBe("1 PM")
    expect(formatHour(0, "12h")).toBe("12 AM")
  })
})

describe("clampNumber", () => {
  it("parses valid numbers", () => {
    expect(clampNumber("5", 0)).toBe(5)
  })

  it("clamps below the minimum", () => {
    expect(clampNumber("-3", 0)).toBe(0)
  })

  it("clamps above the maximum", () => {
    expect(clampNumber("100", 0, 50)).toBe(50)
  })

  it("falls back to the minimum for non-numeric input", () => {
    expect(clampNumber("abc", 6)).toBe(6)
  })
})

describe("loadAppSettings", () => {
  it("returns defaults when no club is active", () => {
    expect(loadAppSettings(null)).toEqual(DEFAULT_APP_SETTINGS)
  })

  it("returns defaults when nothing is stored for the club", () => {
    expect(loadAppSettings("club1")).toEqual(DEFAULT_APP_SETTINGS)
  })

  it("reads from the club-scoped key", () => {
    localStorage.setItem(
      "app_settings:club1",
      JSON.stringify({ general: { phone: "555-0001" } })
    )
    expect(loadAppSettings("club1").general.phone).toBe("555-0001")
    // A different club doesn't see club1's settings.
    expect(loadAppSettings("club2").general.phone).toBe(
      DEFAULT_APP_SETTINGS.general.phone
    )
  })

  it("deep-merges a partial stored value over the defaults", () => {
    localStorage.setItem(
      "app_settings:club1",
      JSON.stringify({ general: { phone: "555-0001" } })
    )
    const settings = loadAppSettings("club1")
    expect(settings.general.phone).toBe("555-0001")
    // Untouched fields keep their defaults.
    expect(settings.general.timeFormat).toBe("24h")
    expect(settings.reservations.slotDuration).toBe(60)
    expect(settings.security.defaultRole).toBe("Front Desk")
  })

  it("replaces array-valued settings instead of merging them", () => {
    localStorage.setItem(
      "app_settings:club1",
      JSON.stringify({ notifications: { reminderOffsets: [2] } })
    )
    expect(loadAppSettings("club1").notifications.reminderOffsets).toEqual([2])
  })

  it("falls back to the legacy un-scoped key when no club blob exists", () => {
    localStorage.setItem(
      "app_settings",
      JSON.stringify({ general: { phone: "555-LEGACY" } })
    )
    expect(loadAppSettings("club1").general.phone).toBe("555-LEGACY")
  })

  it("falls back to defaults on malformed JSON", () => {
    localStorage.setItem("app_settings:club1", "{not json")
    expect(loadAppSettings("club1")).toEqual(DEFAULT_APP_SETTINGS)
  })
})
