import { test as setup, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

// Signs in as the seeded admin once and persists the session so the rest of the
// suite starts authenticated (Playwright's recommended auth pattern).
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@club.test"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234"
const authFile = "e2e/.auth/admin.json"

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login")

  // The E2E server is a Vite dev server; on a cold cache the first browser load
  // can trigger a dep-optimization full-reload that swallows the click. Retry the
  // whole sign-in until the dashboard loads so the suite isn't flaky on a fresh
  // cache (notably the first local run and every CI run).
  await expect(async () => {
    if (new URL(page.url()).pathname !== "/login") return // already authenticated
    await waitForHydration(page)
    await page.getByLabel("Email").fill(ADMIN_EMAIL)
    await page.getByLabel("Password").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: "Sign in" }).click()
    await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 })
  }).toPass({ timeout: 60_000 })

  await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0)
  await page.context().storageState({ path: authFile })
})
