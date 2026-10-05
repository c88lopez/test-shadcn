# Padel Club Admin

A database-backed admin dashboard for managing padel clubs (court reservations, players, coaches/classes, tournaments, inventory, sales, users, settings, appearance). Real Postgres persistence, Better Auth sessions, role-based permissions, per-club scoping, English/Spanish i18n, an AI assistant, and Prometheus metrics.

## Stack

- **Framework**: TanStack Start (SSR) + `@tanstack/react-router` file-based routing
- **UI**: shadcn/ui (`radix-rhea` style, olive base) + Tailwind CSS v4, `@tabler/icons-react`
- **Auth**: Better Auth (email/password sessions in Postgres)
- **Database**: Postgres + Drizzle ORM (`pg` driver)
- **Data/forms**: TanStack server functions, `@tanstack/react-table`, `react-hook-form` + `zod`, `recharts`, `date-fns`
- **AI**: Vercel AI SDK (`ai`) via AI Gateway
- **i18n**: `i18next` / `react-i18next` (bundled `en`/`es`)
- **Tooling**: React 19, TypeScript, Vite, Bun, Vitest, Playwright

## Commands

```bash
bun run dev        # Dev server on port 3003
bun run build      # Production build
bun run test       # Unit/component tests (vitest)
bun run lint       # ESLint
bun run typecheck  # tsc --noEmit
bun run format     # Prettier write
bun run db:up      # Start local Postgres (Docker, port 5544)
bun run db:push    # Push schema to DB (dev)
bun run db:seed    # Seed local data (:demo for richer data)
bun run test:e2e   # Playwright e2e (resets e2e DB first)
```

Single unit test: `bun run test -- path/to/file.test.tsx`. First-time setup: `bun install && cp .env.example .env && bun run db:up && bun run db:push && bun run db:seed && bun run dev`.

## Layout

```
src/
  routes/        # File-based routes; api/* are REST/handler routes
  components/     # App components + create/edit "drawers"
  components/ui/  # shadcn/ui primitives
  db/             # Drizzle schema, migrate/seed/reset scripts
  lib/            # server functions, auth, permissions, domain logic, i18n, ai/
  hooks/          # shared hooks
  locales/        # en.ts / es.ts
  styles.css      # Tailwind v4 theme tokens (OKLCH)
```
