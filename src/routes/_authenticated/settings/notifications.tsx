import { createFileRoute } from "@tanstack/react-router"
import { IconBrandWhatsapp, IconMail } from "@tabler/icons-react"
import { ensurePermission } from "@/lib/route-guards"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  DEFAULT_APP_SETTINGS,
  REMINDER_OFFSETS,
  setAppSettings,
  useAppSettings,
} from "@/lib/app-settings"
import type { NotificationSettings } from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "settings:manage"),
  component: NotificationsSettingsPage,
})

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function NotificationsSettingsPage() {
  const settings = useAppSettings()
  const { notifications } = settings

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
    toast.success("Notification settings reset to defaults")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how and when players and staff are notified.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to defaults
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>
            Delivery methods for outbound notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <ToggleRow
            title="Email"
            description="Send notifications by email."
            icon={<IconMail className="size-5" />}
            checked={notifications.channels.email}
            onChange={(checked) =>
              update({
                channels: { ...notifications.channels, email: checked },
              })
            }
          />
          <ToggleRow
            title="WhatsApp"
            description="Send notifications via WhatsApp."
            icon={<IconBrandWhatsapp className="size-5" />}
            checked={notifications.channels.whatsapp}
            onChange={(checked) =>
              update({
                channels: { ...notifications.channels, whatsapp: checked },
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            Which booking events trigger a notification.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <ToggleRow
            title="Booking confirmations"
            description="When a reservation is created."
            checked={notifications.events.confirmations}
            onChange={(checked) =>
              update({
                events: { ...notifications.events, confirmations: checked },
              })
            }
          />
          <ToggleRow
            title="Reminders"
            description="Before an upcoming reservation."
            checked={notifications.events.reminders}
            onChange={(checked) =>
              update({
                events: { ...notifications.events, reminders: checked },
              })
            }
          />
          <ToggleRow
            title="Cancellations"
            description="When a reservation is cancelled."
            checked={notifications.events.cancellations}
            onChange={(checked) =>
              update({
                events: { ...notifications.events, cancellations: checked },
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder timing</CardTitle>
          <CardDescription>
            Send reminders this long before the reservation starts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OFFSETS.map((offset) => {
              const active = notifications.reminderOffsets.includes(
                offset.hours
              )
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
                  {offset.label} before
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-app notifications</CardTitle>
          <CardDescription>
            Which events appear in the notifications menu.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <ToggleRow
            title="Bookings"
            description="New and updated reservations."
            checked={notifications.inApp.bookings}
            onChange={(checked) =>
              update({ inApp: { ...notifications.inApp, bookings: checked } })
            }
          />
          <ToggleRow
            title="Payments"
            description="Sales and payment activity."
            checked={notifications.inApp.payments}
            onChange={(checked) =>
              update({ inApp: { ...notifications.inApp, payments: checked } })
            }
          />
          <ToggleRow
            title="Low stock"
            description="When inventory drops below the threshold."
            checked={notifications.inApp.lowStock}
            onChange={(checked) =>
              update({ inApp: { ...notifications.inApp, lowStock: checked } })
            }
          />
          <ToggleRow
            title="System"
            description="Product updates and maintenance notices."
            checked={notifications.inApp.system}
            onChange={(checked) =>
              update({ inApp: { ...notifications.inApp, system: checked } })
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
