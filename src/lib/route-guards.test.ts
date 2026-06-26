import { describe, expect, it } from "vitest"
import { ensurePermission } from "./route-guards"

describe("ensurePermission", () => {
  it("does not throw when role has permission", () => {
    expect(() => ensurePermission("Owner", "settings:manage")).not.toThrow()
  })

  it("redirects to UI settings when permission is missing", () => {
    expect(() => ensurePermission("Front Desk", "settings:manage")).toThrow()
  })
})
