import { tool } from "ai"
import { and, asc, eq, gte, inArray, lte, ne } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { court, player, reservation, stockItem } from "@/db/schema"
import { can } from "@/lib/permissions"
import { assertCourtBookable } from "@/lib/courts.server"
import { assertBookingAllowed } from "@/lib/reservation-settings.server"
import { findOverlap } from "@/lib/reservation-overlap"
import { AppError } from "@/lib/errors"

// Context captured once per request in the chat route and closed over by the
// tools, so they never depend on async request context during streaming.
export interface AiToolContext {
  userRole: string | null | undefined
  userName: string
  clubId: string
}

// Names of write tools that must be approved by the user before executing.
export const WRITE_TOOL_NAMES = [
  "createPlayer",
  "createReservation",
  "bulkLoadStockItems",
] as const

function readableError(error: unknown): string {
  if (error instanceof AppError) return error.code
  return error instanceof Error ? error.message : "Unknown error"
}

export function buildAiTools(ctx: AiToolContext) {
  return {
    searchPlayers: tool({
      description:
        "Search, list, or count players in the active club. ALL filters are optional — call it with no filters to get every player and the total count (e.g. for 'how many players are there?'). Categories look like C4–C8 (men) and D4–D8 (women); a lower number means a higher skill level. To express 'at least C6', pass the set of equal-or-lower-skill categories (e.g. C6, C7, C8). Returns the matching players and their count.",
      inputSchema: z.object({
        minAge: z
          .number()
          .int()
          .optional()
          .describe(
            "Minimum age, inclusive. Omit entirely for no lower bound."
          ),
        maxAge: z
          .number()
          .int()
          .optional()
          .describe(
            "Maximum age, inclusive. Omit entirely for no upper bound."
          ),
        gender: z.enum(["Male", "Female"]).optional(),
        categories: z
          .array(z.string())
          .optional()
          .describe("Exact category codes to include, e.g. ['C6','C7','C8']"),
        hasPhone: z
          .boolean()
          .optional()
          .describe("Only players that have a non-empty phone number"),
      }),
      execute: async ({ minAge, maxAge, gender, categories, hasPhone }) => {
        try {
          // Ignore out-of-range age bounds: models sometimes pass sentinel
          // values (e.g. ±Number.MAX_SAFE_INTEGER) to mean "no limit", which
          // overflow the integer `age` column and fail the query.
          const inAgeRange = (n: number) => n >= 0 && n <= 150
          const conds = [eq(player.clubId, ctx.clubId)]
          if (minAge != null && inAgeRange(minAge))
            conds.push(gte(player.age, minAge))
          if (maxAge != null && inAgeRange(maxAge))
            conds.push(lte(player.age, maxAge))
          if (gender) conds.push(eq(player.gender, gender))
          if (categories && categories.length > 0)
            conds.push(inArray(player.category, categories))
          if (hasPhone) conds.push(ne(player.phone, ""))

          const rows = await db
            .select({
              id: player.id,
              fullName: player.fullName,
              email: player.email,
              phone: player.phone,
              age: player.age,
              gender: player.gender,
              category: player.category,
            })
            .from(player)
            .where(and(...conds))
            .orderBy(asc(player.fullName))
            .limit(100)

          return { ok: true as const, count: rows.length, players: rows }
        } catch (error) {
          console.error("[ai] searchPlayers failed", error)
          return { ok: false as const, error: readableError(error) }
        }
      },
    }),

    createPlayer: tool({
      description:
        "Create a new player in the active club (requires user approval before it runs). Category codes are C4–C8 (men) and D4–D8 (women).",
      inputSchema: z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        age: z.number().int().min(5).max(99),
        gender: z.enum(["Male", "Female"]),
        category: z.string().min(1),
      }),
      execute: async (data) => {
        try {
          if (!can(ctx.userRole, "players:manage")) {
            return { ok: false as const, error: "forbidden" }
          }
          const [created] = await db
            .insert(player)
            .values({ ...data, clubId: ctx.clubId })
            .returning({ id: player.id, fullName: player.fullName })
          return { ok: true as const, player: created }
        } catch (error) {
          return { ok: false as const, error: readableError(error) }
        }
      },
    }),

    createReservation: tool({
      description:
        "Create a court reservation for a player in the active club. Requires the court number, player name, date (YYYY-MM-DD), start time (HH:MM, 24h) and duration in minutes. Validates opening hours, advance window, court availability and conflicts.",
      inputSchema: z.object({
        courtNumber: z
          .number()
          .int()
          .describe("The court number, e.g. 3 for 'Court 3'"),
        player: z.string().min(1).describe("Player full name"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        durationMinutes: z.number().int().min(15).max(360).default(90),
        paymentStatus: z.enum(["paid", "partial", "unpaid"]).default("unpaid"),
      }),
      execute: async ({
        courtNumber,
        player: playerName,
        date,
        startTime,
        durationMinutes,
        paymentStatus,
      }) => {
        try {
          if (!can(ctx.userRole, "reservations:manage")) {
            return { ok: false as const, error: "forbidden" }
          }
          const courtRows = await db
            .select({ id: court.id, name: court.name })
            .from(court)
            .where(
              and(
                eq(court.clubId, ctx.clubId),
                eq(court.sortOrder, courtNumber)
              )
            )
            .limit(1)
          if (courtRows.length === 0) {
            return { ok: false as const, error: `No court #${courtNumber}` }
          }
          const courtRow = courtRows[0]

          await assertCourtBookable(ctx.clubId, courtRow.id)
          await assertBookingAllowed(ctx.clubId, {
            date,
            startTime,
            durationMinutes,
            player: playerName,
          })

          const sameSlot = await db
            .select()
            .from(reservation)
            .where(
              and(
                eq(reservation.clubId, ctx.clubId),
                eq(reservation.courtId, courtRow.id),
                eq(reservation.date, date)
              )
            )
          const conflict = findOverlap({ startTime, durationMinutes }, sameSlot)
          if (conflict) {
            return {
              ok: false as const,
              error: `Conflicts with ${conflict.player} at ${conflict.startTime}`,
            }
          }

          const [created] = await db
            .insert(reservation)
            .values({
              courtId: courtRow.id,
              player: playerName,
              bookedBy: ctx.userName,
              date,
              startTime,
              durationMinutes,
              paymentStatus,
              clubId: ctx.clubId,
            })
            .returning()

          return {
            ok: true as const,
            reservation: {
              id: created.id,
              court: courtRow.name,
              player: playerName,
              date,
              startTime,
              durationMinutes,
              paymentStatus,
            },
          }
        } catch (error) {
          return { ok: false as const, error: readableError(error) }
        }
      },
    }),

    bulkLoadStockItems: tool({
      description:
        "Bulk-create inventory stock items in the active club, e.g. from a CSV the user provides. Each item needs a name, category and price; stock and lowStockThreshold are optional.",
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              name: z.string().min(1),
              category: z.string().min(1),
              price: z.number().positive(),
              stock: z.number().int().min(0).default(0),
              lowStockThreshold: z.number().int().min(0).default(10),
            })
          )
          .min(1)
          .max(500),
      }),
      execute: async ({ items }) => {
        try {
          if (!can(ctx.userRole, "inventory:manage")) {
            return { ok: false as const, error: "forbidden" }
          }
          const inserted = await db
            .insert(stockItem)
            .values(items.map((i) => ({ ...i, clubId: ctx.clubId })))
            .returning({ id: stockItem.id, name: stockItem.name })
          return { ok: true as const, created: inserted.length }
        } catch (error) {
          return { ok: false as const, error: readableError(error) }
        }
      },
    }),
  }
}
