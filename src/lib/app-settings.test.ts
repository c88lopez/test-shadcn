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
  it("returns defaults when nothing is stored", () => {
    expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS)
  })

  it("deep-merges a partial stored value over the defaults", () => {
    localStorage.setItem(
      "app_settings",
      JSON.stringify({ general: { clubName: "Smash Club" } })
    )
    const settings = loadAppSettings()
    expect(settings.general.clubName).toBe("Smash Club")
    // Untouched fields keep their defaults.
    expect(settings.general.timeFormat).toBe("24h")
    expect(settings.reservations.courts).toHaveLength(6)
    expect(settings.security.defaultRole).toBe("Front Desk")
  })

  it("replaces array-valued settings instead of merging them", () => {
    localStorage.setItem(
      "app_settings",
      JSON.stringify({ notifications: { reminderOffsets: [2] } })
    )
    expect(loadAppSettings().notifications.reminderOffsets).toEqual([2])
  })

  it("falls back to defaults on malformed JSON", () => {
    localStorage.setItem("app_settings", "{not json")
    expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS)
  })
})
