import { ZodError } from "zod"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

// Helpers for the public REST API routes under src/routes/api/*. They support
// two auth modes:
//   1. A bearer token matching ADMIN_API_KEY (for server-to-server / external
//      API requests).
//   2. A logged-in Better Auth session (browser cookies) whose role holds the
//      required permission.

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

// Constant-time string compare so token checks don't leak length/contents via
// timing. Both inputs are short, so the cost is negligible.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Authorizes a REST API request. Throws an `ApiError` (401/403) when the caller
 * is neither a valid API-key holder nor a permitted session user.
 */
export async function requireApiAccess(
  request: Request,
  permission: Permission
): Promise<void> {
  const expected = process.env.ADMIN_API_KEY
  const header = request.headers.get("authorization")

  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim()
    if (expected && safeEqual(token, expected)) return
    throw new ApiError(401, "Invalid API key.")
  }

  // Fall back to a logged-in session (browser cookies) with the permission.
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session || session.user.status === "archived") {
    throw new ApiError(401, "Unauthorized.")
  }
  if (!can(session.user.role, permission)) {
    throw new ApiError(403, "Forbidden.")
  }
}

/** Parses a JSON request body, returning a 400 ApiError on malformed input. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new ApiError(400, "Invalid JSON body.")
  }
}

/** Maps thrown errors to a JSON `Response` with an appropriate status code. */
export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: "Invalid input.", issues: error.issues },
      { status: 400 }
    )
  }
  const message = error instanceof Error ? error.message : "Unexpected error."
  if (/not found/i.test(message)) {
    return Response.json({ error: message }, { status: 404 })
  }
  if (/cannot be deleted/i.test(message)) {
    return Response.json({ error: message }, { status: 409 })
  }
  return Response.json({ error: message }, { status: 500 })
}
