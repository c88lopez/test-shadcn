import { test as setup, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

// Signs in as the seeded admin once and persists the session so the rest of the
// suite starts authenticated (Playwright's recommended auth pattern).
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@club.test"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234"
const authFile = "e2e/.auth/admin.json"

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login")
  await waitForHydration(page)
  await page.getByLabel("Email").fill(ADMIN_EMAIL)
  await page.getByLabel("Password").fill(ADMIN_PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()

  // Successful login navigates to the dashboard.
  await page.waitForURL("/")
  await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0)

  await page.context().storageState({ path: authFile })
})
