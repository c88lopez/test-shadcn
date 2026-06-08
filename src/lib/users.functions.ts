import { createServerFn } from "@tanstack/react-start"
import { asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { account, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { requireSession } from "@/lib/auth.server"
import { USER_ROLES } from "@/lib/users"

const roleSchema = z.enum(USER_ROLES)

const createInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  password: z.string().min(6),
})

const updateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
})

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
  await requireSession()
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.createdAt))
  return rows
})

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data }) => {
    await requireSession()

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
    await requireSession()

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
    await requireSession()
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
    const session = await requireSession()
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
    const session = await requireSession()
    if (data.id === session.user.id) {
      throw new Error("You cannot delete your own account.")
    }
    await db.delete(user).where(eq(user.id, data.id))
    return { id: data.id }
  })
