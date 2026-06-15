import { test, expect } from "@playwright/test"
import {
  dateKeyAhead,
  openDrawer,
  pickCalendarDay,
  selectFirstOption,
  selectOption,
  waitForHydration,
  workerCourt,
} from "./helpers"

test("schedules a class", async ({ page }) => {
  await page.goto("/coaches/classes")
  await waitForHydration(page)

  const dialog = await openDrawer(page, "New Class")
  await selectFirstOption(page, dialog, "Coach")
  await selectOption(page, dialog, "Court", workerCourt())
  await pickCalendarDay(page, dialog, await dateKeyAhead(page, 2))
  await dialog.getByLabel("Start Time").fill("20:00")
  await selectOption(page, dialog, "Duration", "60 min")
  await dialog.getByRole("button", { name: "Schedule Class" }).click()

  await expect(page.getByText("Class scheduled")).toBeVisible()
})
