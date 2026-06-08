import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/db"
import * as schema from "@/db/schema"

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
  // tanstackStartCookies must be the last plugin so it can wrap cookie handling.
  plugins: [tanstackStartCookies()],
})
