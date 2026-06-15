import { test, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

// Language is stored in a per-context cookie, so switching here never leaks into
// other tests (each test gets a fresh context from the admin storage state).
test("switches the app language to Spanish and back", async ({ page }) => {
  await page.goto("/settings/ui")
  await waitForHydration(page)

  const resetButton = page.getByRole("button", { name: "Reset to defaults" })
  await expect(resetButton).toBeVisible()

  await page.getByRole("button", { name: "Español" }).click()
  await expect(
    page.getByRole("button", { name: "Restablecer valores predeterminados" })
  ).toBeVisible()

  await page.getByRole("button", { name: "English" }).click()
  await expect(
    page.getByRole("button", { name: "Reset to defaults" })
  ).toBeVisible()
})
