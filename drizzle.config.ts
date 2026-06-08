import { defineConfig } from "drizzle-kit"

// Reads DATABASE_URL from the environment. drizzle-kit is a dev-only CLI used
// for generating and pushing migrations against the Postgres (Neon) database.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
