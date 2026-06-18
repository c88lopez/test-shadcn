import { test, expect } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"
import { openDrawer, waitForHydration } from "./helpers"

// Creates a coach (no birthday — it's optional) and returns its unique name.
async function createCoach(page: Page): Promise<string> {
  const name = `E2E Coach ${Date.now()}-${Math.floor(Math.random() * 1e4)}`
  const dialog = await openDrawer(page, "New Coach")
  await dialog.getByLabel("Full Name").fill(name)
  await dialog.getByLabel("Phone").fill("+34 600 222 333")
  await dialog.getByRole("button", { name: "Add Coach" }).click()
  await expect(page.getByText("Coach created")).toBeVisible()
  return name
}

async function findRow(page: Page, name: string): Promise<Locator> {
  await page.goto("/coaches")
  await waitForHydration(page)
  await page.getByPlaceholder("Search coaches...").fill(name)
  return page.getByRole("row", { name: new RegExp(name) })
}

test("creates and deletes a coach", async ({ page }) => {
  await page.goto("/coaches")
  await waitForHydration(page)
  const name = await createCoach(page)

  const row = await findRow(page, name)
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click()
  await expect(page.getByText("Coach deleted")).toBeVisible()
})

test("edits a coach", async ({ page }) => {
  await page.goto("/coaches")
  await waitForHydration(page)
  const name = await createCoach(page)

  const row = await findRow(page, name)
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Edit" }).click()

  const dialog = page.getByRole("dialog")
  const updated = `${name} edited`
  await dialog.getByLabel("Full Name").fill(updated)
  await dialog.getByRole("button", { name: "Save Changes" }).click()
  await expect(page.getByText("Coach updated")).toBeVisible()

  await findRow(page, updated)
  await expect(
    page.getByRole("cell", { name: updated, exact: true })
  ).toBeVisible()
})

test("creates a coach without a birthday", async ({ page }) => {
  await page.goto("/coaches")
  await waitForHydration(page)
  const name = await createCoach(page)

  // Birthday is optional; the table renders an em dash when it's missing.
  const row = await findRow(page, name)
  await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
  await expect(row.getByRole("cell", { name: "—" }).first()).toBeVisible()
})
