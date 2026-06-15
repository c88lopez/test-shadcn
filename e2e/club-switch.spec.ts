import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { waitForHydration } from "./helpers"

// The admin is seeded as a member of both "Default Club" and "North Branch".
// Switching sets an http-only cookie on this test's context only (each test gets
// a fresh context from storageState), so it never leaks to other tests.

// A player seeded only into Default Club — used to prove tenant scoping.
const DEFAULT_PLAYER = "Carlos López"

// Opens the sidebar club switcher (its trigger shows the active club name) and
// selects another club, waiting for the brand to reflect the change.
async function switchClub(
  page: Page,
  fromName: string,
  toName: string
): Promise<void> {
  await page
    .getByRole("button", { name: new RegExp(fromName) })
    .first()
    .click()
  await page.getByRole("menuitem", { name: toName }).click()
  await expect(
    page.getByRole("button", { name: new RegExp(toName) }).first()
  ).toBeVisible()
}

test("lists every accessible club in the switcher", async ({ page }) => {
  await page.goto("/")
  await waitForHydration(page)

  await page
    .getByRole("button", { name: /Default Club/ })
    .first()
    .click()
  await expect(
    page.getByRole("menuitem", { name: "Default Club" })
  ).toBeVisible()
  await expect(
    page.getByRole("menuitem", { name: "North Branch" })
  ).toBeVisible()
})

test("switching clubs rescopes tenant data", async ({ page }) => {
  await page.goto("/players")
  await waitForHydration(page)

  // Default Club has the seeded roster.
  await page.getByPlaceholder("Search players...").fill(DEFAULT_PLAYER)
  await expect(
    page.getByRole("cell", { name: DEFAULT_PLAYER, exact: true })
  ).toBeVisible()

  // Switch to North Branch — a separate tenant with no players.
  await switchClub(page, "Default Club", "North Branch")
  await page.goto("/players")
  await waitForHydration(page)
  await page.getByPlaceholder("Search players...").fill(DEFAULT_PLAYER)
  await expect(
    page.getByRole("cell", { name: DEFAULT_PLAYER, exact: true })
  ).toHaveCount(0)

  // Switching back restores the Default Club's data.
  await switchClub(page, "North Branch", "Default Club")
  await page.goto("/players")
  await waitForHydration(page)
  await page.getByPlaceholder("Search players...").fill(DEFAULT_PLAYER)
  await expect(
    page.getByRole("cell", { name: DEFAULT_PLAYER, exact: true })
  ).toBeVisible()
})

test("changing a club's accent updates its sidebar brand color", async ({
  page,
}) => {
  await page.goto("/settings/ui")
  await waitForHydration(page)

  // The active club's brand avatar in the sidebar carries an inline background
  // color from the club's accent (initials "DC" for Default Club).
  const trigger = page.getByRole("button", { name: /Default Club/ }).first()
  const avatar = trigger.getByText("DC", { exact: true })
  const avatarBg = () =>
    avatar.evaluate((el) => getComputedStyle(el).backgroundColor)

  // The "Blue" accent swatch (see ACCENT_COLORS) — resolve it to the rgb the
  // browser actually renders so the comparison is exact and engine-agnostic.
  const expectedBlue = await page.evaluate((swatch) => {
    const probe = document.createElement("div")
    probe.style.backgroundColor = swatch
    document.body.appendChild(probe)
    const value = getComputedStyle(probe).backgroundColor
    probe.remove()
    return value
  }, "oklch(0.546 0.183 262.9)")

  const before = await avatarBg()
  expect(before).not.toBe(expectedBlue)

  await page.getByRole("button", { name: "Blue" }).click()

  // The brand re-reads the accent on the `ui-accent-changed` event and recolors.
  await expect.poll(avatarBg).toBe(expectedBlue)
})
