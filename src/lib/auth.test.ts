import { beforeEach, describe, expect, it } from "vitest"
import { getUser, isAuthenticated, login, logout } from "./auth"

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("starts unauthenticated", () => {
    expect(isAuthenticated()).toBe(false)
    expect(getUser()).toBeNull()
  })

  it("logs in with valid credentials and persists the user", () => {
    expect(login("admin", "admin123")).toBe(true)
    expect(isAuthenticated()).toBe(true)
    expect(getUser()).toEqual({ username: "admin" })
  })

  it("rejects invalid credentials", () => {
    expect(login("admin", "wrong")).toBe(false)
    expect(login("nope", "admin123")).toBe(false)
    expect(isAuthenticated()).toBe(false)
  })

  it("logs out and clears the stored user", () => {
    login("admin", "admin123")
    logout()
    expect(isAuthenticated()).toBe(false)
    expect(getUser()).toBeNull()
  })
})
