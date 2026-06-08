import { redirect } from "@tanstack/react-router"
import { can } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

// Route-level RBAC guard for use in `beforeLoad`. Redirects users who lack the
// required permission to the always-accessible UI settings tab. Server
// functions enforce the same rules, so this is purely for UX/navigation.
export function ensurePermission(
  role: string | null | undefined,
  permission: Permission
): void {
  if (!can(role, permission)) {
    throw redirect({ to: "/settings/ui" })
  }
}
