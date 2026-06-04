# Padel Club Admin

A single-page admin dashboard for managing a padel club: court reservations, players, coaches and classes, tournaments, and inventory with a sales log. Built on TanStack Start with shadcn/ui.

> Note: this is a front-end prototype. All data is hardcoded/mock and authentication is demo-only (see [Authentication](#authentication)).

## Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (SSR) + [`@tanstack/react-router`](https://tanstack.com/router) file-based routing
- **UI**: [shadcn/ui](https://ui.shadcn.com) (`radix-rhea` style, olive base) + [Tailwind CSS v4](https://tailwindcss.com)
- **Icons**: [`@tabler/icons-react`](https://tabler.io/icons)
- **Data & forms**: `@tanstack/react-table`, `react-hook-form` + `zod`, `recharts`, `date-fns`
- **Runtime/tooling**: React 19, TypeScript, Vite, Bun, Vitest

## Getting started

```bash
bun install
bun run dev   # http://localhost:3003
```

### Authentication

Auth is mock-only and runs entirely in the browser (credentials are hardcoded, session lives in `localStorage`). Do not use as-is in production.

- **Username**: `admin`
- **Password**: `admin123`

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
```

## Routes

All app routes live under the `_authenticated` layout (redirects to `/login` when signed out).

| Route                  | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `/login`               | Sign-in page                                                       |
| `/`                    | Dashboard — court occupancy, weekly reservations, today's bookings |
| `/reservations`        | Court reservations                                                 |
| `/players`             | Players                                                            |
| `/coaches`             | Coaches                                                            |
| `/coaches/classes`     | Classes                                                            |
| `/tournaments`         | Tournaments                                                        |
| `/inventory`           | Stock items                                                        |
| `/inventory/dashboard` | Inventory dashboard                                                |
| `/inventory/sales-log` | Sales log with expandable line items                               |

## Project layout

```
src/
  routes/            # File-based routes (TanStack Router)
  components/         # App components + drawers (create/edit forms)
  components/ui/      # shadcn/ui primitives
  lib/               # auth + utils
  hooks/             # shared hooks
```

## Conventions & gotchas

See [`CLAUDE.md`](./CLAUDE.md) for project conventions, including the shadcn `"use client"` removal step, the `StrictMode` caveat, and dev-server notes.

## Adding shadcn components

```bash
npx shadcn@latest add button
```

Components land in `src/components/ui/`. After adding one, remove the leading `"use client"` directive (a Next.js RSC artifact that breaks SSR under Vinxi).
