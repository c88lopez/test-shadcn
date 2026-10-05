# Code best practices

Keep new code consistent with the patterns already in the repo.

- **DRY / single source of truth**: don't duplicate rules or constants. The permission matrix lives only in `permissions.ts`; club slugging/scoping/seeding each live in one place. If you copy logic, extract a shared helper instead.
- **Reusability & separation of concerns**: keep pure logic free of I/O so it's reusable on client and server and testable in isolation (see `reservation-overlap.ts`). Put side-effecting/data-access code behind the `*.server.ts` / `*.functions.ts` boundary.
- **Unit testing**: pure logic and shared helpers get colocated `*.test.ts` files (e.g. `permissions.test.ts`). Test behavior and edge cases, not implementation. DB-touching code is covered by integration/e2e suites (excluded from coverage). Coverage thresholds in `vitest.config.ts` fail on regressions — add tests with new logic rather than lowering them.
- **Validate at the boundary**: every server function and REST route validates untrusted input with `zod`. Never trust client-supplied ids — re-scope to the authenticated user's active club.
- **Type safety**: prefer precise / `zod`-inferred types over `any` and loose casts. Translation keys, permissions, and roles are typed unions — keep them that way.
- **Small, focused modules & functions**: one responsibility per module; name functions for intent.
- **User-facing text is translated**: route all display strings through i18n in both locales; surface errors via `AppError` + `translateError`.
