import { and, asc, count, eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { coachClass, court, reservation } from "@/db/schema"
import { AppError } from "@/lib/errors"

// Pure data-access helpers for courts (no auth). Kept in a server-only module so
// the Postgres driver (`pg`) never leaks into the client bundle. Shared by the
// TanStack server functions in courts.functions.ts (which add session/permission
// checks) and by club provisioning/seeding.

export interface CourtRecord {
  id: string
  name: string
  type: "indoor" | "outdoor"
  active: boolean
  sortOrder: number
}

export interface CourtInput {
  name: string
  type: "indoor" | "outdoor"
  active: boolean
}

function toRecord(row: {
  id: string
  name: string
  type: string
  active: boolean
  sortOrder: number
}): CourtRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type === "outdoor" ? "outdoor" : "indoor",
    active: row.active,
    sortOrder: row.sortOrder,
  }
}

export async function listCourtRecords(clubId: string): Promise<CourtRecord[]> {
  const rows = await db
    .select({
      id: court.id,
      name: court.name,
      type: court.type,
      active: court.active,
      sortOrder: court.sortOrder,
    })
    .from(court)
    .where(eq(court.clubId, clubId))
    .orderBy(asc(court.sortOrder), asc(court.name))
  return rows.map(toRecord)
}

export async function createCourtRecord(
  clubId: string,
  data: CourtInput
): Promise<CourtRecord> {
  // Next court number = current max sort order + 1, so new courts append.
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${court.sortOrder}), 0)::int` })
    .from(court)
    .where(eq(court.clubId, clubId))
  const [created] = await db
    .insert(court)
    .values({
      clubId,
      name: data.name,
      type: data.type,
      active: data.active,
      sortOrder: max + 1,
    })
    .returning()
  return toRecord(created)
}

export async function updateCourtRecord(
  clubId: string,
  data: { id: string } & Partial<CourtInput>
): Promise<CourtRecord> {
  const set: Partial<CourtInput> = {}
  if (data.name !== undefined) set.name = data.name
  if (data.type !== undefined) set.type = data.type
  if (data.active !== undefined) set.active = data.active
  const updated = await db
    .update(court)
    .set(set)
    .where(and(eq(court.id, data.id), eq(court.clubId, clubId)))
    .returning()
  if (updated.length === 0) throw new Error("Court not found.")
  return toRecord(updated[0])
}

export interface CourtUsage {
  reservations: number
  classes: number
}

// How many reservations / classes still reference a court — used to block
// deleting a court that's in use.
export async function countCourtUsageRecord(
  clubId: string,
  courtId: string
): Promise<CourtUsage> {
  const [res] = await db
    .select({ value: count() })
    .from(reservation)
    .where(
      and(eq(reservation.clubId, clubId), eq(reservation.courtId, courtId))
    )
  const [cls] = await db
    .select({ value: count() })
    .from(coachClass)
    .where(and(eq(coachClass.clubId, clubId), eq(coachClass.courtId, courtId)))
  return { reservations: res.value, classes: cls.value }
}

export async function deleteCourtRecord(
  clubId: string,
  courtId: string
): Promise<{ id: string }> {
  const usage = await countCourtUsageRecord(clubId, courtId)
  if (usage.reservations > 0 || usage.classes > 0) {
    throw new Error("COURT_IN_USE")
  }
  await db
    .delete(court)
    .where(and(eq(court.id, courtId), eq(court.clubId, clubId)))
  return { id: courtId }
}

// Ensures a court exists in this club and is bookable. Throws otherwise. Used
// by reservation and class writes before persisting.
export async function assertCourtBookable(
  clubId: string,
  courtId: string
): Promise<void> {
  const rows = await db
    .select({ active: court.active })
    .from(court)
    .where(and(eq(court.id, courtId), eq(court.clubId, clubId)))
    .limit(1)
  if (rows.length === 0) {
    throw new AppError("errors.court.gone")
  }
  if (!rows[0].active) {
    throw new AppError("errors.court.inactive")
  }
}

// Creates a default set of numbered courts for a club. Used when provisioning a
// new club and when seeding. Idempotent-ish: skips if the club already has any.
export async function seedDefaultCourts(
  clubId: string,
  countOf = 6
): Promise<void> {
  const existing = await db
    .select({ id: court.id })
    .from(court)
    .where(eq(court.clubId, clubId))
    .limit(1)
  if (existing.length > 0) return
  await db.insert(court).values(
    Array.from({ length: countOf }, (_, i) => ({
      clubId,
      name: `Court ${i + 1}`,
      type: "indoor",
      active: true,
      sortOrder: i + 1,
    }))
  )
}
