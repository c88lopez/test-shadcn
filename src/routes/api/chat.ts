import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  isStepCount,
  gateway,
} from "ai"
import type { UIMessage } from "ai"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { club } from "@/db/schema"
import { requireSession, resolveActiveClubId } from "@/lib/auth.server"
import { buildAiTools } from "@/lib/ai/tools.server"

// `||` (not `??`) so an empty AI_MODEL="" in .env falls back to the default.
// Default to a cheap, tool-calling-capable model; override via AI_MODEL.
const MODEL = process.env.AI_MODEL || "openai/gpt-5-nano"

function systemPrompt(opts: { clubName: string; today: string }): string {
  return [
    "You are the assistant for a padel club admin app. You help staff search data and perform actions.",
    `The active club is "${opts.clubName}". Today's date is ${opts.today}.`,
    "Capabilities:",
    "- searchPlayers: search, list, or COUNT players. All filters are optional — to answer 'how many players' or 'list players', call it with no filters and use the returned count. Filter by age, gender, category and whether they have a phone. Categories C4–C8 (men) / D4–D8 (women); lower number = higher skill, so 'at least C6' means C6, C7, C8.",
    "- createPlayer: add a new player (requires user approval before it runs).",
    "Always use a tool to answer questions about club data; never claim you lack access without trying searchPlayers.",
    "- createReservation: book a court for a player (requires user approval before it runs).",
    "- bulkLoadStockItems: create inventory items, e.g. from a CSV the user pastes (requires user approval before it runs).",
    "When the user pastes CSV for inventory, parse it into items and call bulkLoadStockItems.",
    "Be concise. After a search, summarize the result. If a write tool is denied, do not retry it.",
  ].join("\n")
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await requireSession()
        const clubId = await resolveActiveClubId(session.user)
        if (!clubId) {
          return new Response("No active club", { status: 400 })
        }

        const clubRows = await db
          .select({ name: club.name })
          .from(club)
          .where(eq(club.id, clubId))
          .limit(1)
        const clubName = clubRows.length > 0 ? clubRows[0].name : "this club"

        const { messages }: { messages: UIMessage[] } = await request.json()

        const result = streamText({
          model: gateway(MODEL),
          system: systemPrompt({
            clubName,
            today: new Date().toISOString().slice(0, 10),
          }),
          messages: await convertToModelMessages(messages),
          stopWhen: isStepCount(8),
          tools: buildAiTools({
            userRole: session.user.role,
            userName: session.user.name,
            clubId,
          }),
          toolApproval: {
            createPlayer: "user-approval",
            createReservation: "user-approval",
            bulkLoadStockItems: "user-approval",
          },
          experimental_toolApprovalSecret: process.env.TOOL_APPROVAL_SECRET,
        })

        return createUIMessageStreamResponse({
          stream: toUIMessageStream({ stream: result.stream }),
        })
      },
    },
  },
})
