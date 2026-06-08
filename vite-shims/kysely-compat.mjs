// Compatibility shim aliased in place of the bare "kysely" import.
//
// @better-auth/kysely-adapter ships a prebuilt SQLite/D1 dialect that imports
// `DEFAULT_MIGRATION_TABLE` and `DEFAULT_MIGRATION_LOCK_TABLE` from "kysely".
// kysely >= 0.29 no longer exports those names, so bundling (rolldown) fails its
// static export-linking check — even though that dialect is never loaded when
// using the Drizzle adapter (which is why dev/runtime works fine).
//
// Re-exporting the real kysely plus these two constants lets the bundler link
// the dead code path. The values only matter for the SQLite migration flow we
// never run, so they just mirror kysely's historical defaults.
// Relative file path bypasses kysely's package `exports` field (which only
// exposes ".") and avoids re-triggering the `^kysely$` alias.
export * from "../node_modules/kysely/dist/index.js"

export const DEFAULT_MIGRATION_TABLE = "kysely_migration"
export const DEFAULT_MIGRATION_LOCK_TABLE = "kysely_migration_lock"
