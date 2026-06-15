import { execSync } from "node:child_process"
import { Pool } from "pg"

// Recreates the disposable E2E database from scratch, then applies migrations
// and seeds demo data. Run before the Playwright suite (see the `pretest:e2e*`
// scripts). Local-only: CI provisions its own throwaway Postgres service.
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5544/padel_e2e"

const url = new URL(E2E_DATABASE_URL)
const dbName = url.pathname.replace(/^\//, "")
if (!dbName) throw new Error("E2E_DATABASE_URL must include a database name")

// Connect to the maintenance database to drop/create the target.
const adminUrl = new URL(E2E_DATABASE_URL)
adminUrl.pathname = "/postgres"

async function main() {
  const pool = new Pool({ connectionString: adminUrl.toString() })
  try {
    // FORCE terminates any lingering connections (e.g. a reused E2E server).
    await pool.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`)
    await pool.query(`CREATE DATABASE "${dbName}"`)
    console.log(`✓ Recreated disposable database "${dbName}"`)
  } finally {
    await pool.end()
  }

  const childEnv = { ...process.env, DATABASE_URL: E2E_DATABASE_URL }
  execSync("bun run db:migrate", { stdio: "inherit", env: childEnv })
  execSync("bun run db:seed:demo", { stdio: "inherit", env: childEnv })
}

void main().catch((error: unknown) => {
  console.error("E2E database reset failed:", error)
  process.exit(1)
})
