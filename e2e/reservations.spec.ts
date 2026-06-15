import { test, expect } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"
import {
  dateKeyAhead,
  pickCalendarDay,
  selectOption,
  waitForDrawerSettled,
  waitForHydration,
  workerCourt,
} from "./helpers"

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
  await waitForDrawerSettled(page, dialog)
  return dialog
}

// Picks an open (non-Sunday) date a couple of days out.
async function pickOpenDate(page: Page, dialog: Locator): Promise<void> {
  await pickCalendarDay(page, dialog, await dateKeyAhead(page, 2))
}

let bookingSeq = 0

// Fills the New Reservation drawer and submits. Court is per-worker and the hour
// rotates per call so parallel/serial bookings never collide on a slot. Returns
// the player name used (unique unless one is supplied).
async function createReservation(
  page: Page,
  opts: { hour?: string; player?: string } = {}
): Promise<string> {
  const dialog = await openNewReservation(page)
  const player =
    opts.player ?? `E2E Rsv ${Date.now()}-${Math.floor(Math.random() * 1e4)}`
  const hour = opts.hour ?? String(9 + (bookingSeq++ % 13)).padStart(2, "0")

  await dialog.getByLabel("Player").fill(player)
  await selectOption(page, dialog, "Court", workerCourt())
  await pickOpenDate(page, dialog)
  await dialog.getByLabel("Start Time").fill(`${hour}:00`)
  await selectOption(page, dialog, "Duration", "1 hour")
  await selectOption(page, dialog, "Payment", "Paid")
  await dialog.getByRole("button", { name: "Create Reservation" }).click()
  return player
}

test("creates a reservation within opening hours", async ({ page }) => {
  await createReservation(page)
  await expect(page.getByText("Reservation created")).toBeVisible()
})

test("rejects a booking outside opening hours", async ({ page }) => {
  // 06:00 is before the default 08:00 opening time → server should reject.
  await createReservation(page, { hour: "06" })
  await expect(page.getByText(/outside opening hours/i)).toBeVisible()
})

test("rejects a booking on a closed day", async ({ page }) => {
  const dialog = await openNewReservation(page)
  await dialog.getByLabel("Player").fill(`E2E Closed ${Date.now()}`)
  await selectOption(page, dialog, "Court", workerCourt())
  // The next Sunday — closed by default.
  const sundayKey = await page.evaluate(() => {
    const d = new Date()
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
    return d.toLocaleDateString()
  })
  await pickCalendarDay(page, dialog, sundayKey)
  await dialog.getByLabel("Start Time").fill("10:00")
  await selectOption(page, dialog, "Duration", "1 hour")
  await selectOption(page, dialog, "Payment", "Paid")
  await dialog.getByRole("button", { name: "Create Reservation" }).click()

  await expect(page.getByText(/closed on that day/i)).toBeVisible()
})

test("rejects a booking too far in advance", async ({ page }) => {
  const dialog = await openNewReservation(page)
  await dialog.getByLabel("Player").fill(`E2E Far ${Date.now()}`)
  await selectOption(page, dialog, "Court", workerCourt())
  // 45 days ahead is beyond the default 30-day max-advance window.
  await pickCalendarDay(page, dialog, await dateKeyAhead(page, 45))
  await dialog.getByLabel("Start Time").fill("10:00")
  await selectOption(page, dialog, "Duration", "1 hour")
  await selectOption(page, dialog, "Payment", "Paid")
  await dialog.getByRole("button", { name: "Create Reservation" }).click()

  await expect(page.getByText(/more than 30 days ahead/i)).toBeVisible()
})

test("enforces the per-player booking limit", async ({ page }) => {
  const player = `E2E Limit ${Date.now()}-${Math.floor(Math.random() * 1e4)}`
  // Default limit is 2 upcoming bookings per player.
  await createReservation(page, { player })
  await expect(page.getByText("Reservation created")).toBeVisible()
  await createReservation(page, { player })
  await expect(page.getByText("Reservation created")).toBeVisible()

  // The third booking for the same player must be rejected.
  await createReservation(page, { player })
  await expect(page.getByText(/per-player limit/i)).toBeVisible()
})

test("edits a reservation", async ({ page }) => {
  const player = await createReservation(page)
  await expect(page.getByText("Reservation created")).toBeVisible()

  await page.getByPlaceholder("Search reservations...").fill(player)
  const row = page.getByRole("row", { name: new RegExp(player) })
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Edit" }).click()

  const dialog = page.getByRole("dialog")
  const updated = `${player} edited`
  await dialog.getByLabel("Player").fill(updated)
  await dialog.getByRole("button", { name: "Save Changes" }).click()
  await expect(page.getByText("Reservation updated")).toBeVisible()

  // Verify on a fresh load: the edit drawer's auto-close can be cancelled by the
  // post-save reload, leaving the (modal) drawer open and the table aria-hidden.
  await page.goto("/reservations")
  await waitForHydration(page)
  await page.getByPlaceholder("Search reservations...").fill(updated)
  await expect(
    page.getByRole("cell", { name: updated, exact: true })
  ).toBeVisible()
})

test("cancels a reservation", async ({ page }) => {
  const player = await createReservation(page)
  await expect(page.getByText("Reservation created")).toBeVisible()

  await page.getByPlaceholder("Search reservations...").fill(player)
  const row = page.getByRole("row", { name: new RegExp(player) })
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click()

  await expect(page.getByText("Reservation deleted")).toBeVisible()
})
