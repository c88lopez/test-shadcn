# Testing

_Applies to: `src/**/*.{test,spec}.{ts,tsx}`, `vitest.config.ts`, `playwright.config.ts`_

- Unit/component tests run on Vitest + Testing Library (jsdom), colocated as `*.test.ts`/`*.test.tsx` next to the code they cover.
- Test pure domain logic and shared helpers directly (e.g. `permissions.test.ts`, `reservation-overlap.test.ts`). Assert behavior and edge cases, not implementation details.
- DB-touching code (`*.functions.ts`, `*.server.ts`) is covered by the integration (`test:integration`) and Playwright e2e suites, and is **excluded** from unit coverage — don't try to unit-test it with a real DB.
- Coverage thresholds in `vitest.config.ts` fail the run on regressions. Add tests with new logic; don't lower thresholds to pass.
- Tests pin the i18n locale to English (`src/test/setup.ts`), so assert English copy.
- Run a single file: `bun run test -- path/to/file.test.tsx`.
