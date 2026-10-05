import { test, expect } from "@playwright/test"
import { waitForHydration } from "./helpers"

test("assistant panel overlays the page and survives navigation", async ({
  page,
}) => {
  await page.goto("/")
  await waitForHydration(page)

  const panel = page.getByRole("dialog", { name: "AI Assistant" })
  await page.getByRole("button", { name: "Open AI assistant" }).click()
  await expect(panel).toBeVisible()

  // Non-modal: the page behind stays interactive while the panel is open.
  const draft = "players under 30"
  await panel.getByPlaceholder("Ask the assistant…").fill(draft)
  await page.getByRole("link", { name: "Players" }).first().click()
  await expect(page).toHaveURL(/\/players$/)

  await expect(panel).toBeVisible()
  await expect(panel.getByPlaceholder("Ask the assistant…")).toHaveValue(draft)

  await panel.getByRole("button", { name: "Close assistant" }).click()
  await expect(panel).toBeHidden()
})
