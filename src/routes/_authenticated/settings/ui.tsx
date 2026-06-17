import { useState } from "react"
import {
  createFileRoute,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router"
import {
  IconCheck,
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ACCENT_COLORS,
  applyUiSettings,
  DEFAULT_UI_SETTINGS,
  FONT_SIZES,
  loadUiSettings,
  resolveAccent,
  saveClubAccent,
  saveUiSettings,
} from "@/lib/ui-settings"
import type { ThemeMode, UiSettings } from "@/lib/ui-settings"
import i18n from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"
import { setLocale } from "@/lib/i18n.functions"
import { SUPPORTED_LOCALES } from "@/lib/locale"
import type { Locale } from "@/lib/locale"

export const Route = createFileRoute("/_authenticated/settings/ui")({
  component: UiSettingsPage,
})

const themeOptions: {
  value: ThemeMode
  labelKey: TranslationKey
  icon: Icon
}[] = [
  { value: "light", labelKey: "settings.ui.theme.light", icon: IconSun },
  { value: "dark", labelKey: "settings.ui.theme.dark", icon: IconMoon },
  {
    value: "system",
    labelKey: "settings.ui.theme.system",
    icon: IconDeviceDesktop,
  },
]

const fontSizeLabelKeys: Record<string, TranslationKey> = {
  sm: "settings.ui.fontSize.small",
  md: "settings.ui.fontSize.default",
  lg: "settings.ui.fontSize.large",
  xl: "settings.ui.fontSize.extraLarge",
}

function UiSettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { clubContext } = useLoaderData({ from: "/_authenticated" })
  const clubId = clubContext.activeClubId
  const [settings, setSettings] = useState<UiSettings>(() => loadUiSettings())
  // The accent is scoped to the active club; theme/font size stay global.
  const [accent, setAccent] = useState<string>(() =>
    resolveAccent(clubId, loadUiSettings())
  )
  const [activeLocale, setActiveLocale] = useState<Locale>(
    () => i18n.language as Locale
  )

  // Theme / font size — global preferences.
  function update(partial: Partial<UiSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveUiSettings(next)
    applyUiSettings(next, accent)
  }

  // Accent color — saved against the active club only.
  function updateAccent(accentKey: string) {
    setAccent(accentKey)
    if (clubId) {
      saveClubAccent(clubId, accentKey)
    } else {
      const next = { ...settings, accent: accentKey }
      setSettings(next)
      saveUiSettings(next)
    }
    applyUiSettings(settings, accentKey)
  }

  async function changeLanguage(locale: Locale) {
    setActiveLocale(locale)
    await i18n.changeLanguage(locale)
    await setLocale({ data: { locale } })
    // Refresh root context so its resolved locale stays in sync after navigation.
    await router.invalidate()
  }

  function resetDefaults() {
    setSettings(DEFAULT_UI_SETTINGS)
    saveUiSettings(DEFAULT_UI_SETTINGS)
    setAccent(DEFAULT_UI_SETTINGS.accent)
    if (clubId) saveClubAccent(clubId, DEFAULT_UI_SETTINGS.accent)
    applyUiSettings(DEFAULT_UI_SETTINGS, DEFAULT_UI_SETTINGS.accent)
    toast.success(t("settings.ui.resetToast"))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{t("settings.ui.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.ui.description")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetDefaults}>
          {t("common.resetToDefaults")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.ui.language.title")}</CardTitle>
          <CardDescription>
            {t("settings.ui.language.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            {SUPPORTED_LOCALES.map((locale) => {
              const active = activeLocale === locale.code
              return (
                <button
                  key={locale.code}
                  type="button"
                  onClick={() => void changeLanguage(locale.code)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted",
                    active
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                >
                  {active && <IconCheck className="size-4" />}
                  {locale.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.ui.theme.title")}</CardTitle>
          <CardDescription>
            {t("settings.ui.theme.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {themeOptions.map((opt) => {
              const active = settings.theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ theme: opt.value })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted",
                    active
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                >
                  <opt.icon className="size-5" />
                  {t(opt.labelKey)}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.ui.accent.title")}</CardTitle>
          <CardDescription>
            {t("settings.ui.accent.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => {
              const active = accent === color.key
              return (
                <button
                  key={color.key}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  onClick={() => updateAccent(color.key)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-transform hover:scale-105",
                    active &&
                      "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: color.swatch }}
                >
                  {active && (
                    <IconCheck className="size-5 text-white" stroke={3} />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.ui.fontSize.title")}</CardTitle>
          <CardDescription>
            {t("settings.ui.fontSize.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 sm:max-w-md">
            {FONT_SIZES.map((size) => {
              const active = settings.fontSize === size.key
              return (
                <button
                  key={size.key}
                  type="button"
                  onClick={() => update({ fontSize: size.key })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-4 transition-colors hover:bg-muted",
                    active
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                >
                  <span className="font-semibold" style={{ fontSize: size.px }}>
                    A
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(fontSizeLabelKeys[size.key])}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
