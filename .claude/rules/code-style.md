# Code style

Formatting is enforced by Prettier (`.prettierrc`). Run `bun run format` (write) / `bun run check` (verify).

- **No semicolons** (`semi: false`).
- **Double quotes** (`singleQuote: false`).
- **2-space indent** (`tabWidth: 2`).
- **`es5` trailing commas** (`trailingComma: "es5"`) — trailing commas in arrays/objects, not in function args.
- **80-column** print width (`printWidth: 80`).
- **LF line endings** (`endOfLine: "lf"`).
- **Tailwind class sorting** via `prettier-plugin-tailwindcss`; classes inside `cn(...)` and `cva(...)` are auto-sorted (`tailwindFunctions`), so don't hand-order class lists.
- The `format`/`check` scripts only target `**/*.{ts,tsx,js,jsx}`. `.prettierignore` excludes lockfiles and `src/routeTree.gen.ts` (generated).

Other conventions:

- **No redundant local variables.** Don't introduce a `const` only to return it on the next line — return the expression directly. (A variable that's used more than once, or read by a guard/check before being returned, is fine.)

```ts
// Avoid
function getRouter() {
  const router = createTanStackRouter({ routeTree })
  return router
}

// Prefer
function getRouter() {
  return createTanStackRouter({ routeTree })
}
```

- `@/*` path alias maps to `src/`.
- ESLint extends `@tanstack/eslint-config`; `src/components/ui/**` and generated dirs are ignored. Don't disable lint rules to silence problems — fix the cause.
- Add a comment only to explain non-obvious *why*, never to narrate *what* the code does.
- Before opening a PR, ensure `bun run typecheck`, `bun run lint`, and `bun run test` pass.
