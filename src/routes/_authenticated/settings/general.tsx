import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { toast } from "sonner"
import { ensurePermission } from "@/lib/route-guards"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  DEFAULT_APP_SETTINGS,
  setAppSettings,
  TIMEZONES,
  useAppSettings,
} from "@/lib/app-settings"
import type { GeneralSettings, TimeFormat, WeekStart } from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/settings/general")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "settings:manage"),
  component: GeneralSettingsPage,
})

function buildTimeFormats(
  t: TFunction
): { value: TimeFormat; label: string }[] {
  return [
    { value: "24h", label: t("settings.general.timeFormat24") },
    { value: "12h", label: t("settings.general.timeFormat12") },
  ]
}

function buildWeekStarts(t: TFunction): { value: WeekStart; label: string }[] {
  return [
    { value: "monday", label: t("settings.general.weekStartMonday") },
    { value: "sunday", label: t("settings.general.weekStartSunday") },
  ]
}

function GeneralSettingsPage() {
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { general } = settings
  const timeFormats = useMemo(() => buildTimeFormats(t), [t])
  const weekStarts = useMemo(() => buildWeekStarts(t), [t])

  function update(partial: Partial<GeneralSettings>) {
    setAppSettings({ ...settings, general: { ...general, ...partial } })
  }

  function reset() {
    setAppSettings({ ...settings, general: DEFAULT_APP_SETTINGS.general })
    toast.success(t("settings.general.resetToast"))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{t("settings.general.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.general.description")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          {t("common.resetToDefaults")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.general.clubProfile.title")}</CardTitle>
          <CardDescription>
            {t("settings.general.clubProfile.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="clubName">{t("settings.general.clubName")}</Label>
            <Input
              id="clubName"
              value={general.clubName}
              onChange={(e) => update({ clubName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clubInitials">
              {t("settings.general.logoInitials")}
            </Label>
            <Input
              id="clubInitials"
              maxLength={3}
              value={general.clubInitials}
              onChange={(e) =>
                update({ clubInitials: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address">{t("settings.general.address")}</Label>
            <Input
              id="address"
              placeholder={t("settings.general.addressPlaceholder")}
              value={general.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">{t("fields.phone")}</Label>
            <Input
              id="phone"
              value={general.phone}
              onChange={(e) => update({ phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input
              id="email"
              type="email"
              value={general.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.general.regional.title")}</CardTitle>
          <CardDescription>
            {t("settings.general.regional.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t("settings.general.timezone")}</Label>
            <Select
              value={general.timezone}
              onValueChange={(v) => update({ timezone: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("settings.general.timeFormat")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {timeFormats.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ timeFormat: opt.value })}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted",
                    general.timeFormat === opt.value
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("settings.general.weekStart")}</Label>
            <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
              {weekStarts.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ weekStart: opt.value })}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted",
                    general.weekStart === opt.value
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
