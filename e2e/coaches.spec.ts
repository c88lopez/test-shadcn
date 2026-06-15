import { test, expect } from "@playwright/test"
import { openDrawer, waitForHydration } from "./helpers"

test("creates and deletes a coach", async ({ page }) => {
  await page.goto("/coaches")
  await waitForHydration(page)

  const name = `E2E Coach ${Date.now()}-${Math.floor(Math.random() * 1e4)}`
  const dialog = await openDrawer(page, "New Coach")
  await dialog.getByLabel("Full Name").fill(name)
  await dialog.getByLabel("Phone").fill("+34 600 222 333")
  await dialog.getByRole("button", { name: "Add Coach" }).click()
  await expect(page.getByText("Coach created")).toBeVisible()

  // Delete on a fresh load (the modal drawer may briefly linger after save).
  await page.goto("/coaches")
  await waitForHydration(page)
  await page.getByPlaceholder("Search coaches...").fill(name)
  const row = page.getByRole("row", { name: new RegExp(name) })
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click()

  await expect(page.getByText("Coach deleted")).toBeVisible()
})
