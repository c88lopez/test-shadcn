import { asc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { account, club, clubMember, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { SUPER_ADMIN_ROLE } from "@/lib/permissions"

// Pure data-access helpers for users (no auth). Kept in a server-only module so
// the Postgres driver (`pg`) never leaks into the client bundle. Shared by the
// TanStack server functions in users.functions.ts (which add session/permission
// + per-club actor scoping) and the REST routes under src/routes/api/users
// (API-key/session via requireApiAccess). These helpers run with full,
// super-admin-equivalent access — the route layer is responsible for authz.

export interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  status: string
  // Null only for platform super-admins.
  clubId: string | null
  clubName: string | null
  // Every club the user may act within (club_member rows).
  clubIds: string[]
  createdAt: Date
}

export interface UserInput {
  name: string
  email: string
  role: string
  password: string
  clubId?: string | null
  clubIds?: string[]
}

export interface UserPatch {
  name?: string
  email?: string
  role?: string
  clubId?: string | null
  clubIds?: string[]
}

interface ClubAssignment {
  // The user's primary/home club (user.club_id). Null only for super-admins.
  primary: string | null
  // The full set of clubs the user may act within (club_member rows).
  memberships: string[]
}

// Resolves a user's club assignment without an actor (the REST layer grants
// full access). Super-admins get a null primary and no memberships; everyone
// else needs at least one valid club, preserving the current primary when it is
// still part of the selection so scoping stays stable.
async function resolveAssignment(
  role: string,
  clubIds: string[] | undefined,
  clubId: string | null | undefined,
  currentPrimary: string | null
): Promise<ClubAssignment> {
  if (role === SUPER_ADMIN_ROLE) {
    return { primary: null, memberships: [] }
  }

  const ids =
    clubIds && clubIds.length > 0
      ? [...new Set(clubIds)]
      : clubId
        ? [clubId]
        : currentPrimary
          ? [currentPrimary]
          : []
  if (ids.length === 0) {
    throw new Error("A club is required for non-super-admin users.")
  }

  const found = await db
    .select({ id: club.id })
    .from(club)
    .where(inArray(club.id, ids))
  if (found.length !== ids.length) {
    throw new Error("One or more clubs were not found.")
  }

  const primary =
    currentPrimary && ids.includes(currentPrimary) ? currentPrimary : ids[0]
  const memberships = [...new Set([primary, ...ids])]
  return { primary, memberships }
}

// Replaces a user's club memberships with the given set.
async function setMemberships(
  userId: string,
  clubIds: string[]
): Promise<void> {
  await db.delete(clubMember).where(eq(clubMember.userId, userId))
  if (clubIds.length > 0) {
    await db
      .insert(clubMember)
      .values(clubIds.map((cId) => ({ userId, clubId: cId })))
  }
}

async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context
  return ctx.password.hash(password)
}

// Attaches each user's club memberships (from club_member) to the given rows.
async function withMemberships(
  rows: Omit<UserRecord, "clubIds">[]
): Promise<UserRecord[]> {
  const ids = rows.map((r) => r.id)
  const members = ids.length
    ? await db
        .select({ userId: clubMember.userId, clubId: clubMember.clubId })
        .from(clubMember)
        .where(inArray(clubMember.userId, ids))
    : []
  const byUser = new Map<string, string[]>()
  for (const m of members) {
    const list = byUser.get(m.userId) ?? []
    list.push(m.clubId)
    byUser.set(m.userId, list)
  }
  return rows.map((r) => ({ ...r, clubIds: byUser.get(r.id) ?? [] }))
}

const baseSelect = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  clubId: user.clubId,
  clubName: club.name,
  createdAt: user.createdAt,
}

export async function listUserRecords(): Promise<UserRecord[]> {
  const rows = await db
    .select(baseSelect)
    .from(user)
    .leftJoin(club, eq(user.clubId, club.id))
    .orderBy(asc(user.createdAt))
  return withMemberships(rows)
}

export async function getUserRecord(id: string): Promise<UserRecord | null> {
  const rows = await db
    .select(baseSelect)
    .from(user)
    .leftJoin(club, eq(user.clubId, club.id))
    .where(eq(user.id, id))
    .limit(1)
  if (rows.length === 0) return null
  const [record] = await withMemberships(rows)
  return record
}

export async function createUserRecord(data: UserInput): Promise<UserRecord> {
  const { primary, memberships } = await resolveAssignment(
    data.role,
    data.clubIds,
    data.clubId,
    null
  )

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, data.email))
    .limit(1)
  if (existing.length > 0) {
    throw new Error("A user with this email already exists.")
  }

  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(user).values({
    id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: "active",
    clubId: primary,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  })
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(data.password),
    createdAt: now,
    updatedAt: now,
  })
  await setMemberships(id, memberships)

  const record = await getUserRecord(id)
  if (!record) throw new Error("User not found.")
  return record
}

export async function updateUserRecord(
  data: { id: string } & UserPatch
): Promise<UserRecord> {
  const current = await db
    .select({ role: user.role, clubId: user.clubId })
    .from(user)
    .where(eq(user.id, data.id))
    .limit(1)
  if (current.length === 0) throw new Error("User not found.")

  if (data.email !== undefined) {
    const clash = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1)
    if (clash.length > 0 && clash[0].id !== data.id) {
      throw new Error("A user with this email already exists.")
    }
  }

  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name !== undefined) set.name = data.name
  if (data.email !== undefined) set.email = data.email
  if (data.role !== undefined) set.role = data.role

  // Recompute club assignment only when role/club membership inputs are present.
  const touchesClubs =
    data.role !== undefined ||
    data.clubId !== undefined ||
    data.clubIds !== undefined
  if (touchesClubs) {
    const { primary, memberships } = await resolveAssignment(
      data.role ?? current[0].role,
      data.clubIds,
      data.clubId,
      current[0].clubId
    )
    set.clubId = primary
    await db.update(user).set(set).where(eq(user.id, data.id))
    await setMemberships(data.id, memberships)
  } else {
    await db.update(user).set(set).where(eq(user.id, data.id))
  }

  const record = await getUserRecord(data.id)
  if (!record) throw new Error("User not found.")
  return record
}

export async function deleteUserRecord(id: string): Promise<{ id: string }> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
  if (rows.length === 0) throw new Error("User not found.")
  // FK cascades remove the user's account, sessions and memberships.
  await db.delete(user).where(eq(user.id, id))
  return { id }
}
