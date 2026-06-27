import { randomUUID } from "node:crypto"
import { and, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import {
  club,
  clubReservationSettings,
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
import { DEFAULT_RESERVATION_SETTINGS } from "@/lib/reservation-settings"
import { findOverlap } from "@/lib/reservation-overlap"
import { findStockShortages } from "@/lib/inventory"
import { classStatus } from "@/lib/classes"

// Integration tests that exercise the real schema/migrations against a live
// Postgres. They only run when DATABASE_URL_TEST points at a throwaway database
// (the CI `integration` job provides one); otherwise the suite is skipped so the
// default `bun run test` needs no database.
const TEST_URL = process.env.DATABASE_URL_TEST

// The `*.server.ts` helpers exercised in the tenant-isolation block import the
// app's shared `@/db`, which reads `DATABASE_URL`. Point it at the same
// throwaway database as our direct connection so both see identical data.
if (TEST_URL) process.env.DATABASE_URL = TEST_URL

// Default club seeded by migration 0004; all domain rows are scoped to it.
const CLUB_ID = "00000000-0000-0000-0000-000000000001"
// A second club used to prove cross-tenant isolation.
const CLUB_B_ID = "00000000-0000-0000-0000-0000000000b2"
// Two fixed courts for this club, created in beforeAll.
const COURT1_ID = "00000000-0000-0000-0000-0000000c0001"
const COURT2_ID = "00000000-0000-0000-0000-0000000c0002"
// A court that belongs to the second club.
const COURT_B_ID = "00000000-0000-0000-0000-0000000c00b1"

describe.skipIf(!TEST_URL)("database integration", () => {
  let pool: Pool
  let db: NodePgDatabase<typeof schema>

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_URL })
    db = drizzle(pool, { schema })
    await migrate(db, { migrationsFolder: "drizzle" })
    await db
      .insert(club)
      .values({ id: CLUB_ID, name: "Default Club", slug: "default" })
      .onConflictDoNothing()
    await db
      .insert(court)
      .values([
        {
          id: COURT1_ID,
          name: "Court 1",
          type: "indoor",
          active: true,
          sortOrder: 1,
          clubId: CLUB_ID,
        },
        {
          id: COURT2_ID,
          name: "Court 2",
          type: "indoor",
          active: true,
          sortOrder: 2,
          clubId: CLUB_ID,
        },
      ])
      .onConflictDoNothing()
    await db
      .insert(clubReservationSettings)
      .values({ clubId: CLUB_ID, ...DEFAULT_RESERVATION_SETTINGS })
      .onConflictDoNothing()

    // Second club + its own court, for tenant-isolation checks.
    await db
      .insert(club)
      .values({ id: CLUB_B_ID, name: "Second Club", slug: "second-club" })
      .onConflictDoNothing()
    await db
      .insert(court)
      .values({
        id: COURT_B_ID,
        name: "B Court",
        type: "indoor",
        active: true,
        sortOrder: 1,
        clubId: CLUB_B_ID,
      })
      .onConflictDoNothing()
  })

  afterAll(async () => {
    await pool.end()
  })

  beforeEach(async () => {
    await db.delete(saleItem)
    await db.delete(sale)
    await db.delete(stockItem)
    await db.delete(coachClass)
    await db.delete(coach)
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
          clubId: CLUB_ID,
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

    async function book(courtId: string, startTime: string, duration: number) {
      await db.insert(reservation).values({
        courtId,
        player: "Booked Player",
        bookedBy: "Front Desk",
        date: day,
        startTime,
        durationMinutes: duration,
        paymentStatus: "paid",
        clubId: CLUB_ID,
      })
    }

    async function sameCourtSlots(courtId: string) {
      return db
        .select()
        .from(reservation)
        .where(and(eq(reservation.courtId, courtId), eq(reservation.date, day)))
    }

    it("flags an overlapping booking on the same court", async () => {
      await book(COURT1_ID, "10:00", 60)
      const conflict = findOverlap(
        { startTime: "10:30", durationMinutes: 60 },
        await sameCourtSlots(COURT1_ID)
      )
      expect(conflict).toBeDefined()
    })

    it("allows back-to-back bookings whose edges touch", async () => {
      await book(COURT1_ID, "10:00", 60)
      const conflict = findOverlap(
        { startTime: "11:00", durationMinutes: 60 },
        await sameCourtSlots(COURT1_ID)
      )
      expect(conflict).toBeUndefined()
    })

    it("does not flag a booking on a different court", async () => {
      await book(COURT1_ID, "10:00", 60)
      const conflict = findOverlap(
        { startTime: "10:00", durationMinutes: 60 },
        await sameCourtSlots(COURT2_ID)
      )
      expect(conflict).toBeUndefined()
    })
  })

  describe("reservation settings", () => {
    it("round-trips the jsonb hours and updates rule columns", async () => {
      const [row] = await db
        .select()
        .from(clubReservationSettings)
        .where(eq(clubReservationSettings.clubId, CLUB_ID))
      expect(row.timezone).toBe(DEFAULT_RESERVATION_SETTINGS.timezone)
      expect(row.hours.sun.closed).toBe(true)
      expect(row.maxConcurrentPerPlayer).toBe(2)

      await db
        .update(clubReservationSettings)
        .set({ minAdvanceHours: 6, maxAdvanceDays: 14 })
        .where(eq(clubReservationSettings.clubId, CLUB_ID))
      const [updated] = await db
        .select()
        .from(clubReservationSettings)
        .where(eq(clubReservationSettings.clubId, CLUB_ID))
      expect(updated.minAdvanceHours).toBe(6)
      expect(updated.maxAdvanceDays).toBe(14)
    })
  })

  describe("inventory", () => {
    it("supports stock item create / list / update / delete", async () => {
      const [created] = await db
        .insert(stockItem)
        .values({
          name: "Test Drink",
          category: "Drinks",
          price: 2.5,
          stock: 30,
          clubId: CLUB_ID,
        })
        .returning()
      expect(created.id).toBeTruthy()
      expect(created.price).toBe(2.5)

      await db
        .update(stockItem)
        .set({ stock: 25 })
        .where(eq(stockItem.id, created.id))
      const [updated] = await db
        .select()
        .from(stockItem)
        .where(eq(stockItem.id, created.id))
      expect(updated.stock).toBe(25)

      await db.delete(stockItem).where(eq(stockItem.id, created.id))
      expect(await db.select().from(stockItem)).toHaveLength(0)
    })

    it("decrements stock when a sale is recorded and cascades item deletes", async () => {
      const [drink] = await db
        .insert(stockItem)
        .values({
          name: "Energy Drink",
          category: "Drinks",
          price: 2.5,
          stock: 10,
          clubId: CLUB_ID,
        })
        .returning()

      const [createdSale] = await db
        .insert(sale)
        .values({ date: "2026-02-01", soldBy: "Front Desk", clubId: CLUB_ID })
        .returning()
      await db.insert(saleItem).values({
        saleId: createdSale.id,
        stockItemId: drink.id,
        name: drink.name,
        quantity: 3,
        unitPrice: 2.5,
      })
      await db
        .update(stockItem)
        .set({ stock: sql`${stockItem.stock} - ${3}` })
        .where(eq(stockItem.id, drink.id))

      const [afterSale] = await db
        .select()
        .from(stockItem)
        .where(eq(stockItem.id, drink.id))
      expect(afterSale.stock).toBe(7)

      // Deleting the sale cascades to its line items.
      await db.delete(sale).where(eq(sale.id, createdSale.id))
      expect(await db.select().from(saleItem)).toHaveLength(0)
    })

    it("detects shortages against live stock levels", async () => {
      const [racket] = await db
        .insert(stockItem)
        .values({
          name: "Padel Racket (Pro)",
          category: "Equipment",
          price: 149.99,
          stock: 2,
          clubId: CLUB_ID,
        })
        .returning()

      const levels = await db
        .select({
          id: stockItem.id,
          name: stockItem.name,
          stock: stockItem.stock,
        })
        .from(stockItem)

      expect(
        findStockShortages([{ stockItemId: racket.id, quantity: 2 }], levels)
      ).toEqual([])
      expect(
        findStockShortages([{ stockItemId: racket.id, quantity: 3 }], levels)
      ).toHaveLength(1)
    })
  })

  describe("coaches & classes", () => {
    it("supports coach create / list / update / delete", async () => {
      const [created] = await db
        .insert(coach)
        .values({
          name: "Test Coach",
          phone: "+34 600 000 000",
          birthday: "1990-01-01",
          clubId: CLUB_ID,
        })
        .returning()
      expect(created.id).toBeTruthy()

      await db
        .update(coach)
        .set({ phone: "+34 611 111 111" })
        .where(eq(coach.id, created.id))
      const [updated] = await db
        .select()
        .from(coach)
        .where(eq(coach.id, created.id))
      expect(updated.phone).toBe("+34 611 111 111")

      await db.delete(coach).where(eq(coach.id, created.id))
      expect(await db.select().from(coach)).toHaveLength(0)
    })

    it("allows a coach without a birthday", async () => {
      const [created] = await db
        .insert(coach)
        .values({
          name: "No Birthday",
          phone: "+34 600 000 002",
          clubId: CLUB_ID,
        })
        .returning()
      expect(created.birthday).toBeNull()
    })

    it("nulls a class's coach when the coach is deleted", async () => {
      const [c] = await db
        .insert(coach)
        .values({
          name: "Temp Coach",
          phone: "+34 600 000 001",
          birthday: "1991-02-02",
          clubId: CLUB_ID,
        })
        .returning()
      const [cls] = await db
        .insert(coachClass)
        .values({
          coachId: c.id,
          courtId: COURT1_ID,
          date: "2026-03-01",
          startTime: "10:00",
          durationMinutes: 90,
          clubId: CLUB_ID,
        })
        .returning()
      expect(cls.coachId).toBe(c.id)

      await db.delete(coach).where(eq(coach.id, c.id))
      const [orphan] = await db
        .select()
        .from(coachClass)
        .where(eq(coachClass.id, cls.id))
      expect(orphan.coachId).toBeNull()

      // Derived status reflects schedule vs. now.
      expect(
        classStatus(
          orphan.date,
          orphan.startTime,
          orphan.durationMinutes,
          new Date("2026-03-01T09:00:00")
        )
      ).toBe("Upcoming")
      expect(
        classStatus(
          orphan.date,
          orphan.startTime,
          orphan.durationMinutes,
          new Date("2026-03-01T12:00:00")
        )
      ).toBe("Completed")
    })
  })

  // Exercises the real club-scoping in courts.server.ts: every query is filtered
  // by clubId, so one club must never read or mutate another club's rows.
  describe("tenant isolation (courts.server)", () => {
    // Loaded dynamically (not a static import) so the app's `@/db` connects only
    // after DATABASE_URL is pointed at the test database above.
    const loadCourts = () => import("@/lib/courts.server")
    let courts: Awaited<ReturnType<typeof loadCourts>>

    beforeAll(async () => {
      courts = await loadCourts()
    })

    it("lists only the requested club's courts", async () => {
      const a = await courts.listCourtRecords(CLUB_ID)
      const aIds = a.map((c) => c.id)
      expect(aIds).toEqual(expect.arrayContaining([COURT1_ID, COURT2_ID]))
      // Club A must never see the other club's court.
      expect(aIds).not.toContain(COURT_B_ID)

      // Club B sees exactly its own court — none of club A's leak through.
      const b = await courts.listCourtRecords(CLUB_B_ID)
      expect(b.map((c) => c.id)).toEqual([COURT_B_ID])
    })

    it("refuses to update another club's court", async () => {
      await expect(
        courts.updateCourtRecord(CLUB_B_ID, {
          id: COURT1_ID,
          name: "Hijacked",
        })
      ).rejects.toThrow("Court not found.")

      const [row] = await db.select().from(court).where(eq(court.id, COURT1_ID))
      expect(row.name).toBe("Court 1")
    })

    it("does not delete another club's court", async () => {
      await courts.deleteCourtRecord(CLUB_B_ID, COURT1_ID)
      const rows = await db.select().from(court).where(eq(court.id, COURT1_ID))
      expect(rows).toHaveLength(1)
    })

    it("treats another club's court as not bookable", async () => {
      await expect(
        courts.assertCourtBookable(CLUB_B_ID, COURT1_ID)
      ).rejects.toThrow()
      // Sanity: the court is bookable within its own club.
      await expect(
        courts.assertCourtBookable(CLUB_ID, COURT1_ID)
      ).resolves.toBeUndefined()
    })
  })

  // Exercises the DB-backed per-player concurrency rule in
  // reservation-settings.server.ts (the pure window/cutoff rules are unit-tested
  // separately in reservation-settings.test.ts).
  describe("per-player booking limit (reservation-settings.server)", () => {
    const loadSettings = () => import("@/lib/reservation-settings.server")
    let settingsServer: Awaited<ReturnType<typeof loadSettings>>

    // A weekday a few days out: comfortably inside the advance window and on an
    // open day (default hours close only on Sunday).
    function futureOpenDate(daysAhead = 5): string {
      const d = new Date()
      d.setDate(d.getDate() + daysAhead)
      if (d.getDay() === 0) d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    }

    const PLAYER = "Concurrency Player"

    beforeAll(async () => {
      settingsServer = await loadSettings()
      // Pin a known rule set so the window checks pass and the limit is 2.
      await settingsServer.upsertReservationSettingsRecord(CLUB_ID, {
        maxConcurrentPerPlayer: 2,
        minAdvanceHours: 1,
        maxAdvanceDays: 30,
      })
    })

    async function seedUpcoming(date: string) {
      return db
        .insert(reservation)
        .values([
          {
            courtId: COURT1_ID,
            player: PLAYER,
            bookedBy: "Front Desk",
            date,
            startTime: "10:00",
            durationMinutes: 60,
            paymentStatus: "paid",
            clubId: CLUB_ID,
          },
          {
            courtId: COURT2_ID,
            player: PLAYER,
            bookedBy: "Front Desk",
            date,
            startTime: "11:00",
            durationMinutes: 60,
            paymentStatus: "paid",
            clubId: CLUB_ID,
          },
        ])
        .returning({ id: reservation.id })
    }

    it("rejects a booking that exceeds the per-player limit", async () => {
      const date = futureOpenDate()
      await seedUpcoming(date)
      await expect(
        settingsServer.assertBookingAllowed(CLUB_ID, {
          player: PLAYER,
          date,
          startTime: "12:00",
          durationMinutes: 60,
        })
      ).rejects.toThrow(/errors\.booking\.concurrency/)
    })

    it("does not count the reservation being edited against the limit", async () => {
      const date = futureOpenDate()
      const [first] = await seedUpcoming(date)
      // Editing one of the two existing bookings: excluding itself leaves 1 < 2.
      await expect(
        settingsServer.assertBookingAllowed(
          CLUB_ID,
          { player: PLAYER, date, startTime: "12:00", durationMinutes: 60 },
          { excludeId: first.id }
        )
      ).resolves.toBeUndefined()
    })
  })
})
