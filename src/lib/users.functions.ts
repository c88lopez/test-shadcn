import { createServerFn } from "@tanstack/react-start"
import { asc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { account, club, clubMember, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { requirePermission } from "@/lib/auth.server"
import { can, SUPER_ADMIN_ROLE } from "@/lib/permissions"
import { USER_ROLES } from "@/lib/users"
import { AppError } from "@/lib/errors"

// Super Admin is assignable only by other super-admins; the schema accepts it
// and the handlers enforce who may use it.
const roleSchema = z.enum([...USER_ROLES, SUPER_ADMIN_ROLE])

const createInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  password: z.string().min(6),
  clubId: z.string().min(1).nullish(),
  clubIds: z.array(z.string().min(1)).optional(),
})

const updateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  clubId: z.string().min(1).nullish(),
  clubIds: z.array(z.string().min(1)).optional(),
})

interface Actor {
  role?: string | null
  clubId?: string | null
}

interface ClubAssignment {
  // The user's primary/home club (user.club_id). Null only for super-admins.
  primary: string | null
  // The full set of clubs the user may act within (club_member rows).
  memberships: string[]
}

// Resolves a user's club assignment (primary club + the set of clubs they can
// switch between). Only super-admins may assign the Super Admin role; managers
// (Owner/Admin) may assign any active club so they can run multiple clubs. The
// existing primary club is preserved when still selected to keep scoping stable.
async function resolveAssignment(
  actor: Actor,
  role: string,
  clubIds: string[] | undefined,
  clubId: string | null | undefined,
  currentPrimary: string | null
): Promise<ClubAssignment> {
  const isSuper = can(actor.role, "clubs:manage")
  if (role === SUPER_ADMIN_ROLE) {
    if (!isSuper) throw new AppError("errors.user.cannotAssignSuperAdmin")
    return { primary: null, memberships: [] }
  }

  let ids =
    clubIds && clubIds.length > 0
      ? [...new Set(clubIds)]
      : clubId
        ? [clubId]
        : []
  if (ids.length === 0) {
    if (!actor.clubId) throw new AppError("errors.user.selectClub")
    ids = [actor.clubId]
  }

  const found = await db
    .select({ id: club.id })
    .from(club)
    .where(inArray(club.id, ids))
  if (found.length !== ids.length) {
    throw new AppError("errors.user.invalidClub")
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

// Ensures a club manager only mutates users inside their own club. Super-admins
// are unrestricted.
async function assertManageable(actor: Actor, targetId: string): Promise<void> {
  if (can(actor.role, "clubs:manage")) return
  const rows = await db
    .select({ clubId: user.clubId })
    .from(user)
    .where(eq(user.id, targetId))
    .limit(1)
  if (rows.length === 0 || rows[0].clubId !== actor.clubId) {
    throw new AppError("errors.user.notFound")
  }
}

// Generates a temporary password that satisfies common policy requirements.
function generateTempPassword(): string {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 8)
  return `Aa1!${rand}`
}

async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context
  return ctx.password.hash(password)
}

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requirePermission("users:manage")
  const isSuper = can(session.user.role, "clubs:manage")
  const base = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      clubId: user.clubId,
      clubName: club.name,
      createdAt: user.createdAt,
    })
    .from(user)
    .leftJoin(club, eq(user.clubId, club.id))
  // Super-admins manage everyone; club managers only see their own club.
  const scoped = isSuper
    ? base
    : base.where(eq(user.clubId, session.user.clubId ?? ""))
  const rows = await scoped.orderBy(asc(user.createdAt))

  // Attach each user's club memberships for the assignment UI.
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
})

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission("users:manage")
    const { primary, memberships } = await resolveAssignment(
      session.user,
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
      throw new AppError("errors.user.emailExists")
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
    return { id }
  })

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission("users:manage")
    await assertManageable(session.user, data.id)

    const currentRows = await db
      .select({ clubId: user.clubId })
      .from(user)
      .where(eq(user.id, data.id))
      .limit(1)
    const currentPrimary = currentRows[0]?.clubId ?? null

    const { primary, memberships } = await resolveAssignment(
      session.user,
      data.role,
      data.clubIds,
      data.clubId,
      currentPrimary
    )

    const clash = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1)
    if (clash.length > 0 && clash[0].id !== data.id) {
      throw new AppError("errors.user.emailExists")
    }

    await db
      .update(user)
      .set({
        name: data.name,
        email: data.email,
        role: data.role,
        clubId: primary,
        updatedAt: new Date(),
      })
      .where(eq(user.id, data.id))
    await setMemberships(data.id, memberships)
    return { id: data.id }
  })

export const resetUserPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const session = await requirePermission("users:manage")
    await assertManageable(session.user, data.id)
    const tempPassword = generateTempPassword()
    const hashed = await hashPassword(tempPassword)
    const updated = await db
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(account.userId, data.id))
      .returning({ id: account.id })
    if (updated.length === 0) {
      throw new AppError("errors.user.noPasswordReset")
    }
    return { tempPassword }
  })

export const setUserArchived = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1), archived: z.boolean() }).parse(data)
  )
  .handler(async ({ data }) => {
    const session = await requirePermission("users:manage")
    await assertManageable(session.user, data.id)
    if (data.archived && data.id === session.user.id) {
      throw new AppError("errors.user.cannotArchiveSelf")
    }
    await db
      .update(user)
      .set({
        status: data.archived ? "archived" : "active",
        updatedAt: new Date(),
      })
      .where(eq(user.id, data.id))
    return { id: data.id }
  })

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const session = await requirePermission("users:manage")
    await assertManageable(session.user, data.id)
    if (data.id === session.user.id) {
      throw new AppError("errors.user.cannotDeleteSelf")
    }
    await db.delete(user).where(eq(user.id, data.id))
    return { id: data.id }
  })
