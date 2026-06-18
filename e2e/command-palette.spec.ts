import { test, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

test("opens with the keyboard shortcut and navigates", async ({ page }) => {
  await page.goto("/")
  await waitForHydration(page)

  // The palette attaches its Ctrl/Cmd+K listener in a useEffect, which can run
  // just after hydration — so the first keypress may race it. Retry until the
  // palette opens. (The handler toggles, but once open the assertion passes and
  // the retry stops, so we never toggle it back closed.)
  const input = page.getByPlaceholder("Jump to a page...")
  await expect(async () => {
    await page.keyboard.press("Control+KeyK")
    await expect(input).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })

  // Filter to a single result and pick it with Enter.
  await input.fill("Players")
  await input.press("Enter")
  await expect(page).toHaveURL(/\/players$/)
})
