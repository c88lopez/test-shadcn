import { test, expect } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"
import {
  dateKeyAhead,
  openDrawer,
  pickCalendarDay,
  selectFirstOption,
  selectOption,
  waitForHydration,
  workerCourt,
} from "./helpers"

// A random HH:MM (classes have no opening-hours constraint). Using a unique time
// per scheduled class keeps rows distinguishable — even across CI retries, which
// reuse the database — since the row is located by court + start time.
function uniqueTime(): string {
  const h = 10 + Math.floor(Math.random() * 9) // 10..18
  const m = Math.floor(Math.random() * 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// Schedules a class on a worker-specific court at a given start time.
async function createClass(page: Page, startTime: string): Promise<string> {
  await page.goto("/coaches/classes")
  await waitForHydration(page)

  const court = workerCourt()
  const dialog = await openDrawer(page, "New Class")
  await selectFirstOption(page, dialog, "Coach")
  await selectOption(page, dialog, "Court", court)
  await pickCalendarDay(page, dialog, await dateKeyAhead(page, 2))
  await dialog.getByLabel("Start Time").fill(startTime)
  await selectOption(page, dialog, "Duration", "60 min")
  await dialog.getByRole("button", { name: "Schedule Class" }).click()
  await expect(page.getByText("Class scheduled")).toBeVisible()
  return court
}

// A class has no unique name, so locate its row by court + start time.
function classRow(page: Page, court: string, time: string): Locator {
  return page
    .getByRole("row", { name: new RegExp(court) })
    .filter({ hasText: time })
}

test("schedules a class", async ({ page }) => {
  await createClass(page, "20:00")
})

test("edits a scheduled class", async ({ page }) => {
  const time = uniqueTime()
  const court = await createClass(page, time)

  await page.goto("/coaches/classes")
  await waitForHydration(page)
  const row = classRow(page, court, time)
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Edit" }).click()

  const newTime = uniqueTime()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Start Time").fill(newTime)
  await dialog.getByRole("button", { name: "Save Changes" }).click()
  await expect(page.getByText("Class updated")).toBeVisible()

  await page.goto("/coaches/classes")
  await waitForHydration(page)
  await expect(classRow(page, court, newTime).first()).toBeVisible()
})

test("cancels a scheduled class", async ({ page }) => {
  const time = uniqueTime()
  const court = await createClass(page, time)

  await page.goto("/coaches/classes")
  await waitForHydration(page)
  const row = classRow(page, court, time)
  await row.getByRole("button").last().click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click()
  await expect(page.getByText("Class deleted")).toBeVisible()

  await page.goto("/coaches/classes")
  await waitForHydration(page)
  await expect(classRow(page, court, time)).toHaveCount(0)
})
