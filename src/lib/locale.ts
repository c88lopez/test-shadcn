/**
 * Locale constants shared between the client i18n instance and the server
 * functions that read/write the language cookie. Kept free of `react-i18next`
 * so server-function bundles don't pull in the client i18n runtime.
 */

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]["code"]

export const LOCALE_CODES: Locale[] = SUPPORTED_LOCALES.map((l) => l.code)

export const DEFAULT_LOCALE: Locale = "en"

/** Non-httpOnly so the value is readable during SSR and client hydration. */
export const LOCALE_COOKIE = "lang"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALE_CODES.includes(value as Locale)
}
