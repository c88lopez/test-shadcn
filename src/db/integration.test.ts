import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { player, reservation, user } from "@/db/schema"
import { findOverlap } from "@/lib/reservation-overlap"

// Integration tests that exercise the real schema/migrations against a live
// Postgres. They only run when DATABASE_URL_TEST points at a throwaway database
// (the CI `integration` job provides one); otherwise the suite is skipped so the
// default `bun run test` needs no database.
const TEST_URL = process.env.DATABASE_URL_TEST

describe.skipIf(!TEST_URL)("database integration", () => {
  let pool: Pool
  let db: NodePgDatabase<typeof schema>

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_URL })
    db = drizzle(pool, { schema })
    await migrate(db, { migrationsFolder: "drizzle" })
  })

  afterAll(async () => {
    await pool.end()
  })

  beforeEach(async () => {
    await db.delete(reservation)
    await db.delete(player)
    await db.delete(user)
  })

  describe("players", () => {
    it("supports create / list / update / delete", async () => {
      const [created] = await db
        .insert(player)
        .values({
          fullName: "Test Player",
          email: "tp@test.dev",
          phone: "+34 600 000 000",
          age: 30,
          gender: "Male",
          category: "B",
        })
        .returning()
      expect(created.id).toBeTruthy()

      expect(await db.select().from(player)).toHaveLength(1)

      await db
        .update(player)
        .set({ category: "A" })
        .where(eq(player.id, created.id))
      const [updated] = await db
        .select()
        .from(player)
        .where(eq(player.id, created.id))
      expect(updated.category).toBe("A")

      await db.delete(player).where(eq(player.id, created.id))
      expect(await db.select().from(player)).toHaveLength(0)
    })
  })

  describe("users", () => {
    function newUser(email: string) {
      return {
        id: randomUUID(),
        name: "Test User",
        email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    it("applies role and status defaults", async () => {
      const [created] = await db
        .insert(user)
        .values(newUser("defaults@test.dev"))
        .returning()
      expect(created.role).toBe("Front Desk")
      expect(created.status).toBe("active")
    })

    it("enforces a unique email", async () => {
      await db.insert(user).values(newUser("dup@test.dev"))
      await expect(
        db.insert(user).values(newUser("dup@test.dev"))
      ).rejects.toThrow()
    })
  })

  describe("reservation conflicts", () => {
    const day = "2026-01-15"

    async function book(court: number, startTime: string, duration: number) {
      await db.insert(reservation).values({
        court,
        player: "Booked Player",
        bookedBy: "Front Desk",
        date: day,
        startTime,
        durationMinutes: duration,
        paymentStatus: "paid",
      })
    }

    async function sameCourtSlots(court: number) {
      return db
        .select()
        .from(reservation)
        .where(and(eq(reservation.court, court), eq(reservation.date, day)))
    }

    it("flags an overlapping booking on the same court", async () => {
      await book(1, "10:00", 60)
      const conflict = findOverlap(
        { startTime: "10:30", durationMinutes: 60 },
        await sameCourtSlots(1)
      )
      expect(conflict).toBeDefined()
    })

    it("allows back-to-back bookings whose edges touch", async () => {
      await book(1, "10:00", 60)
      const conflict = findOverlap(
        { startTime: "11:00", durationMinutes: 60 },
        await sameCourtSlots(1)
      )
      expect(conflict).toBeUndefined()
    })

    it("does not flag a booking on a different court", async () => {
      await book(1, "10:00", 60)
      const conflict = findOverlap(
        { startTime: "10:00", durationMinutes: 60 },
        await sameCourtSlots(2)
      )
      expect(conflict).toBeUndefined()
    })
  })
})
