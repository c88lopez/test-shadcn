import { getRequest } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

// Server-only auth helpers. Lives in a `.server.ts` module so the server-only
// imports never reach a client bundle — only call these from inside server
// function handlers.

/**
 * Guards a server function: throws if there is no authenticated session, or if
 * the account has since been archived.
 */
export async function requireSession() {
  const { headers } = getRequest()
  const session = await auth.api.getSession({ headers })
  if (!session || session.user.status === "archived") {
    throw new Error("Unauthorized")
  }
  return session
}

/**
 * Guards a server function: requires an authenticated session whose role is
 * allowed to perform the given action. Throws otherwise.
 */
export async function requirePermission(permission: Permission) {
  const session = await requireSession()
  if (!can(session.user.role, permission)) {
    throw new Error("Forbidden")
  }
  return session
}
