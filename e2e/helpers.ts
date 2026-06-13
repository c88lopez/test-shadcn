import type { Page } from "@playwright/test"

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
