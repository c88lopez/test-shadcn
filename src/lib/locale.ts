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

// Spanish by default: the product primarily targets Spanish-speaking clubs.
export const DEFAULT_LOCALE: Locale = "es"

/**
 * Fallback language cookie, used before a club is in scope (e.g. the login
 * page). Non-httpOnly so the value is readable during SSR and client hydration.
 */
export const LOCALE_COOKIE = "lang"

/**
 * Language is a per-club setting: each club's chosen locale is stored in its own
 * cookie (`lang_<clubId>`) so switching clubs switches the language, and SSR can
 * resolve the right locale for the active club. Non-httpOnly, like LOCALE_COOKIE.
 */
export function clubLocaleCookie(clubId: string): string {
  return `lang_${clubId}`
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALE_CODES.includes(value as Locale)
}
