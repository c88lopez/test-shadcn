import { test, expect } from "@playwright/test"
import { loginAs, waitForHydration } from "./helpers"

// The Coach role (seeded as laura@padelclub.es) only has `coaches:manage`. These
// tests sign in fresh as the coach instead of reusing the admin storage state.
test.use({ storageState: { cookies: [], origins: [] } })

const COACH_EMAIL = "laura@padelclub.es"
const COACH_PASSWORD = "padel1234"

test("coach cannot create players or reservations", async ({ page }) => {
  await loginAs(page, COACH_EMAIL, COACH_PASSWORD)

  await page.goto("/players")
  await waitForHydration(page)
  await expect(page.getByRole("button", { name: "New Player" })).toHaveCount(0)

  await page.goto("/reservations")
  await waitForHydration(page)
  await expect(
    page.getByRole("button", { name: "New Reservation" })
  ).toHaveCount(0)
})

test("coach only sees appearance settings", async ({ page }) => {
  await loginAs(page, COACH_EMAIL, COACH_PASSWORD)

  // Without `settings:manage`, /settings redirects to the appearance (UI) tab.
  await page.goto("/settings")
  await page.waitForURL(/\/settings\/ui$/)
  await expect(page).toHaveURL(/\/settings\/ui$/)
})

test("coach belonging to one club has no club switcher", async ({ page }) => {
  await loginAs(page, COACH_EMAIL, COACH_PASSWORD)
  await page.goto("/")
  await waitForHydration(page)

  // The club is shown as static branding (a div), not an interactive switcher,
  // when the user can access only one club.
  await expect(page.getByText("Default Club")).toBeVisible()
  await expect(page.getByRole("button", { name: /Default Club/ })).toHaveCount(
    0
  )
})
