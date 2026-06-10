import { createServerFn } from "@tanstack/react-start"
import { asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { account, club, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { requirePermission } from "@/lib/auth.server"
import { can, SUPER_ADMIN_ROLE } from "@/lib/permissions"
import { USER_ROLES } from "@/lib/users"

// Super Admin is assignable only by other super-admins; the schema accepts it
// and the handlers enforce who may use it.
const roleSchema = z.enum([...USER_ROLES, SUPER_ADMIN_ROLE])

const createInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  password: z.string().min(6),
  clubId: z.string().min(1).nullish(),
})

const updateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  clubId: z.string().min(1).nullish(),
})

interface Actor {
  role?: string | null
  clubId?: string | null
}

// Resolves the club_id a managed user should get, enforcing that only
// super-admins may assign the Super Admin role or place users in other clubs.
function resolveClubAssignment(
  actor: Actor,
  role: string,
  requestedClubId: string | null | undefined
): string | null {
  const isSuper = can(actor.role, "clubs:manage")
  if (role === SUPER_ADMIN_ROLE) {
    if (!isSuper) throw new Error("You cannot assign the Super Admin role.")
    return null
  }
  if (isSuper) {
    const clubId = requestedClubId ?? actor.clubId ?? null
    if (!clubId) throw new Error("Select a club for this user.")
    return clubId
  }
  // Club managers can only place users in their own club.
  if (!actor.clubId) throw new Error("This action requires a club context.")
  return actor.clubId
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
    throw new Error("User not found.")
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
  return scoped.orderBy(asc(user.createdAt))
})

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission("users:manage")
    const clubId = resolveClubAssignment(session.user, data.role, data.clubId)

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
      clubId,
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
    return { id }
  })

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission("users:manage")
    await assertManageable(session.user, data.id)
    const clubId = resolveClubAssignment(session.user, data.role, data.clubId)

    const clash = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1)
    if (clash.length > 0 && clash[0].id !== data.id) {
      throw new Error("A user with this email already exists.")
    }

    await db
      .update(user)
      .set({
        name: data.name,
        email: data.email,
        role: data.role,
        clubId,
        updatedAt: new Date(),
      })
      .where(eq(user.id, data.id))
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
      throw new Error("This user has no password login to reset.")
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
      throw new Error("You cannot archive your own account.")
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
      throw new Error("You cannot delete your own account.")
    }
    await db.delete(user).where(eq(user.id, data.id))
    return { id: data.id }
  })
