import { test, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

test("dashboard renders its overview and today's reservations", async ({
  page,
}) => {
  await page.goto("/")
  await waitForHydration(page)

  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 })
  ).toBeVisible()
  await expect(page.getByText("Current occupancy")).toBeVisible()
  await expect(page.getByText("Today's Reservations")).toBeVisible()
  // The per-day chart card is the heaviest server-computed section; if stats
  // failed to load this heading wouldn't render.
  await expect(page.getByText("Reservations this week")).toBeVisible()
})
