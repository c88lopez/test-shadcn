import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  can: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}))

vi.mock("@/lib/permissions", () => ({
  can: mocks.can,
}))

const { ApiError, apiErrorResponse, readJsonBody, requireApiAccess } =
  await import("./api-auth")

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.ADMIN_API_KEY
})

describe("requireApiAccess", () => {
  it("accepts a matching bearer token", async () => {
    process.env.ADMIN_API_KEY = "secret-token"
    const request = new Request("http://localhost/api", {
      headers: { authorization: "Bearer secret-token" },
    })

    await expect(
      requireApiAccess(request, "players:manage")
    ).resolves.toBeUndefined()
    expect(mocks.getSession).not.toHaveBeenCalled()
  })

  it("rejects an invalid bearer token", async () => {
    process.env.ADMIN_API_KEY = "secret-token"
    const request = new Request("http://localhost/api", {
      headers: { authorization: "Bearer nope" },
    })

    await expect(
      requireApiAccess(request, "players:manage")
    ).rejects.toMatchObject({ status: 401, message: "Invalid API key." })
  })

  it("rejects bearer auth when API key auth is disabled", async () => {
    const request = new Request("http://localhost/api", {
      headers: { authorization: "Bearer whatever" },
    })

    await expect(
      requireApiAccess(request, "players:manage")
    ).rejects.toMatchObject({ status: 401, message: "Invalid API key." })
  })

  it("falls back to session auth and rejects missing/archived sessions", async () => {
    const request = new Request("http://localhost/api")

    mocks.getSession.mockResolvedValueOnce(null)
    await expect(
      requireApiAccess(request, "players:manage")
    ).rejects.toMatchObject({ status: 401, message: "Unauthorized." })

    mocks.getSession.mockResolvedValueOnce({
      user: { status: "archived", role: "Owner" },
    })
    await expect(
      requireApiAccess(request, "players:manage")
    ).rejects.toMatchObject({ status: 401, message: "Unauthorized." })
  })

  it("enforces role permissions for session-based callers", async () => {
    const request = new Request("http://localhost/api")
    mocks.getSession.mockResolvedValue({
      user: { status: "active", role: "Front Desk" },
    })

    mocks.can.mockReturnValueOnce(false)
    await expect(
      requireApiAccess(request, "settings:manage")
    ).rejects.toMatchObject({ status: 403, message: "Forbidden." })

    mocks.can.mockReturnValueOnce(true)
    await expect(
      requireApiAccess(request, "players:manage")
    ).resolves.toBeUndefined()
  })
})

describe("readJsonBody", () => {
  it("parses valid JSON payloads", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: { "content-type": "application/json" },
    })
    await expect(readJsonBody(request)).resolves.toEqual({ ok: true })
  })

  it("maps malformed JSON to a 400 ApiError", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: "{not-json",
      headers: { "content-type": "application/json" },
    })
    await expect(readJsonBody(request)).rejects.toMatchObject({
      status: 400,
      message: "Invalid JSON body.",
    })
  })
})

describe("apiErrorResponse", () => {
  it("formats ApiError responses", async () => {
    const response = apiErrorResponse(new ApiError(418, "teapot"))
    expect(response.status).toBe(418)
    await expect(response.json()).resolves.toEqual({ error: "teapot" })
  })

  it("formats zod validation errors as 400", async () => {
    const parsed = z.object({ name: z.string() }).safeParse({ name: 123 })
    expect(parsed.success).toBe(false)
    const response = apiErrorResponse(parsed.error)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid input.",
    })
  })

  it("maps known domain message patterns to status codes", async () => {
    const notFound = apiErrorResponse(new Error("Club not found"))
    expect(notFound.status).toBe(404)
    await expect(notFound.json()).resolves.toEqual({ error: "Club not found" })

    const conflict = apiErrorResponse(
      new Error("Reservation cannot be deleted")
    )
    expect(conflict.status).toBe(409)
    await expect(conflict.json()).resolves.toEqual({
      error: "Reservation cannot be deleted",
    })
  })

  it("falls back to 500 for unknown errors", async () => {
    const response = apiErrorResponse({ unexpected: true })
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: "Unexpected error.",
    })
  })
})
