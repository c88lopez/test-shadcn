import "@testing-library/jest-dom/vitest"
// Initialize the i18n singleton so `useTranslation().t` returns real strings in
// component tests instead of raw keys. The app defaults to Spanish, but tests
// assert English copy, so pin the test locale to English for stability.
import i18n from "@/lib/i18n"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

void i18n.changeLanguage("en")

afterEach(() => {
  cleanup()
})

// jsdom polyfills required by Radix UI primitives (dropdown menu, dialog, etc.)
window.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Element.prototype.scrollIntoView = () => {}
Element.prototype.hasPointerCapture = () => false
Element.prototype.releasePointerCapture = () => {}
