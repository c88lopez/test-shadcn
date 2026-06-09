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
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ALL: readonly Permission[] = PERMISSIONS

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
  ],
  Coach: ["coaches:manage"],
  "Front Desk": ["players:manage", "reservations:manage", "inventory:manage"],
}

/** True when the given role is allowed to perform the action. */
export function can(
  role: string | null | undefined,
  permission: Permission
): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) return false
  return ROLE_PERMISSIONS[role as UserRole].includes(permission)
}
