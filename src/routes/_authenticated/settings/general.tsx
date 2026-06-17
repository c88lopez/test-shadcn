import { useEffect, useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { toast } from "sonner"
import { ensurePermission } from "@/lib/route-guards"
import { Button } from "@/components/ui/button"
import {
  SettingsSection,
  SettingsSectionList,
} from "@/components/settings-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
  useAppSettingsHydrated,
} from "@/lib/app-settings"
import type { GeneralSettings, TimeFormat, WeekStart } from "@/lib/app-settings"
import { getClubContext, renameActiveClub } from "@/lib/clubs.functions"

export const Route = createFileRoute("/_authenticated/settings/general")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "settings:manage"),
  loader: async () => {
    const ctx = await getClubContext()
    return { clubName: ctx.activeClubName ?? "" }
  },
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
  const router = useRouter()
  const { clubName: savedClubName } = Route.useLoaderData()
  const settings = useAppSettings()
  // Per-club settings load from localStorage after mount; until then show a
  // skeleton so the inputs don't flash from empty defaults to real values.
  const ready = useAppSettingsHydrated()
  const { general } = settings
  const timeFormats = useMemo(() => buildTimeFormats(t), [t])
  const weekStarts = useMemo(() => buildWeekStarts(t), [t])

  // Club name is stored in the database (shared across users/devices and shown
  // in the sidebar), not in the per-club client settings blob.
  const [clubName, setClubName] = useState(savedClubName)
  useEffect(() => {
    setClubName(savedClubName)
  }, [savedClubName])

  async function saveClubName() {
    const trimmed = clubName.trim()
    if (!trimmed || trimmed === savedClubName) return
    try {
      await renameActiveClub({ data: { name: trimmed } })
      await router.invalidate()
      toast.success(t("settings.general.clubNameSaved"))
    } catch (error) {
      toast.error(t("settings.general.clubNameError"), {
        description:
          error instanceof Error ? error.message : t("common.tryAgain"),
      })
      setClubName(savedClubName)
    }
  }

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

      <SettingsSectionList>
        <SettingsSection
          title={t("settings.general.clubProfile.title")}
          description={t("settings.general.clubProfile.description")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="clubName">{t("settings.general.clubName")}</Label>
              {ready ? (
                <Input
                  id="clubName"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  onBlur={saveClubName}
                  className="sm:max-w-sm"
                />
              ) : (
                <Skeleton className="h-8 w-full rounded-2xl sm:max-w-sm" />
              )}
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="address">{t("settings.general.address")}</Label>
              {ready ? (
                <Input
                  id="address"
                  placeholder={t("settings.general.addressPlaceholder")}
                  value={general.address}
                  onChange={(e) => update({ address: e.target.value })}
                />
              ) : (
                <Skeleton className="h-8 w-full rounded-2xl" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t("fields.phone")}</Label>
              {ready ? (
                <Input
                  id="phone"
                  value={general.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  className="sm:max-w-sm"
                />
              ) : (
                <Skeleton className="h-8 w-full rounded-2xl sm:max-w-sm" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("fields.email")}</Label>
              {ready ? (
                <Input
                  id="email"
                  type="email"
                  value={general.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className="sm:max-w-sm"
                />
              ) : (
                <Skeleton className="h-8 w-full rounded-2xl sm:max-w-sm" />
              )}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.general.regional.title")}
          description={t("settings.general.regional.description")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("settings.general.timezone")}</Label>
              {ready ? (
                <Select
                  value={general.timezone}
                  onValueChange={(v) => update({ timezone: v })}
                >
                  <SelectTrigger className="w-full sm:max-w-sm">
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
              ) : (
                <Skeleton className="h-8 w-full rounded-2xl sm:max-w-sm" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("settings.general.timeFormat")}</Label>
              {ready ? (
                <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
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
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                  {timeFormats.map((opt) => (
                    <Skeleton
                      key={opt.value}
                      className="rounded-md border border-transparent px-3 py-2 text-sm"
                    >
                      <span className="invisible">{opt.label}</span>
                    </Skeleton>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("settings.general.weekStart")}</Label>
              {ready ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                  {weekStarts.map((opt) => (
                    <Skeleton
                      key={opt.value}
                      className="rounded-md border border-transparent px-3 py-2 text-sm"
                    >
                      <span className="invisible">{opt.label}</span>
                    </Skeleton>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SettingsSection>
      </SettingsSectionList>
    </div>
  )
}
