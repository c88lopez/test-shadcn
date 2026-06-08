import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import * as schema from "@/db/schema"

const ARCHIVED_MESSAGE =
  "This account has been archived. Contact an administrator."

async function isArchived(where: ReturnType<typeof eq>): Promise<boolean> {
  const rows = await db
    .select({ status: schema.user.status })
    .from(schema.user)
    .where(where)
    .limit(1)
  return rows.length > 0 && rows[0].status === "archived"
}

// Server-side Better Auth instance. Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL
// from the environment. Sessions/accounts/users live in our Postgres via Drizzle.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Managed server-side via users.functions.ts, never from client input.
      role: { type: "string", required: false, input: false },
      status: { type: "string", required: false, input: false },
    },
  },
  hooks: {
    // Reject archived accounts at sign-in with a clear message (runs before
    // credential verification, so it isn't masked as "invalid password").
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return
      const email = ctx.body?.email as string | undefined
      if (email && (await isArchived(eq(schema.user.email, email)))) {
        throw new APIError("FORBIDDEN", { message: ARCHIVED_MESSAGE })
      }
    }),
  },
  databaseHooks: {
    session: {
      create: {
        // Defense in depth: block session creation for archived accounts via
        // any other path too.
        before: async (session) => {
          if (await isArchived(eq(schema.user.id, session.userId))) {
            throw new APIError("FORBIDDEN", { message: ARCHIVED_MESSAGE })
          }
          return { data: session }
        },
      },
    },
  },
  // tanstackStartCookies must be the last plugin so it can wrap cookie handling.
  plugins: [tanstackStartCookies()],
})
