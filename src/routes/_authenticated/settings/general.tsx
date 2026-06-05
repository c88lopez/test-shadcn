import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
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
  component: GeneralSettingsPage,
})

const timeFormats: { value: TimeFormat; label: string }[] = [
  { value: "24h", label: "24-hour" },
  { value: "12h", label: "12-hour" },
]

const weekStarts: { value: WeekStart; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
]

function GeneralSettingsPage() {
  const settings = useAppSettings()
  const { general } = settings

  function update(partial: Partial<GeneralSettings>) {
    setAppSettings({ ...settings, general: { ...general, ...partial } })
  }

  function reset() {
    setAppSettings({ ...settings, general: DEFAULT_APP_SETTINGS.general })
    toast.success("General settings reset to defaults")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">General</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your club profile and regional preferences.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to defaults
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Club profile</CardTitle>
          <CardDescription>
            Shown across the app, including the sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="clubName">Club name</Label>
            <Input
              id="clubName"
              value={general.clubName}
              onChange={(e) => update({ clubName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clubInitials">Logo initials</Label>
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Street, city, country"
              value={general.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={general.phone}
              onChange={(e) => update({ phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
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
          <CardTitle>Regional</CardTitle>
          <CardDescription>
            Controls dates and time formatting throughout the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Timezone</Label>
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
            <Label>Time format</Label>
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
            <Label>Week starts on</Label>
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
