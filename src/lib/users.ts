/** Shared user role definitions used by the user drawer and app settings. */

export const USER_ROLES = [
  "Owner",
  "Admin",
  "Manager",
  "Coach",
  "Front Desk",
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Owner: "Full access, including billing and ownership transfer.",
  Admin: "Manage all club data, users and settings.",
  Manager: "Manage reservations, players and coaches.",
  Coach: "View schedules and manage their own classes.",
  "Front Desk": "Handle bookings and point-of-sale.",
}
