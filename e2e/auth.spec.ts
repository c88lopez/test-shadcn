import { test, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

// These run without the saved admin session.
test.use({ storageState: { cookies: [], origins: [] } })

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/reservations")
  await expect(page).toHaveURL(/\/login$/)
})

test("invalid credentials show an error", async ({ page }) => {
  await page.goto("/login")
  await waitForHydration(page)
  await page.getByLabel("Email").fill("admin@club.test")
  await page.getByLabel("Password").fill("definitely-the-wrong-password")
  await page.getByRole("button", { name: "Sign in" }).click()

  await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})
