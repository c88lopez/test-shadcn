import { createServerFn } from "@tanstack/react-start"
import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server"
import { z } from "zod"
import {
  clubLocaleCookie,
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_CODES,
  LOCALE_COOKIE,
} from "@/lib/locale"
import type { Locale } from "@/lib/locale"
import { auth } from "@/lib/auth"
import { resolveActiveClubId } from "@/lib/auth.server"

/**
 * Best-effort resolution of the active club for the current request. Unlike the
 * `requireClubId` helpers this never throws — language must still resolve on the
 * login page and other unauthenticated routes (falling back to the global
 * cookie), so callers treat `null` as "no club in scope".
 */
async function activeClubId(): Promise<string | null> {
  try {
    const { headers } = getRequest()
    const session = await auth.api.getSession({ headers })
    if (!session || session.user.status === "archived") return null
    return await resolveActiveClubId(session.user)
  } catch {
    return null
  }
}

/**
 * Reads the persisted language for the active club, defaulting to English.
 * Language is a per-club setting: each club has its own cookie, so switching
 * clubs switches the language. Falls back to the global cookie only when there
 * is no active club (e.g. the login page).
 */
export const getLocale = createServerFn({ method: "GET" }).handler(
  async (): Promise<Locale> => {
    const clubId = await activeClubId()
    if (clubId) {
      const value = getCookie(clubLocaleCookie(clubId))
      return isLocale(value) ? value : DEFAULT_LOCALE
    }
    const value = getCookie(LOCALE_COOKIE)
    return isLocale(value) ? value : DEFAULT_LOCALE
  }
)

const setLocaleInput = z.object({
  locale: z.enum(LOCALE_CODES as [Locale, ...Locale[]]),
})

/**
 * Persists the chosen language for the active club so SSR renders in it on the
 * next request. With no active club in scope, persists the global fallback.
 */
export const setLocale = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setLocaleInput.parse(data))
  .handler(async ({ data }) => {
    const clubId = await activeClubId()
    setCookie(clubId ? clubLocaleCookie(clubId) : LOCALE_COOKIE, data.locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    })
    return { locale: data.locale }
  })
