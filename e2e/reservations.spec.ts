import { test, expect } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"
import { waitForHydration } from "./helpers"

// Opens the reservations page and the "New Reservation" drawer; returns the
// drawer dialog locator.
async function openNewReservation(page: Page): Promise<Locator> {
  await page.goto("/reservations")
  await waitForHydration(page)
  const trigger = page.getByRole("button", { name: "New Reservation" })
  const dialog = page.getByRole("dialog")
  // The drawer trigger can briefly miss a click while the route settles after
  // hydration; retry until the drawer is actually open.
  await expect(async () => {
    await trigger.click()
    await expect(dialog.getByLabel("Player")).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 20_000 })
  return dialog
}

// Picks an open (non-Sunday — Sundays are closed by default) date a couple of
// days out via the calendar popover. The day buttons expose the locale date
// string in `data-day`, which is a stable selector regardless of layout.
async function pickOpenDate(page: Page, dialog: Locator): Promise<void> {
  const key = await page.evaluate(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    while (d.getDay() === 0) d.setDate(d.getDate() + 1)
    return d.toLocaleDateString()
  })
  await dialog.getByLabel("Date").click()
  let cell = page.locator(`[data-day="${key}"]`)
  if ((await cell.count()) === 0) {
    await page.getByRole("button", { name: /next/i }).click()
    cell = page.locator(`[data-day="${key}"]`)
  }
  await cell.first().click()
}

// Picks an option from a shadcn/Radix <Select> by its field label.
async function selectOption(
  page: Page,
  dialog: Locator,
  label: string,
  optionName: string
): Promise<void> {
  await dialog.getByLabel(label).click()
  await page.getByRole("option", { name: optionName, exact: true }).click()
}

test("creates a reservation within opening hours", async ({ page }) => {
  const dialog = await openNewReservation(page)
  // Vary court/time so local re-runs don't collide on the same slot.
  const court = `Court ${1 + Math.floor(Math.random() * 6)}`
  const hour = String(9 + Math.floor(Math.random() * 9)).padStart(2, "0")

  await dialog.getByLabel("Player").fill(`E2E Player ${Date.now()}`)
  await selectOption(page, dialog, "Court", court)
  await pickOpenDate(page, dialog)
  await dialog.getByLabel("Start Time").fill(`${hour}:00`)
  await selectOption(page, dialog, "Duration", "1 hour")
  await selectOption(page, dialog, "Payment", "Paid")

  await dialog.getByRole("button", { name: "Create Reservation" }).click()

  await expect(page.getByText("Reservation created")).toBeVisible()
})

test("rejects a booking outside opening hours", async ({ page }) => {
  const dialog = await openNewReservation(page)

  await dialog.getByLabel("Player").fill(`E2E Early ${Date.now()}`)
  await selectOption(page, dialog, "Court", "Court 2")
  await pickOpenDate(page, dialog)
  // 06:00 is before the default 08:00 opening time → server should reject.
  await dialog.getByLabel("Start Time").fill("06:00")
  await selectOption(page, dialog, "Duration", "1 hour")
  await selectOption(page, dialog, "Payment", "Paid")

  await dialog.getByRole("button", { name: "Create Reservation" }).click()

  await expect(page.getByText(/outside opening hours/i)).toBeVisible()
})
