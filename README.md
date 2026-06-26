# Padel Club Admin

A database-backed admin dashboard for managing padel clubs: court reservations, players, coaches and classes, tournaments, inventory, sales, users, club settings, and appearance. Built on TanStack Start with shadcn/ui.

The app is currently a functional admin prototype with real Postgres persistence, Better Auth email/password sessions, role-based permissions, and per-club data scoping.

## Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (SSR) + [`@tanstack/react-router`](https://tanstack.com/router) file-based routing
- **UI**: [shadcn/ui](https://ui.shadcn.com) (`radix-rhea` style, olive base) + [Tailwind CSS v4](https://tailwindcss.com)
- **Icons**: [`@tabler/icons-react`](https://tabler.io/icons)
- **Auth**: [Better Auth](https://www.better-auth.com/) with email/password sessions
- **Database**: Postgres + [Drizzle ORM](https://orm.drizzle.team/)
- **Data & forms**: TanStack server functions, `@tanstack/react-table`, `react-hook-form` + `zod`, `recharts`, `date-fns`
- **Runtime/tooling**: React 19, TypeScript, Vite, Bun, Vitest, Playwright

## Getting started

```bash
bun install
cp .env.example .env
bun run db:up
bun run db:push
bun run db:seed
bun run dev   # http://localhost:3003
```

The default local database is a Dockerized Postgres instance on port `5544`.

### Authentication

Authentication is handled by Better Auth. Sessions, users, accounts, and password hashes are stored in Postgres.

The seed script creates these local accounts by default:

- **Club owner**: `admin@club.test` / `admin1234`
- **Platform super admin**: `super@club.test` / `super1234`

You can override seed credentials with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`, `SEED_SUPERADMIN_EMAIL`, and `SEED_SUPERADMIN_PASSWORD`.

### Data Model

Most app data is scoped to a club. Club-scoped users operate within their home club or any additional club memberships, while the `Super Admin` role can operate across clubs.

Core tables include:

- Clubs, club memberships, users, sessions, accounts, and verification records
- Courts and per-club reservation settings
- Players and reservations
- Inventory stock items, sales, and sale line items
- Coaches and classes

## Scripts

```bash
bun run dev        # Start dev server on port 3003
bun run build      # Production build
bun run preview    # Preview the production build
bun run test       # Run tests with vitest
bun run lint       # ESLint
bun run typecheck  # TypeScript type checking (tsc --noEmit)
bun run format     # Prettier (write)
bun run check      # Prettier (check only)
bun run db:up      # Start local Postgres
bun run db:down    # Stop local Postgres
bun run db:push    # Push schema to local database
bun run db:migrate # Apply generated migrations
bun run db:seed    # Seed local demo data
bun run test:e2e   # Run Playwright tests
```

## Routes

All app routes live under the `_authenticated` layout (redirects to `/login` when signed out).

| Route                     | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `/login`                  | Sign-in page                                                       |
| `/`                       | Dashboard — court occupancy, weekly reservations, today's bookings |
| `/reservations`           | Court reservations                                                 |
| `/players`                | Players                                                            |
| `/coaches`                | Coaches                                                            |
| `/coaches/classes`        | Classes                                                            |
| `/tournaments`            | Tournaments                                                        |
| `/inventory`              | Stock items                                                        |
| `/inventory/dashboard`    | Inventory dashboard                                                |
| `/inventory/sales-log`    | Sales log with expandable line items                               |
| `/settings`               | Settings index                                                     |
| `/settings/general`       | General app settings                                               |
| `/settings/reservations`  | Reservation rules, hours, and booking limits                       |
| `/settings/notifications` | Notification preferences                                           |
| `/settings/users`         | User management                                                    |
| `/settings/clubs`         | Club management for super admins                                   |
| `/settings/ui`            | Appearance and accent settings                                     |

## Current Capabilities

- Role-based access control for users, settings, players, reservations, inventory, coaches, and club provisioning
- Multi-club support with a club switcher for users who can access more than one club
- Server-side validation and club scoping for reads and writes
- Reservation conflict detection, court availability checks, opening hours, advance booking limits, and cancellation cutoff rules
- Inventory dashboard, low-stock notifications, stock management, sales logging, and sale item snapshots
- English and Spanish UI translations
- Unit tests for shared domain logic and component behavior, plus Playwright e2e setup

## Project layout

```
src/
  routes/            # File-based routes (TanStack Router)
  components/         # App components + drawers (create/edit forms)
  components/ui/      # shadcn/ui primitives
  db/                 # Drizzle schema, migrations helpers, seed/reset scripts
  lib/                # server functions, auth, permissions, settings, domain logic
  hooks/             # shared hooks
  locales/           # i18n resources
```

## Conventions & gotchas

See [`CLAUDE.md`](./CLAUDE.md) for project conventions, including the shadcn `"use client"` removal step, the `StrictMode` caveat, and dev-server notes.

## Adding shadcn components

```bash
npx shadcn@latest add button
```

Components land in `src/components/ui/`. After adding one, remove the leading `"use client"` directive (a Next.js RSC artifact that breaks SSR under Vinxi).
