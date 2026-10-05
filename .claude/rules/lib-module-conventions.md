# Module naming conventions

_Applies to: `src/lib/**/*.ts`_

The `src/lib/` layer uses file suffixes to encode the trust/runtime boundary. They keep server-only code (and the `pg` driver) out of the client bundle and keep logic unit-testable.

- **`*.functions.ts`** — TanStack server functions (`createServerFn`). The public data API the UI calls. Validate input with `zod` (`.inputValidator`) and enforce auth/permissions via `auth.server.ts` (`requireClubId`, `currentClubId`, `requirePermission`). Example: `players.functions.ts`.
- **`*.server.ts`** — server-only modules (touch `db`/`pg` or Node-only deps) that are **not** themselves server functions: pure data-access helpers, metrics, AI tools. Shared by server functions and REST routes without leaking to the client. Example: `clubs.server.ts`.
- **Plain `*.ts`** — pure, dependency-free domain logic safe to import anywhere and easy to unit-test. Example: `reservation-overlap.ts`, `permissions.ts`.

When adding behavior: pure logic → plain module; server-only data access → `*.server.ts`; expose to the UI via a thin `*.functions.ts` wrapper that adds validation + auth.
