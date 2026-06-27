import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the request/cookie + auth dependencies so we can drive the guard logic
// without a real session or database. `vi.hoisted` lets the mock factories below
// reference these spies even though `vi.mock` calls are hoisted to the top.
const mocks = vi.hoisted(() => ({
  getRequest: vi.fn(() => ({ headers: new Headers() })),
  getCookie: vi.fn<() => string | undefined>(() => undefined),
  getSession: vi.fn(),
}))

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: mocks.getRequest,
  getCookie: mocks.getCookie,
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}))

const {
  requireSession,
  requirePermission,
  requireClubId,
  resolveActiveClubId,
} = await import("@/lib/auth.server")

type SessionUserOverrides = {
  role?: string
  status?: string
  clubId?: string | null
}

function makeSession(over: SessionUserOverrides = {}) {
  return {
    user: {
      id: "user-1",
      role: "Owner",
      status: "active",
      clubId: "club-a",
      ...over,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getCookie.mockReturnValue(undefined)
})

describe("requireSession", () => {
  it("throws Unauthorized when there is no session", async () => {
    mocks.getSession.mockResolvedValue(null)
    await expect(requireSession()).rejects.toThrow("errors.unauthorized")
  })

  it("throws Unauthorized when the account is archived", async () => {
    mocks.getSession.mockResolvedValue(makeSession({ status: "archived" }))
    await expect(requireSession()).rejects.toThrow("errors.unauthorized")
  })

  it("returns the session for an active account", async () => {
    const session = makeSession()
    mocks.getSession.mockResolvedValue(session)
    await expect(requireSession()).resolves.toBe(session)
  })
})

describe("requirePermission", () => {
  it("returns the session when the role is allowed", async () => {
    mocks.getSession.mockResolvedValue(makeSession({ role: "Owner" }))
    await expect(requirePermission("settings:manage")).resolves.toBeTruthy()
  })

  it("throws Forbidden when the role lacks the permission", async () => {
    mocks.getSession.mockResolvedValue(makeSession({ role: "Front Desk" }))
    await expect(requirePermission("settings:manage")).rejects.toThrow(
      "errors.forbidden"
    )
  })

  it("allows a permitted action for a limited role", async () => {
    mocks.getSession.mockResolvedValue(makeSession({ role: "Front Desk" }))
    await expect(requirePermission("players:manage")).resolves.toBeTruthy()
  })

  it("propagates Unauthorized when unauthenticated", async () => {
    mocks.getSession.mockResolvedValue(null)
    await expect(requirePermission("players:manage")).rejects.toThrow(
      "errors.unauthorized"
    )
  })
})

describe("resolveActiveClubId", () => {
  it("returns a club-scoped user's home club when no club is selected", async () => {
    mocks.getCookie.mockReturnValue(undefined)
    await expect(
      resolveActiveClubId({ id: "user-1", clubId: "club-a" })
    ).resolves.toBe("club-a")
  })

  it("returns the home club when the selected cookie matches it", async () => {
    mocks.getCookie.mockReturnValue("club-a")
    await expect(
      resolveActiveClubId({ id: "user-1", clubId: "club-a" })
    ).resolves.toBe("club-a")
  })
})

describe("requireClubId", () => {
  it("returns the active club for a permitted club-scoped user", async () => {
    mocks.getSession.mockResolvedValue(
      makeSession({ role: "Owner", clubId: "club-a" })
    )
    mocks.getCookie.mockReturnValue(undefined)
    await expect(requireClubId("reservations:manage")).resolves.toBe("club-a")
  })

  it("throws Forbidden before resolving a club when not permitted", async () => {
    mocks.getSession.mockResolvedValue(makeSession({ role: "Coach" }))
    await expect(requireClubId("settings:manage")).rejects.toThrow(
      "errors.forbidden"
    )
  })
})
