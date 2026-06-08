import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { player, reservation, user } from "@/db/schema"
import { seedPlayers, reservationSeeds } from "@/db/seed-data"

// Standalone seed: creates an initial admin user through Better Auth so the
// password is hashed the same way as a real sign-up. Uses a cookie-less auth
// instance because this runs outside an HTTP request context.
const seedAuth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
})

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@club.test"
const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234"
const name = process.env.SEED_ADMIN_NAME ?? "Club Admin"

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
  // Ensure the admin always has the Owner role (idempotent).
  await db.update(user).set({ role: "Owner" }).where(eq(user.email, email))
}

async function ensureUser(opts: {
  email: string
  name: string
  password: string
  role: string
  status?: string
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
  await db
    .update(user)
    .set({ role: opts.role, status: opts.status ?? "active" })
    .where(eq(user.email, opts.email))
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
  await db.insert(player).values(seedPlayers)
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
  await db
    .insert(reservation)
    .values(reservationSeeds.map((r) => ({ ...r, date: today })))
  console.log(`✓ Seeded ${reservationSeeds.length} reservations for ${today}`)
}

async function main() {
  try {
    await seedAdmin()
    await seedTeam()
    await seedPlayerRoster()
    await seedReservationSchedule()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Seed failed:", message)
    process.exitCode = 1
  }
  process.exit(process.exitCode ?? 0)
}

void main()
