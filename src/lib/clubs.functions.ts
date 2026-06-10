import { createServerFn } from "@tanstack/react-start"
import { setCookie } from "@tanstack/react-start/server"
import { asc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { club, user } from "@/db/schema"
import {
  ACTIVE_CLUB_COOKIE,
  requirePermission,
  requireSession,
  resolveActiveClubId,
} from "@/lib/auth.server"
import { can } from "@/lib/permissions"

// Slug reserved for the Default Club created by migration 0004. It must always
// exist (it owns the originally-migrated data), so it cannot be deleted.
const DEFAULT_CLUB_SLUG = "default"

const clubInput = z.object({
  name: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Returns a unique slug derived from `name`, appending -2, -3, … on collision.
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "club"
  const existing = await db
    .select({ slug: club.slug })
    .from(club)
    .where(sql`${club.slug} = ${base} OR ${club.slug} LIKE ${base + "-%"}`)
  const taken = new Set(existing.map((r) => r.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export interface ClubRecord {
  id: string
  name: string
  slug: string
  status: string
  memberCount: number
  createdAt: Date
}

export const listClubs = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClubRecord[]> => {
    await requirePermission("clubs:manage")
    return db
      .select({
        id: club.id,
        name: club.name,
        slug: club.slug,
        status: club.status,
        memberCount: sql<number>`count(${user.id})::int`,
        createdAt: club.createdAt,
      })
      .from(club)
      .leftJoin(user, eq(user.clubId, club.id))
      .groupBy(club.id)
      .orderBy(asc(club.name))
  }
)

// Clubs available for assignment in the user drawer. Any user manager can read
// the list (so a super-admin can move users between clubs); the actual
// authorization to assign happens server-side in users.functions.
export const listClubOptions = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireSession()
    return db
      .select({ id: club.id, name: club.name })
      .from(club)
      .where(eq(club.status, "active"))
      .orderBy(asc(club.name))
  }
)

export const createClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => clubInput.parse(data))
  .handler(async ({ data }) => {
    await requirePermission("clubs:manage")
    const slug = await uniqueSlug(data.name)
    const [created] = await db
      .insert(club)
      .values({ name: data.name, slug, status: data.status })
      .returning()
    return created
  })

export const updateClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    clubInput.extend({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("clubs:manage")
    const [updated] = await db
      .update(club)
      .set({ name: data.name, status: data.status })
      .where(eq(club.id, data.id))
      .returning()
    return updated
  })

// Club context for the current user, used by the header club switcher. Only
// super-admins receive the full club list and may switch.
export const getClubContext = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireSession()
    const isSuper = can(session.user.role, "clubs:manage")
    const activeClubId = await resolveActiveClubId(session.user)
    const clubs = isSuper
      ? await db
          .select({ id: club.id, name: club.name })
          .from(club)
          .orderBy(asc(club.name))
      : []
    let activeClubName: string | null = null
    if (activeClubId) {
      const rows = await db
        .select({ name: club.name })
        .from(club)
        .where(eq(club.id, activeClubId))
        .limit(1)
      activeClubName = rows[0]?.name ?? null
    }
    return { activeClubId, activeClubName, isSuper, clubs }
  }
)

// Super-admin selects which club to act as. Persists in an http-only cookie.
export const setActiveClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ clubId: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("clubs:manage")
    const exists = await db
      .select({ id: club.id })
      .from(club)
      .where(eq(club.id, data.clubId))
      .limit(1)
    if (exists.length === 0) throw new Error("Club not found.")
    setCookie(ACTIVE_CLUB_COOKIE, data.clubId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })
    return { clubId: data.clubId }
  })

export const deleteClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    await requirePermission("clubs:manage")
    const rows = await db
      .select({ slug: club.slug })
      .from(club)
      .where(eq(club.id, data.id))
      .limit(1)
    if (rows.length === 0) throw new Error("Club not found.")
    if (rows[0].slug === DEFAULT_CLUB_SLUG) {
      throw new Error("The Default Club cannot be deleted.")
    }
    // FK cascades remove all of the club's data and member accounts.
    await db.delete(club).where(eq(club.id, data.id))
    return { id: data.id }
  })
