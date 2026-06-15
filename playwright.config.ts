import { defineConfig, devices } from "@playwright/test"

// E2E runs on its own port + database so it never touches your dev server (3003)
// or dev DB. The app reads `DATABASE_URL` from the environment (injected below),
// which wins over `.env`, so the E2E server talks to a disposable database.
const PORT = 3100
const baseURL = `http://localhost:${PORT}`

// CI sets DATABASE_URL to its throwaway Postgres service; locally we default to a
// dedicated `padel_e2e` database that `pretest:e2e*` recreates from scratch.
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5544/padel_e2e"

// A fixed secret keeps E2E sessions self-consistent and independent of `.env`
// (password hashing doesn't depend on it, so the seeded admin still logs in).
const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "e2e-secret-not-for-production"

// E2E tests drive the real app (SSR + Postgres + Better Auth). Playwright starts a
// dedicated *production* server (`vite build` + Nitro node output). Using the prod
// build instead of a second Vite dev server avoids the full-reload loop that two
// concurrent dev servers cause (see CLAUDE.md), and is closer to real prod.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Cap local parallelism: all workers share one app server, so too many
  // concurrent contexts slow responses and cause UI races.
  workers: process.env.CI ? 1 : 4,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"]],
  use: {
    baseURL,
    locale: "en-US",
    timezoneId: "Europe/Madrid",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Logs in once and saves the session; other specs reuse it.
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "bun run build && node .output/server/index.mjs",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      PORT: String(PORT),
      DATABASE_URL,
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET,
    },
  },
})
