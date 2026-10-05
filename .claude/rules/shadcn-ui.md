# shadcn/ui components

_Applies to: `src/components/ui/**`_

- Add components via `npx shadcn@latest add <component>`; they land in `src/components/ui/`. Config is `components.json` (style `radix-rhea`, base color olive, icon library tabler).
- **After adding any component, remove the leading `"use client"` directive.** It's a Next.js RSC artifact that makes Vinxi treat the module as a client-only boundary and breaks SSR.
- Avoid hand-editing `ui/` primitives beyond that fix; this directory is ESLint-ignored. Compose them in app-level components instead.
- Use `@tabler/icons-react` for icons (the configured shadcn icon library).
