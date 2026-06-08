import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { player, reservation } from "@/db/schema"
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
