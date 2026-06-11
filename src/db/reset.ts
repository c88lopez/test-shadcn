import { ne } from "drizzle-orm"
import { db } from "@/db"
import {
  club,
  coach,
  coachClass,
  player,
  reservation,
  sale,
  saleItem,
  stockItem,
  user,
} from "@/db/schema"

// Wipes all domain data and non-admin users to return the database to a clean
// state. Preserves the admin login and the Default Club so the app stays
// usable. Run with `bun run db:reset`.

const DEFAULT_CLUB_ID = "00000000-0000-0000-0000-000000000001"
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@club.test"

async function main() {
  try {
    // Domain data first (every club). Order respects FKs even though several
    // cascade; explicit deletes keep the intent obvious.
    await db.delete(saleItem)
    await db.delete(sale)
    await db.delete(reservation)
    await db.delete(coachClass)
    await db.delete(player)
    await db.delete(stockItem)
    await db.delete(coach)
    console.log("✓ Cleared players, reservations, inventory, sales, coaching")

    // Remove every user except the admin (cascades their sessions/accounts).
    await db.delete(user).where(ne(user.email, adminEmail))
    console.log(`✓ Removed all users except ${adminEmail}`)

    // Drop any non-default clubs (cascades any remaining rows that belonged to
    // them). The Default Club is kept.
    await db.delete(club).where(ne(club.id, DEFAULT_CLUB_ID))
    console.log("✓ Removed non-default clubs (kept Default Club)")

    console.log("✓ Database reset to a clean state")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Reset failed:", message)
    process.exitCode = 1
  }
  process.exit(process.exitCode ?? 0)
}

void main()
