import i18n from "i18next"
import type { ParseKeys } from "i18next"
import { initReactI18next } from "react-i18next"
import { en } from "@/locales/en"
import { es } from "@/locales/es"
import { DEFAULT_LOCALE } from "@/lib/locale"

export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const

// Single module-level instance. Resources are bundled (synchronous), so there is
// no async loading and `useTranslation` renders the right strings as soon as
// `i18n.language` is set — which the root route does from the `lang` cookie
// before the tree renders, keeping SSR and the client hydration in sync.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation"
    resources: {
      translation: typeof en
    }
  }
}

/** Union of every valid translation key, for typing dynamic `t(key)` calls. */
export type TranslationKey = ParseKeys

export default i18n
