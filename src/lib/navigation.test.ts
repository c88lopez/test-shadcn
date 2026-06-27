import { describe, expect, it } from "vitest"
import {
  COMMAND_ITEMS,
  NAV_ENTRIES,
  SIDEBAR_GROUPS,
  sidebarItemsForGroup,
} from "./navigation"

describe("navigation registry", () => {
  it("has a unique route for every entry", () => {
    const routes = NAV_ENTRIES.map((e) => e.to)
    expect(new Set(routes).size).toBe(routes.length)
  })

  it("gives every sidebar entry a group and label", () => {
    for (const entry of NAV_ENTRIES) {
      if (entry.sidebarGroup) {
        expect(entry.sidebarLabelKey).toBeTruthy()
      }
    }
  })

  it("gives every command entry a group and label", () => {
    for (const item of COMMAND_ITEMS) {
      expect(item.labelKey).toBeTruthy()
      expect(item.groupKey).toBeTruthy()
    }
  })
})

describe("sidebarItemsForGroup", () => {
  it("returns the entries for a group in declaration order", () => {
    const courts = sidebarItemsForGroup("courts")
    expect(courts.map((i) => i.to)).toEqual(["/", "/reservations"])
  })

  it("only returns entries that belong to the requested group", () => {
    for (const { group } of SIDEBAR_GROUPS) {
      for (const item of sidebarItemsForGroup(group)) {
        const entry = NAV_ENTRIES.find((e) => e.to === item.to)
        expect(entry?.sidebarGroup).toBe(group)
      }
    }
  })
})

describe("COMMAND_ITEMS", () => {
  it("includes the settings sub-pages that are not in the sidebar", () => {
    const routes = COMMAND_ITEMS.map((i) => i.to)
    expect(routes).toContain("/settings/general")
    expect(routes).toContain("/settings/ui")
  })

  it("excludes entries that have no command metadata", () => {
    // Every command item must map back to a registry entry with a command label.
    for (const item of COMMAND_ITEMS) {
      const entry = NAV_ENTRIES.find((e) => e.to === item.to)
      expect(entry?.commandLabelKey).toBe(item.labelKey)
    }
  })
})
