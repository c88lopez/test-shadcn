import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { waitForHydration } from "./helpers"

// Chromium's fake microphone stands in for a real device, and /api/transcribe
// is stubbed so the suite never calls AI Gateway.
test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  },
})

async function openAssistant(page: Page) {
  await page.goto("/")
  await waitForHydration(page)
  await page.getByRole("button", { name: "Open AI assistant" }).click()
  const panel = page.getByRole("dialog", { name: "AI Assistant" })
  await expect(panel).toBeVisible()
  return panel
}

test("voice input transcribes into the composer without sending", async ({
  page,
}) => {
  let uploads = 0
  await page.route("**/api/transcribe", async (route) => {
    uploads++
    expect(route.request().postData()).toContain('name="audio"')
    await route.fulfill({ json: { text: "under 30 with a phone" } })
  })

  const panel = await openAssistant(page)
  const input = panel.getByPlaceholder("Ask the assistant…")
  await input.fill("players")

  await panel.getByRole("button", { name: "Record a voice message" }).click()
  await expect(panel.getByRole("status")).toContainText("Recording")
  await page.waitForTimeout(1200)
  await panel.getByRole("button", { name: "Stop recording" }).click()

  // The transcript is appended for the user to review; nothing is sent.
  await expect(input).toHaveValue("players under 30 with a phone")
  expect(uploads).toBe(1)
  await expect(panel.getByText("You", { exact: true })).toHaveCount(0)
})

test("cancelling a recording discards it", async ({ page }) => {
  let uploads = 0
  await page.route("**/api/transcribe", async (route) => {
    uploads++
    await route.fulfill({ json: { text: "should not appear" } })
  })

  const panel = await openAssistant(page)
  await panel.getByRole("button", { name: "Record a voice message" }).click()
  await expect(panel.getByRole("status")).toContainText("Recording")
  await panel.getByRole("button", { name: "Cancel" }).click()

  await expect(panel.getByRole("status")).toHaveCount(0)
  await expect(
    panel.getByRole("button", { name: "Record a voice message" })
  ).toBeEnabled()
  await expect(panel.getByPlaceholder("Ask the assistant…")).toHaveValue("")
  expect(uploads).toBe(0)
})
