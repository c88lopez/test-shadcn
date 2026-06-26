import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  ACCENT_COLORS,
  DEFAULT_UI_SETTINGS,
  UI_ACCENT_EVENT,
  applyUiSettings,
  applyUiSettingsForClub,
  getUiSettingsInitScript,
  loadClubAccent,
  loadUiSettings,
  resolveAccent,
  saveClubAccent,
  saveUiSettings,
  setActiveUiClub,
} from "./ui-settings"

function resetDomState() {
  localStorage.clear()
  const root = document.documentElement
  root.classList.remove("dark")
  root.style.cssText = ""
}

beforeEach(() => {
  resetDomState()
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  resetDomState()
})

describe("ui-settings", () => {
  it("loads defaults when storage is empty or malformed", () => {
    expect(loadUiSettings()).toEqual(DEFAULT_UI_SETTINGS)

    localStorage.setItem("ui_settings", "{bad json")
    expect(loadUiSettings()).toEqual(DEFAULT_UI_SETTINGS)
  })

  it("saves and loads partial settings merged with defaults", () => {
    saveUiSettings({ ...DEFAULT_UI_SETTINGS, theme: "dark", fontSize: "lg" })
    expect(loadUiSettings()).toEqual({
      ...DEFAULT_UI_SETTINGS,
      theme: "dark",
      fontSize: "lg",
    })

    localStorage.setItem("ui_settings", JSON.stringify({ theme: "system" }))
    expect(loadUiSettings()).toEqual({
      ...DEFAULT_UI_SETTINGS,
      theme: "system",
    })
  })

  it("stores and reads per-club accent overrides", () => {
    expect(loadClubAccent("club-a")).toBeNull()
    expect(loadClubAccent(null)).toBeNull()

    saveClubAccent("club-a", "rose")
    expect(loadClubAccent("club-a")).toBe("rose")
  })

  it("dispatches an accent-change event when a club accent is saved", () => {
    const listener = vi.fn()
    window.addEventListener(UI_ACCENT_EVENT, listener)

    saveClubAccent("club-a", "teal")

    expect(listener).toHaveBeenCalledTimes(1)
    const event = listener.mock.calls[0][0] as CustomEvent<{
      clubId: string
      accent: string
    }>
    expect(event.detail).toEqual({ clubId: "club-a", accent: "teal" })

    window.removeEventListener(UI_ACCENT_EVENT, listener)
  })

  it("resolves club accent first and falls back to global accent", () => {
    const settings = { ...DEFAULT_UI_SETTINGS, accent: "blue" }
    expect(resolveAccent("club-a", settings)).toBe("blue")

    saveClubAccent("club-a", "violet")
    expect(resolveAccent("club-a", settings)).toBe("violet")
  })

  it("tracks active club id for pre-paint bootstrapping", () => {
    setActiveUiClub("club-a")
    expect(localStorage.getItem("ui_active_club")).toBe("club-a")

    setActiveUiClub(null)
    expect(localStorage.getItem("ui_active_club")).toBeNull()
  })

  it("applies theme, accent and font size to document root", () => {
    applyUiSettings(
      { theme: "dark", accent: "blue", fontSize: "xl" },
      "missing-accent"
    )
    const root = document.documentElement
    const fallbackAccent = ACCENT_COLORS[0]

    expect(root.classList.contains("dark")).toBe(true)
    expect(root.style.getPropertyValue("--primary")).toBe(
      fallbackAccent.primary
    )
    expect(root.style.getPropertyValue("--primary-foreground")).toBe(
      fallbackAccent.primaryForeground
    )
    expect(root.style.getPropertyValue("--chart-1")).toBe(
      fallbackAccent.chart[0]
    )
    expect(root.style.fontSize).toBe("20px")
  })

  it("uses matchMedia for system theme and applies club override in applyUiSettingsForClub", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList)

    saveUiSettings({
      ...DEFAULT_UI_SETTINGS,
      theme: "system",
      accent: "blue",
      fontSize: "sm",
    })
    saveClubAccent("club-a", "amber")

    applyUiSettingsForClub("club-a")
    const root = document.documentElement
    const accent = ACCENT_COLORS.find((a) => a.key === "amber")!

    expect(localStorage.getItem("ui_active_club")).toBe("club-a")
    expect(root.classList.contains("dark")).toBe(false)
    expect(root.style.getPropertyValue("--primary")).toBe(accent.primary)
    expect(root.style.fontSize).toBe("14px")
  })

  it("builds an init script that applies persisted settings before first paint", () => {
    saveUiSettings({
      ...DEFAULT_UI_SETTINGS,
      theme: "dark",
      accent: "blue",
      fontSize: "lg",
    })
    saveClubAccent("club-a", "rose")
    setActiveUiClub("club-a")

    const script = getUiSettingsInitScript()
    expect(script).toContain("ui_settings")
    expect(script).toContain("ui_active_club")

    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList)

    new Function(script)()

    const root = document.documentElement
    const accent = ACCENT_COLORS.find((a) => a.key === "rose")!
    expect(root.classList.contains("dark")).toBe(true)
    expect(root.style.getPropertyValue("--primary")).toBe(accent.primary)
    expect(root.style.fontSize).toBe("18px")
  })
})
