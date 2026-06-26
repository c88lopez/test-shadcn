import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

async function loadModule() {
  vi.resetModules()
  return import("./app-settings")
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe("app-settings store", () => {
  it("loads settings for the active club and persists updates per club", async () => {
    localStorage.setItem(
      "app_settings:club-a",
      JSON.stringify({ general: { phone: "555-1111" } })
    )

    const mod = await loadModule()
    mod.setActiveSettingsClub("club-a")
    expect(mod.getAppSettings().general.phone).toBe("555-1111")

    mod.setAppSettings({
      ...mod.getAppSettings(),
      general: { ...mod.getAppSettings().general, phone: "555-2222" },
    })

    const stored = JSON.parse(localStorage.getItem("app_settings:club-a")!)
    expect(stored.general.phone).toBe("555-2222")
  })

  it("switches store values when changing clubs", async () => {
    localStorage.setItem(
      "app_settings:club-a",
      JSON.stringify({ general: { phone: "111" } })
    )
    localStorage.setItem(
      "app_settings:club-b",
      JSON.stringify({ general: { phone: "222" } })
    )

    const mod = await loadModule()
    mod.setActiveSettingsClub("club-a")
    expect(mod.getAppSettings().general.phone).toBe("111")

    mod.setActiveSettingsClub("club-b")
    expect(mod.getAppSettings().general.phone).toBe("222")
  })

  it("resets to defaults and keeps persistence best-effort", async () => {
    const mod = await loadModule()
    mod.setActiveSettingsClub("club-a")

    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota")
      })

    expect(() => mod.resetAppSettings()).not.toThrow()
    expect(setItemSpy).toHaveBeenCalled()
  })

  it("exposes hydration state via useAppSettingsHydrated", async () => {
    const mod = await loadModule()
    const { result } = renderHook(() => mod.useAppSettingsHydrated())

    expect(result.current).toBe(false)
    act(() => mod.setActiveSettingsClub("club-a"))
    expect(result.current).toBe(true)
  })
})
