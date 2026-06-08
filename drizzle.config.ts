import { defineConfig } from "drizzle-kit"

// Reads DATABASE_URL from the environment. drizzle-kit is the CLI used to
// generate SQL migrations into ./drizzle (applied at deploy time by
// src/db/migrate.ts) and to push the schema during local development.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
