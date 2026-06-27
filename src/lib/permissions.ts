// Central role-based access model, shared by the server (enforcement) and the
// client (UI gating). Pure and dependency-free so it can be unit-tested and
// imported from anywhere.

import type { UserRole } from "@/lib/users"

export const PERMISSIONS = [
  "users:manage",
  "settings:manage",
  "players:manage",
  "reservations:manage",
  "inventory:manage",
  "coaches:manage",
  "tournaments:manage",
  // Platform-level: provisioning clubs and assigning users across clubs.
  "clubs:manage",
] as const

export type Permission = (typeof PERMISSIONS)[number]

// Club-scoped roles get everything except platform-level club provisioning.
const ALL: readonly Permission[] = PERMISSIONS.filter(
  (p) => p !== "clubs:manage"
)

/** Platform super-admin role. Operates across all clubs; not assignable to club staff. */
export const SUPER_ADMIN_ROLE = "Super Admin"

// What each role is allowed to do. Owner/Admin are full-access; the rest follow
// the role descriptions in users.ts.
const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  Owner: ALL,
  Admin: ALL,
  Manager: [
    "players:manage",
    "reservations:manage",
    "inventory:manage",
    "coaches:manage",
    "tournaments:manage",
  ],
  Coach: ["coaches:manage"],
  "Front Desk": ["players:manage", "reservations:manage", "inventory:manage"],
}

/** True when the given role is allowed to perform the action. */
export function can(
  role: string | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false
  // Super-admin can do anything, including platform-level club management.
  if (role === SUPER_ADMIN_ROLE) return true
  if (!(role in ROLE_PERMISSIONS)) return false
  return ROLE_PERMISSIONS[role as UserRole].includes(permission)
}
