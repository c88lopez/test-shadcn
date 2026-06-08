import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

// Standalone migration runner used in CI/CD (and locally) to apply committed
// SQL migrations from ./drizzle against DATABASE_URL.
//
//   bun run db:migrate              apply pending migrations (auto-baselines a
//                                   pre-existing schema on first run)
//   bun run db:migrate --baseline   force-record all migrations as applied
//                                   without running them
//
// Auto-baseline exists because our databases were originally created with
// `drizzle-kit push`, so their tables exist but there is no migration history.
// Running migrations against such a database would try to CREATE TABLE on
// existing tables. When the migrations table is empty but the app schema is
// already present, we record the current migrations as applied (without
// executing them) so subsequent migrations apply cleanly.

const MIGRATIONS_FOLDER = join(process.cwd(), "drizzle")

interface JournalEntry {
  tag: string
  when: number
}

function readJournal(): { hash: string; when: number }[] {
  const journalPath = join(MIGRATIONS_FOLDER, "meta", "_journal.json")
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
    entries: JournalEntry[]
  }
  return journal.entries.map((entry) => {
    const sql = readFileSync(
      join(MIGRATIONS_FOLDER, `${entry.tag}.sql`),
      "utf8"
    )
    return {
      hash: createHash("sha256").update(sql).digest("hex"),
      when: entry.when,
    }
  })
}

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query('CREATE SCHEMA IF NOT EXISTS "drizzle"')
  await pool.query(
    'CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)'
  )
}

async function recordAllAsApplied(pool: Pool): Promise<number> {
  const { rows } = await pool.query<{ hash: string }>(
    'SELECT hash FROM "drizzle"."__drizzle_migrations"'
  )
  const applied = new Set(rows.map((row) => row.hash))
  let inserted = 0
  for (const migration of readJournal()) {
    if (applied.has(migration.hash)) continue
    await pool.query(
      'INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)',
      [migration.hash, migration.when]
    )
    inserted++
  }
  return inserted
}

async function isManaged(pool: Pool): Promise<boolean> {
  const { rows } = await pool.query<{ n: number }>(
    'SELECT count(*)::int AS n FROM "drizzle"."__drizzle_migrations"'
  )
  return (rows[0]?.n ?? 0) > 0
}

async function appSchemaExists(pool: Pool): Promise<boolean> {
  const { rows } = await pool.query<{ exists: boolean }>(
    "SELECT to_regclass('public.user') IS NOT NULL AS exists"
  )
  return rows[0]?.exists ?? false
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required to run migrations.")
  }
  const pool = new Pool({ connectionString: url })
  try {
    await ensureMigrationsTable(pool)

    if (process.argv.includes("--baseline")) {
      const inserted = await recordAllAsApplied(pool)
      console.log(`Baseline: recorded ${inserted} migration(s) as applied.`)
      return
    }

    // Auto-baseline a pre-existing (push-created) schema so we don't re-create
    // tables that already exist.
    if (!(await isManaged(pool)) && (await appSchemaExists(pool))) {
      const inserted = await recordAllAsApplied(pool)
      console.log(
        `Existing schema detected without migration history — baselined ${inserted} migration(s).`
      )
    }

    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER })
    console.log("Migrations applied.")
  } finally {
    await pool.end()
  }
}

void main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
