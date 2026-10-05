import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { Pool } from "pg"
import type { FullConfig } from "@playwright/test"
import { ENGLISH_STATE } from "./helpers"

// The app defaults to Spanish and stores the language per club
// (`lang_<clubId>`), falling back to `lang` only before a club is in scope.
// Specs assert English copy, so seed an "English" cookie for the login page and
// for every club in the E2E database. Specs start from this storage state.
export default async function globalSetup(config: FullConfig) {
  const webServer = config.webServer
  const connectionString = webServer?.env?.DATABASE_URL
  if (!webServer || !connectionString) {
    throw new Error("E2E webServer must set DATABASE_URL")
  }
  const { hostname } = new URL(webServer.url ?? "")

  const pool = new Pool({ connectionString })
  try {
    const { rows } = await pool.query<{ id: string }>("SELECT id FROM club")
    const names = ["lang", ...rows.map((r) => `lang_${r.id}`)]
    const cookies = names.map((name) => ({
      name,
      value: "en",
      domain: hostname,
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    }))
    await mkdir(dirname(ENGLISH_STATE), { recursive: true })
    await writeFile(ENGLISH_STATE, JSON.stringify({ cookies, origins: [] }))
  } finally {
    await pool.end()
  }
}
