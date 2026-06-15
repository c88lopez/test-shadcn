import { test, expect } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"
import { openDrawer, selectOption, waitForHydration } from "./helpers"

// Creates a player through the drawer and returns its unique name so the caller
// can filter to / act on the resulting row.
async function createPlayer(page: Page): Promise<string> {
  const name = `E2E Player ${Date.now()}-${Math.floor(Math.random() * 1e4)}`
  const dialog = await openDrawer(page, "New Player")
  await dialog.getByLabel("Full Name").fill(name)
  await dialog.getByLabel("Email").fill(`p${Date.now()}@e2e.test`)
  await dialog.getByLabel("Phone").fill("+34 600 111 222")
  await dialog.getByLabel("Age").fill("28")
  await selectOption(page, dialog, "Gender", "Male")
  await selectOption(page, dialog, "Category", "C4")
  await dialog.getByRole("button", { name: "Add Player" }).click()
  await expect(page.getByText("Player created")).toBeVisible()
  return name
}

// Opens /players fresh, filters by unique text (the table paginates at 10 rows),
// and returns the matching row. A fresh load avoids a lingering modal drawer
// (whose auto-close can be cancelled by the post-save reload) hiding the table.
async function findRow(page: Page, text: string): Promise<Locator> {
  await page.goto("/players")
  await waitForHydration(page)
  await page.getByPlaceholder("Search players...").fill(text)
  return page.getByRole("row", { name: new RegExp(text) })
}

test("creates a player", async ({ page }) => {
  await page.goto("/players")
  await waitForHydration(page)
  const name = await createPlayer(page)
  await findRow(page, name)
  await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
})

test("edits a player", async ({ page }) => {
  await page.goto("/players")
  await waitForHydration(page)
  const name = await createPlayer(page)

  const row = await findRow(page, name)
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Edit" }).click()

  const dialog = page.getByRole("dialog")
  const updated = `${name} edited`
  await dialog.getByLabel("Full Name").fill(updated)
  await dialog.getByRole("button", { name: "Save Changes" }).click()
  await expect(page.getByText("Player updated")).toBeVisible()

  await findRow(page, updated)
  await expect(
    page.getByRole("cell", { name: updated, exact: true })
  ).toBeVisible()
})

test("deletes a player", async ({ page }) => {
  await page.goto("/players")
  await waitForHydration(page)
  const name = await createPlayer(page)

  const row = await findRow(page, name)
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click()
  await expect(page.getByText("Player deleted")).toBeVisible()

  await findRow(page, name)
  await expect(page.getByRole("cell", { name, exact: true })).toHaveCount(0)
})
