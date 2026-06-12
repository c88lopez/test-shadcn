import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import * as schema from "@/db/schema"
import {
  club,
  clubMember,
  coach,
  coachClass,
  court,
  player,
  reservation,
  sale,
  saleItem,
  stockItem,
  user,
} from "@/db/schema"
import { seedDefaultCourts } from "@/lib/courts.server"
import { SUPER_ADMIN_ROLE } from "@/lib/permissions"
import {
  seedPlayers,
  reservationSeeds,
  stockSeeds,
  saleSeeds,
  coachSeeds,
  classSeeds,
} from "@/db/seed-data"

// Standalone seed: creates an initial admin user through Better Auth so the
// password is hashed the same way as a real sign-up. Uses a cookie-less auth
// instance because this runs outside an HTTP request context.
const seedAuth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
})

// Fixed id matching the one inserted by migration 0004 for the seed/backfill.
const DEFAULT_CLUB_ID = "00000000-0000-0000-0000-000000000001"

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@club.test"
const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234"
const name = process.env.SEED_ADMIN_NAME ?? "Club Admin"

const superEmail = process.env.SEED_SUPERADMIN_EMAIL ?? "super@club.test"
const superPassword = process.env.SEED_SUPERADMIN_PASSWORD ?? "super1234"

async function seedClubs() {
  // The Default Club row is created by the migration; ensure it exists when
  // seeding a fresh database too.
  await db
    .insert(club)
    .values({ id: DEFAULT_CLUB_ID, name: "Default Club", slug: "default" })
    .onConflictDoNothing()
  // Give the Default Club its bookable courts (idempotent; needed when the
  // schema was applied via `db:push` instead of migrations).
  await seedDefaultCourts(DEFAULT_CLUB_ID)
  console.log("✓ Default Club ready")
}

// Maps a club's court numbers (sort order) to court ids for seeding rows.
async function courtIdByNumber(clubId: string): Promise<Map<number, string>> {
  const rows = await db
    .select({ id: court.id, sortOrder: court.sortOrder })
    .from(court)
    .where(eq(court.clubId, clubId))
  return new Map(rows.map((r) => [r.sortOrder, r.id]))
}

async function seedAdmin() {
  try {
    await seedAuth.api.signUpEmail({ body: { email, password, name } })
    console.log(`✓ Seeded admin user: ${email} / ${password}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/exist|unique|already/i.test(message)) {
      console.log(`• Admin user ${email} already exists, skipping.`)
    } else {
      throw err
    }
  }
  // Ensure the admin always has the Owner role in the Default Club (idempotent).
  await db
    .update(user)
    .set({ role: "Owner", clubId: DEFAULT_CLUB_ID })
    .where(eq(user.email, email))
  await ensureMembership(email, DEFAULT_CLUB_ID)
}

// Bootstraps a club_member row so the user can act within (and switch to) their
// home club. Idempotent.
async function ensureMembership(userEmail: string, clubId: string | null) {
  if (!clubId) return
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, userEmail))
    .limit(1)
  if (rows.length === 0) return
  await db
    .insert(clubMember)
    .values({ userId: rows[0].id, clubId })
    .onConflictDoNothing()
}

async function seedSuperAdmin() {
  const added = await ensureUser({
    email: superEmail,
    name: "Platform Super Admin",
    password: superPassword,
    role: SUPER_ADMIN_ROLE,
    clubId: null,
  })
  console.log(
    added
      ? `✓ Seeded super admin: ${superEmail} / ${superPassword}`
      : `• Super admin ${superEmail} already exists, skipping.`
  )
}

async function ensureUser(opts: {
  email: string
  name: string
  password: string
  role: string
  status?: string
  clubId?: string | null
}) {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, opts.email))
    .limit(1)
  if (existing.length > 0) return false
  await seedAuth.api.signUpEmail({
    body: { email: opts.email, password: opts.password, name: opts.name },
  })
  const clubId = opts.clubId === undefined ? DEFAULT_CLUB_ID : opts.clubId
  await db
    .update(user)
    .set({
      role: opts.role,
      status: opts.status ?? "active",
      clubId,
    })
    .where(eq(user.email, opts.email))
  await ensureMembership(opts.email, clubId)
  return true
}

async function seedTeam() {
  const team = [
    { name: "Ana Martínez", email: "ana@padelclub.es", role: "Admin" },
    { name: "Diego Ruiz", email: "diego@padelclub.es", role: "Manager" },
    { name: "Laura Fernández", email: "laura@padelclub.es", role: "Coach" },
    {
      name: "Pedro Sánchez",
      email: "pedro@padelclub.es",
      role: "Front Desk",
      status: "archived",
    },
  ]
  let created = 0
  for (const member of team) {
    const added = await ensureUser({ ...member, password: "padel1234" })
    if (added) created++
  }
  console.log(
    created > 0
      ? `✓ Seeded ${created} team member(s)`
      : "• Team members already seeded, skipping."
  )
}

async function seedPlayerRoster() {
  const existing = await db.select({ id: player.id }).from(player).limit(1)
  if (existing.length > 0) {
    console.log("• Players already seeded, skipping.")
    return
  }
  await db
    .insert(player)
    .values(seedPlayers.map((p) => ({ ...p, clubId: DEFAULT_CLUB_ID })))
  console.log(`✓ Seeded ${seedPlayers.length} players`)
}

async function seedReservationSchedule() {
  const existing = await db
    .select({ id: reservation.id })
    .from(reservation)
    .limit(1)
  if (existing.length > 0) {
    console.log("• Reservations already seeded, skipping.")
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  const courts = await courtIdByNumber(DEFAULT_CLUB_ID)
  await db.insert(reservation).values(
    reservationSeeds.map(({ court: courtNumber, ...r }) => {
      const courtId = courts.get(courtNumber)
      if (!courtId) throw new Error(`No court #${courtNumber} to seed.`)
      return { ...r, courtId, date: today, clubId: DEFAULT_CLUB_ID }
    })
  )
  console.log(`✓ Seeded ${reservationSeeds.length} reservations for ${today}`)
}

async function seedInventory() {
  const existing = await db
    .select({ id: stockItem.id })
    .from(stockItem)
    .limit(1)
  if (existing.length > 0) {
    console.log("• Inventory already seeded, skipping.")
    return
  }
  const inserted = await db
    .insert(stockItem)
    .values(stockSeeds.map((s) => ({ ...s, clubId: DEFAULT_CLUB_ID })))
    .returning()
  const idByName = new Map(inserted.map((s) => [s.name, s.id]))
  console.log(`✓ Seeded ${inserted.length} stock items`)

  for (const seed of saleSeeds) {
    const date = new Date(Date.now() - seed.daysAgo * 86_400_000)
      .toISOString()
      .slice(0, 10)
    const [createdSale] = await db
      .insert(sale)
      .values({ date, soldBy: "Club Admin", clubId: DEFAULT_CLUB_ID })
      .returning()
    await db.insert(saleItem).values(
      seed.items.map((line) => ({
        saleId: createdSale.id,
        stockItemId: idByName.get(line.item) ?? null,
        name: line.item,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      }))
    )
  }
  console.log(`✓ Seeded ${saleSeeds.length} sales`)
}

async function seedCoaching() {
  const existing = await db.select({ id: coach.id }).from(coach).limit(1)
  if (existing.length > 0) {
    console.log("• Coaches already seeded, skipping.")
    return
  }
  const inserted = await db
    .insert(coach)
    .values(coachSeeds.map((c) => ({ ...c, clubId: DEFAULT_CLUB_ID })))
    .returning()
  const idByName = new Map(inserted.map((c) => [c.name, c.id]))
  console.log(`✓ Seeded ${inserted.length} coaches`)

  const courts = await courtIdByNumber(DEFAULT_CLUB_ID)
  await db.insert(coachClass).values(
    classSeeds.map((seed) => {
      const courtId = courts.get(seed.court)
      if (!courtId) throw new Error(`No court #${seed.court} to seed.`)
      return {
        coachId: idByName.get(seed.coach) ?? null,
        courtId,
        date: new Date(Date.now() + seed.offsetDays * 86_400_000)
          .toISOString()
          .slice(0, 10),
        startTime: seed.startTime,
        durationMinutes: seed.durationMinutes,
        clubId: DEFAULT_CLUB_ID,
      }
    })
  )
  console.log(`✓ Seeded ${classSeeds.length} classes`)
}

// Demo data (extra users + players/reservations/inventory/coaching) is only
// inserted when run with `--demo` (i.e. `bun run db:seed:demo`). The default
// `db:seed` just bootstraps the Default Club and the admin login so a fresh
// database starts clean.
const includeDemo = process.argv.includes("--demo")

async function main() {
  try {
    await seedClubs()
    await seedAdmin()
    if (includeDemo) {
      await seedSuperAdmin()
      await seedTeam()
      await seedPlayerRoster()
      await seedReservationSchedule()
      await seedInventory()
      await seedCoaching()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Seed failed:", message)
    process.exitCode = 1
  }
  process.exit(process.exitCode ?? 0)
}

void main()
