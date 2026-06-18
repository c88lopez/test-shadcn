import { readFileSync } from "node:fs"
import { test, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

test("exports a data table to CSV", async ({ page }) => {
  await page.goto("/players")
  await waitForHydration(page)

  await page.getByRole("button", { name: "Export" }).click()
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Export as CSV" }).click(),
  ])

  expect(download.suggestedFilename()).toMatch(
    /^export-\d{4}-\d{2}-\d{2}\.csv$/
  )

  const path = await download.path()
  const header = readFileSync(path, "utf8").split("\n")[0]
  expect(header).toContain("Full Name")
})
