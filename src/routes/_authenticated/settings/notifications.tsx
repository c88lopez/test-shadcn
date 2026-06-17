import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { IconBrandWhatsapp, IconMail } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { ensurePermission } from "@/lib/route-guards"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  SettingsSection,
  SettingsSectionList,
} from "@/components/settings-section"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  DEFAULT_APP_SETTINGS,
  REMINDER_OFFSETS,
  setAppSettings,
  useAppSettings,
  useAppSettingsHydrated,
} from "@/lib/app-settings"
import type { NotificationSettings } from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "settings:manage"),
  component: NotificationsSettingsPage,
})

const OFFSET_LABEL_KEYS = {
  1: "settings.notifications.offsets.h1",
  2: "settings.notifications.offsets.h2",
  24: "settings.notifications.offsets.h24",
  48: "settings.notifications.offsets.h48",
} as const

function buildReminderOffsets(
  t: TFunction
): { hours: number; label: string }[] {
  return REMINDER_OFFSETS.map((offset) => ({
    hours: offset.hours,
    label: t(OFFSET_LABEL_KEYS[offset.hours as keyof typeof OFFSET_LABEL_KEYS]),
  }))
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
  loading,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="flex items-start gap-3 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      {loading ? (
        <Skeleton className="mt-0.5 h-5 w-9 rounded-full" />
      ) : (
        <Switch
          className="mt-0.5"
          checked={checked}
          onCheckedChange={onChange}
        />
      )}
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function NotificationsSettingsPage() {
  const { t } = useTranslation()
  const settings = useAppSettings()
  // Per-club settings load from localStorage after mount; until then show a
  // skeleton so the switches don't flash from default to real values.
  const ready = useAppSettingsHydrated()
  const { notifications } = settings
  const reminderOffsets = useMemo(() => buildReminderOffsets(t), [t])

  function update(partial: Partial<NotificationSettings>) {
    setAppSettings({
      ...settings,
      notifications: { ...notifications, ...partial },
    })
  }

  function toggleOffset(hours: number) {
    const has = notifications.reminderOffsets.includes(hours)
    update({
      reminderOffsets: has
        ? notifications.reminderOffsets.filter((h) => h !== hours)
        : [...notifications.reminderOffsets, hours].sort((a, b) => b - a),
    })
  }

  function reset() {
    setAppSettings({
      ...settings,
      notifications: DEFAULT_APP_SETTINGS.notifications,
    })
    toast.success(t("settings.notifications.resetToast"))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">
            {t("settings.notifications.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.notifications.description")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          {t("common.resetToDefaults")}
        </Button>
      </div>

      <SettingsSectionList>
        <SettingsSection
          title={t("settings.notifications.channels.title")}
          description={t("settings.notifications.channels.description")}
        >
          <div className="flex flex-col">
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.email.title")}
              description={t("settings.notifications.email.description")}
              icon={<IconMail className="size-5" />}
              checked={notifications.channels.email}
              onChange={(checked) =>
                update({
                  channels: { ...notifications.channels, email: checked },
                })
              }
            />
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.whatsapp.title")}
              description={t("settings.notifications.whatsapp.description")}
              icon={<IconBrandWhatsapp className="size-5" />}
              checked={notifications.channels.whatsapp}
              onChange={(checked) =>
                update({
                  channels: { ...notifications.channels, whatsapp: checked },
                })
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.notifications.events.title")}
          description={t("settings.notifications.events.description")}
        >
          <div className="flex flex-col">
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.confirmations.title")}
              description={t(
                "settings.notifications.confirmations.description"
              )}
              checked={notifications.events.confirmations}
              onChange={(checked) =>
                update({
                  events: { ...notifications.events, confirmations: checked },
                })
              }
            />
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.reminders.title")}
              description={t("settings.notifications.reminders.description")}
              checked={notifications.events.reminders}
              onChange={(checked) =>
                update({
                  events: { ...notifications.events, reminders: checked },
                })
              }
            />
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.cancellations.title")}
              description={t(
                "settings.notifications.cancellations.description"
              )}
              checked={notifications.events.cancellations}
              onChange={(checked) =>
                update({
                  events: { ...notifications.events, cancellations: checked },
                })
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.notifications.reminderTiming.title")}
          description={t("settings.notifications.reminderTiming.description")}
        >
          <div className="flex flex-wrap gap-2">
            {reminderOffsets.map((offset) => {
              const active = notifications.reminderOffsets.includes(
                offset.hours
              )
              if (!ready) {
                return (
                  <Skeleton
                    key={offset.hours}
                    className="rounded-full border border-transparent px-4 py-1.5 text-sm"
                  >
                    <span className="invisible">
                      {t("settings.notifications.offsetBefore", {
                        label: offset.label,
                      })}
                    </span>
                  </Skeleton>
                )
              }
              return (
                <button
                  key={offset.hours}
                  type="button"
                  disabled={!notifications.events.reminders}
                  onClick={() => toggleOffset(offset.hours)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {t("settings.notifications.offsetBefore", {
                    label: offset.label,
                  })}
                </button>
              )
            })}
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.notifications.inApp.title")}
          description={t("settings.notifications.inApp.description")}
        >
          <div className="flex flex-col">
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.bookings.title")}
              description={t("settings.notifications.bookings.description")}
              checked={notifications.inApp.bookings}
              onChange={(checked) =>
                update({ inApp: { ...notifications.inApp, bookings: checked } })
              }
            />
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.payments.title")}
              description={t("settings.notifications.payments.description")}
              checked={notifications.inApp.payments}
              onChange={(checked) =>
                update({ inApp: { ...notifications.inApp, payments: checked } })
              }
            />
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.lowStock.title")}
              description={t("settings.notifications.lowStock.description")}
              checked={notifications.inApp.lowStock}
              onChange={(checked) =>
                update({ inApp: { ...notifications.inApp, lowStock: checked } })
              }
            />
            <ToggleRow
              loading={!ready}
              title={t("settings.notifications.system.title")}
              description={t("settings.notifications.system.description")}
              checked={notifications.inApp.system}
              onChange={(checked) =>
                update({ inApp: { ...notifications.inApp, system: checked } })
              }
            />
          </div>
        </SettingsSection>
      </SettingsSectionList>
    </div>
  )
}
