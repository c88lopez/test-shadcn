# Known gotchas

- **shadcn `"use client"`**: after `npx shadcn@latest add <component>`, remove the leading `"use client"` directive from the generated file in `src/components/ui/`. It's a Next.js RSC artifact that makes Vinxi treat the module as a client-only boundary and breaks SSR.
- `src/routeTree.gen.ts` is **auto-generated** by the router plugin — never edit it manually.
- `src/client.tsx` removes `React.StrictMode` on purpose (StrictMode double-invokes effects in dev, replaying shadcn sidebar/sheet transitions like a page refresh). Do not re-add it.
- The root route uses both `shellComponent` (SSR HTML shell) and `component` (layout with `<Outlet />`). Keep the stateful sidebar layout in `component`, not `shellComponent`, or you get hydration mismatches.
- **Never start a second `bun run dev`** while one is running — both watch the same source and `.vite` cache, causing a `full-reload` loop. Reuse the running server (e.g. `curl` or point Playwright at the existing port).
- Server-only deps (`pg`, `prom-client`, AI tools) must only be imported from `*.server.ts` / server-function / route-handler boundaries, never from a module a client component imports.
