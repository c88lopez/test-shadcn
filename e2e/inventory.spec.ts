import { test, expect } from "@playwright/test"
import { openDrawer, selectOption, waitForHydration } from "./helpers"

test("creates a stock item", async ({ page }) => {
  await page.goto("/inventory")
  await waitForHydration(page)

  const name = `E2E Item ${Date.now()}-${Math.floor(Math.random() * 1e4)}`
  const dialog = await openDrawer(page, "New Item")
  await dialog.getByLabel("Product Name").fill(name)
  await selectOption(page, dialog, "Category", "Drinks")
  // The price label includes the currency symbol, e.g. "Price ($)".
  await dialog.getByLabel(/^Price/).fill("9.50")
  await dialog.getByLabel("Stock").fill("25")
  await dialog.getByRole("button", { name: "Add Item" }).click()

  await expect(page.getByText("Item created")).toBeVisible()

  // Verify on a fresh load (the drawer is modal and may briefly stay open after
  // save); filter to the new item since the table paginates at 10 rows.
  await page.goto("/inventory")
  await waitForHydration(page)
  await page.getByPlaceholder("Search products...").fill(name)
  await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
})
