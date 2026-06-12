import { createServerFn } from "@tanstack/react-start"
import { setCookie } from "@tanstack/react-start/server"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { club, clubMember } from "@/db/schema"
import {
  ACTIVE_CLUB_COOKIE,
  requirePermission,
  requireSession,
  resolveActiveClubId,
} from "@/lib/auth.server"
import { can } from "@/lib/permissions"
import {
  createClubRecord,
  deleteClubRecord,
  listClubRecords,
  updateClubRecord,
} from "@/lib/clubs.server"

// Re-exported so existing client imports (`import type { ClubRecord }`) keep
// working. Type-only, so it never pulls the server module into the client.
export type { ClubRecord } from "@/lib/clubs.server"

export const clubInput = z.object({
  name: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const clubUpdateInput = clubInput.extend({ id: z.string().min(1) })

// Partial body for PATCH /api/clubs/:id — any subset of fields may be sent.
export const clubPatchInput = clubInput.partial()

export const clubIdSchema = z.object({ id: z.string().min(1) })

export const listClubs = createServerFn({ method: "GET" }).handler(async () => {
  await requirePermission("clubs:manage")
  return listClubRecords()
})

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
    return createClubRecord(data)
  })

export const updateClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => clubUpdateInput.parse(data))
  .handler(async ({ data }) => {
    await requirePermission("clubs:manage")
    return updateClubRecord(data)
  })

// Renames the caller's currently active club. Unlike updateClub (platform-level,
// clubs:manage), this lets a club's own Owner/Admin edit their club profile from
// Settings → General. Scoped to the active club so it can't touch other clubs.
export const renameActiveClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ name: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const session = await requirePermission("settings:manage")
    const clubId = await resolveActiveClubId(session.user)
    if (!clubId) throw new Error("No active club to rename.")
    const name = data.name.trim()
    if (!name) throw new Error("Club name is required.")
    await db.update(club).set({ name }).where(eq(club.id, clubId))
    return { id: clubId, name }
  })

export interface ClubContext {
  activeClubId: string | null
  activeClubName: string | null
  isSuper: boolean
  clubs: { id: string; name: string }[]
}

// Club context for the sidebar club switcher. Super-admins receive every club;
// club-scoped users receive the clubs they're a member of (so an Owner who
// belongs to several clubs can switch between them).
export const getClubContext = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClubContext> => {
    const session = await requireSession()
    const isSuper = can(session.user.role, "clubs:manage")
    const activeClubId = await resolveActiveClubId(session.user)
    const clubs = isSuper
      ? await db
          .select({ id: club.id, name: club.name })
          .from(club)
          .orderBy(asc(club.name))
      : await db
          .select({ id: club.id, name: club.name })
          .from(clubMember)
          .innerJoin(club, eq(club.id, clubMember.clubId))
          .where(eq(clubMember.userId, session.user.id))
          .orderBy(asc(club.name))
    let activeClubName: string | null = null
    if (activeClubId) {
      const found = clubs.find((c) => c.id === activeClubId)
      if (found) {
        activeClubName = found.name
      } else {
        const rows = await db
          .select({ name: club.name })
          .from(club)
          .where(eq(club.id, activeClubId))
          .limit(1)
        activeClubName = rows[0]?.name ?? null
      }
    }
    return { activeClubId, activeClubName, isSuper, clubs }
  }
)

// Selects which club to act as. Super-admins may pick any club; club-scoped
// users may pick their home club or any club they're a member of. Persists in
// an http-only cookie.
export const setActiveClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ clubId: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const session = await requireSession()
    const isSuper = can(session.user.role, "clubs:manage")

    if (isSuper) {
      const exists = await db
        .select({ id: club.id })
        .from(club)
        .where(eq(club.id, data.clubId))
        .limit(1)
      if (exists.length === 0) throw new Error("Club not found.")
    } else if (data.clubId !== session.user.clubId) {
      const member = await db
        .select({ clubId: clubMember.clubId })
        .from(clubMember)
        .where(
          and(
            eq(clubMember.userId, session.user.id),
            eq(clubMember.clubId, data.clubId)
          )
        )
        .limit(1)
      if (member.length === 0) {
        throw new Error("You don't have access to that club.")
      }
    }

    setCookie(ACTIVE_CLUB_COOKIE, data.clubId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })
    return { clubId: data.clubId }
  })

export const deleteClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => clubIdSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission("clubs:manage")
    return deleteClubRecord(data.id)
  })
