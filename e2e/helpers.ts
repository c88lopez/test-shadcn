import { expect } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// SSR serves interactive-looking HTML before React hydrates. Clicking a button
// (e.g. "Sign in") before hydration triggers a native form submit instead of the
// JS handler. Wait until React has attached to the DOM (it adds `__reactFiber$…`
// / `__reactProps$…` keys on hydration) before interacting.
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const nodes = document.querySelectorAll("button, form, input")
    for (const node of nodes) {
      for (const key in node) {
        if (
          key.startsWith("__reactFiber$") ||
          key.startsWith("__reactProps$")
        ) {
          return true
        }
      }
    }
    return false
  })
}

// Signs in via the login form and waits for the dashboard. Retries the whole
// flow because a cold Vite/SSR load can drop the first click (see auth.setup).
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login")
  await expect(async () => {
    if (new URL(page.url()).pathname !== "/login") return // already signed in
    await waitForHydration(page)
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password").fill(password)
    await page.getByRole("button", { name: "Sign in" }).click()
    await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 })
  }).toPass({ timeout: 60_000 })
}

// Clicks a trigger button and waits for the drawer/dialog to open. The trigger
// can briefly miss a click while the route settles after hydration, so retry.
export async function openDrawer(
  page: Page,
  triggerName: string | RegExp
): Promise<Locator> {
  const trigger = page.getByRole("button", { name: triggerName })
  const dialog = page.getByRole("dialog")
  await expect(async () => {
    await trigger.click()
    await expect(dialog).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 20_000 })
  await waitForDrawerSettled(page, dialog)
  return dialog
}

// Waits for a right-side drawer's slide-in to finish. Interacting mid-animation
// can land a click on the overlay behind the still-moving panel and dismiss the
// drawer, so we poll until its position stops changing.
export async function waitForDrawerSettled(
  page: Page,
  dialog: Locator
): Promise<void> {
  await expect(async () => {
    const a = await dialog.boundingBox()
    await page.waitForTimeout(120)
    const b = await dialog.boundingBox()
    expect(
      a !== null &&
        b !== null &&
        Math.abs(a.x - b.x) < 1 &&
        Math.abs(a.y - b.y) < 1
    ).toBeTruthy()
  }).toPass({ timeout: 5000 })
}

// Picks an option from a shadcn/Radix <Select> by its field label, then waits for
// the dropdown to close so its overlay can't swallow the next interaction.
export async function selectOption(
  page: Page,
  scope: Locator,
  label: string | RegExp,
  optionName: string
): Promise<void> {
  await scope.getByLabel(label).click()
  const option = page.getByRole("option", { name: optionName, exact: true })
  await option.click()
  await option.waitFor({ state: "hidden" })
}

// Selects the first available option of a <Select> by its field label.
export async function selectFirstOption(
  page: Page,
  scope: Locator,
  label: string | RegExp
): Promise<void> {
  await scope.getByLabel(label).click()
  const option = page.getByRole("option").first()
  await option.click()
  await option.waitFor({ state: "hidden" })
}

// A distinct court per Playwright worker so parallel reservation/class tests never
// double-book the same court+time slot.
export function workerCourt(): string {
  const worker = Number(process.env.TEST_WORKER_INDEX ?? 0)
  return `Court ${(worker % 6) + 1}`
}

// Computes the locale date string (matching the calendar's data-day attribute) a
// number of days ahead, optionally skipping Sundays (closed by default).
export function dateKeyAhead(
  page: Page,
  daysAhead: number,
  skipSunday = true
): Promise<string> {
  return page.evaluate(
    (opts) => {
      const d = new Date()
      d.setDate(d.getDate() + opts.daysAhead)
      if (opts.skipSunday) while (d.getDay() === 0) d.setDate(d.getDate() + 1)
      return d.toLocaleDateString()
    },
    { daysAhead, skipSunday }
  )
}

// Opens a labelled date Popover, navigates forward to the day matching `key`,
// selects it, and dismisses the popover. Gating the open on aria-expanded avoids
// re-clicking (toggling closed) a popover that is mid-open.
export async function pickCalendarDay(
  page: Page,
  scope: Locator,
  key: string,
  dateLabel = "Date"
): Promise<void> {
  const dateButton = scope.getByLabel(dateLabel)
  const days = page.locator("[data-day]")
  await expect(async () => {
    if ((await dateButton.getAttribute("aria-expanded")) !== "true") {
      await dateButton.click()
    }
    await expect(days.first()).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 20_000 })

  const target = page.locator(`[data-day="${key}"]`)
  for (let i = 0; i < 18 && (await target.count()) === 0; i++) {
    await page.getByRole("button", { name: /next/i }).click()
  }
  await target.first().click()
  // The calendar doesn't auto-close on select; dismiss it so its overlay doesn't
  // swallow the next field's click.
  await page.keyboard.press("Escape")
  await expect(days.first()).toBeHidden()
}
