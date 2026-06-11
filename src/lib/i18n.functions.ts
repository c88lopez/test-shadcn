import { createServerFn } from "@tanstack/react-start"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import { z } from "zod"
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_CODES,
  LOCALE_COOKIE,
} from "@/lib/locale"
import type { Locale } from "@/lib/locale"

/** Reads the persisted language from the cookie, defaulting to English. */
export const getLocale = createServerFn({ method: "GET" }).handler(
  (): Locale => {
    const value = getCookie(LOCALE_COOKIE)
    return isLocale(value) ? value : DEFAULT_LOCALE
  }
)

const setLocaleInput = z.object({
  locale: z.enum(LOCALE_CODES as [Locale, ...Locale[]]),
})

/** Persists the chosen language so SSR renders in it on the next request. */
export const setLocale = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setLocaleInput.parse(data))
  .handler(({ data }) => {
    setCookie(LOCALE_COOKIE, data.locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    })
    return { locale: data.locale }
  })
