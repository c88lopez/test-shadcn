import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createAuthClient: vi.fn(() => ({
    signIn: { email: vi.fn() },
    signOut: vi.fn(),
    useSession: vi.fn(),
  })),
  inferAdditionalFields: vi.fn((config: unknown) => ({
    name: "inferAdditionalFieldsPlugin",
    config,
  })),
}))

vi.mock("better-auth/react", () => ({
  createAuthClient: mocks.createAuthClient,
}))

vi.mock("better-auth/client/plugins", () => ({
  inferAdditionalFields: mocks.inferAdditionalFields,
}))

const mod = await import("./auth-client")

describe("auth-client", () => {
  it("creates the auth client with additional user fields plugin", () => {
    expect(mocks.inferAdditionalFields).toHaveBeenCalledWith({
      user: {
        role: { type: "string" },
        status: { type: "string" },
      },
    })
    expect(mocks.createAuthClient).toHaveBeenCalledOnce()
    expect(mod.authClient).toBeTruthy()
  })

  it("re-exports signIn/signOut/useSession from the client", () => {
    expect(mod.signIn).toBe(mod.authClient.signIn)
    expect(mod.signOut).toBe(mod.authClient.signOut)
    expect(mod.useSession).toBe(mod.authClient.useSession)
  })
})
