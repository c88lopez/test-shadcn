import { test, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

test("opens with the keyboard shortcut and navigates", async ({ page }) => {
  await page.goto("/")
  await waitForHydration(page)

  // The palette listens for Ctrl+K or Cmd+K; Control works on every platform.
  await page.keyboard.press("Control+KeyK")
  const input = page.getByPlaceholder("Jump to a page...")
  await expect(input).toBeVisible()

  // Filter to a single result and pick it with Enter.
  await input.fill("Players")
  await input.press("Enter")
  await expect(page).toHaveURL(/\/players$/)
})
