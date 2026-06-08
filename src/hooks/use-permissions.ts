import { useRouteContext } from "@tanstack/react-router"
import { can } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

/**
 * Client-side permission check for the current user's role. Reads the user from
 * the authenticated route context (resolved server-side in `beforeLoad`), so it
 * is available synchronously with no session-fetch flash.
 */
export function useCan(permission: Permission): boolean {
  const { user } = useRouteContext({ from: "/_authenticated" })
  return can(user.role, permission)
}
