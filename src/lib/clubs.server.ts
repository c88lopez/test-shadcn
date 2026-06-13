import { asc, eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { club, user } from "@/db/schema"
import { seedDefaultCourts } from "@/lib/courts.server"
import { seedDefaultReservationSettings } from "@/lib/reservation-settings.server"

// Pure data-access helpers for clubs (no auth). Kept in a server-only module so
// the Postgres driver (`pg`) never leaks into the client bundle. Shared by the
// TanStack server functions in clubs.functions.ts (which add session/permission
// checks) and the REST routes under src/routes/api/clubs (API-key/session).

// Slug reserved for the Default Club created by migration 0004. It must always
// exist (it owns the originally-migrated data), so it cannot be deleted.
export const DEFAULT_CLUB_SLUG = "default"

export interface ClubRecord {
  id: string
  name: string
  slug: string
  status: string
  memberCount: number
  createdAt: Date
}

export interface ClubInput {
  name: string
  status: "active" | "inactive"
}

export interface ClubPatch {
  name?: string
  status?: "active" | "inactive"
}

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

export async function listClubRecords(): Promise<ClubRecord[]> {
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

export async function getClubRecord(id: string): Promise<ClubRecord | null> {
  const rows = await db
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
    .where(eq(club.id, id))
    .groupBy(club.id)
  return rows.length > 0 ? rows[0] : null
}

export async function createClubRecord(data: ClubInput): Promise<ClubRecord> {
  const slug = await uniqueSlug(data.name)
  const [created] = await db
    .insert(club)
    .values({ name: data.name, slug, status: data.status })
    .returning({ id: club.id })
  // Give every new club a default set of bookable courts and reservation rules.
  await seedDefaultCourts(created.id)
  await seedDefaultReservationSettings(created.id)
  const record = await getClubRecord(created.id)
  if (!record) throw new Error("Club not found.")
  return record
}

export async function updateClubRecord(
  data: { id: string } & ClubPatch
): Promise<ClubRecord> {
  const set: ClubPatch = {}
  if (data.name !== undefined) set.name = data.name
  if (data.status !== undefined) set.status = data.status

  // Nothing to change — just return the current record (or 404 if it's gone).
  if (Object.keys(set).length === 0) {
    const existing = await getClubRecord(data.id)
    if (!existing) throw new Error("Club not found.")
    return existing
  }

  const updated = await db
    .update(club)
    .set(set)
    .where(eq(club.id, data.id))
    .returning({ id: club.id })
  if (updated.length === 0) throw new Error("Club not found.")
  const record = await getClubRecord(updated[0].id)
  if (!record) throw new Error("Club not found.")
  return record
}

export async function deleteClubRecord(id: string): Promise<{ id: string }> {
  const rows = await db
    .select({ slug: club.slug })
    .from(club)
    .where(eq(club.id, id))
    .limit(1)
  if (rows.length === 0) throw new Error("Club not found.")
  if (rows[0].slug === DEFAULT_CLUB_SLUG) {
    throw new Error("The Default Club cannot be deleted.")
  }
  // FK cascades remove all of the club's data and member accounts.
  await db.delete(club).where(eq(club.id, id))
  return { id }
}
