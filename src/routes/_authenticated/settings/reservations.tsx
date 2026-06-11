import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  clampNumber,
  DEFAULT_APP_SETTINGS,
  setAppSettings,
  SLOT_DURATIONS,
  useAppSettings,
  WEEKDAYS,
} from "@/lib/app-settings"
import type {
  Court,
  CourtType,
  DayHours,
  ReservationSettings,
  Weekday,
} from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/settings/reservations")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "settings:manage"),
  component: ReservationSettingsPage,
})

function buildWeekdays(t: TFunction): { key: Weekday; label: string }[] {
  return WEEKDAYS.map((d) => ({
    key: d.key,
    label: t(`settings.reservations.weekdays.${d.key}`),
  }))
}

function ReservationSettingsPage() {
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { reservations } = settings
  const weekdays = useMemo(() => buildWeekdays(t), [t])

  function update(partial: Partial<ReservationSettings>) {
    setAppSettings({
      ...settings,
      reservations: { ...reservations, ...partial },
    })
  }

  function updateDay(day: Weekday, partial: Partial<DayHours>) {
    update({
      hours: {
        ...reservations.hours,
        [day]: { ...reservations.hours[day], ...partial },
      },
    })
  }

  function updateCourt(id: number, partial: Partial<Court>) {
    update({
      courts: reservations.courts.map((c) =>
        c.id === id ? { ...c, ...partial } : c
      ),
    })
  }

  function addCourt() {
    const nextId = Math.max(0, ...reservations.courts.map((c) => c.id)) + 1
    update({
      courts: [
        ...reservations.courts,
        { id: nextId, name: `Court ${nextId}`, type: "indoor", active: true },
      ],
    })
  }

  function removeCourt(id: number) {
    update({ courts: reservations.courts.filter((c) => c.id !== id) })
  }

  function reset() {
    setAppSettings({
      ...settings,
      reservations: DEFAULT_APP_SETTINGS.reservations,
    })
    toast.success(t("settings.reservations.resetToast"))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">
            {t("settings.reservations.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.reservations.description")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          {t("common.resetToDefaults")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("settings.reservations.operatingHours.title")}
          </CardTitle>
          <CardDescription>
            {t("settings.reservations.operatingHours.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {weekdays.map((day) => {
            const value = reservations.hours[day.key]
            const invalid = !value.closed && value.open >= value.close
            return (
              <div
                key={day.key}
                className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-sm font-medium">{day.label}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!value.closed}
                      onCheckedChange={(checked) =>
                        updateDay(day.key, { closed: !checked })
                      }
                    />
                    <span className="w-12 text-xs text-muted-foreground">
                      {value.closed
                        ? t("settings.reservations.closed")
                        : t("settings.reservations.open")}
                    </span>
                  </div>
                  <Input
                    type="time"
                    value={value.open}
                    disabled={value.closed}
                    aria-invalid={invalid}
                    onChange={(e) =>
                      updateDay(day.key, { open: e.target.value })
                    }
                    className="h-8 w-32"
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={value.close}
                    disabled={value.closed}
                    aria-invalid={invalid}
                    onChange={(e) =>
                      updateDay(day.key, { close: e.target.value })
                    }
                    className="h-8 w-32"
                  />
                </div>
                {invalid && (
                  <p className="pl-24 text-xs text-destructive">
                    {t("settings.reservations.invalidHours")}
                  </p>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.reservations.courts.title")}</CardTitle>
          <CardDescription>
            {t("settings.reservations.courts.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {reservations.courts.map((court) => (
            <div
              key={court.id}
              className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <Input
                value={court.name}
                onChange={(e) =>
                  updateCourt(court.id, { name: e.target.value })
                }
                className="h-8 w-40"
              />
              <Select
                value={court.type}
                onValueChange={(v) =>
                  updateCourt(court.id, { type: v as CourtType })
                }
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">
                    {t("settings.reservations.courtTypeIndoor")}
                  </SelectItem>
                  <SelectItem value="outdoor">
                    {t("settings.reservations.courtTypeOutdoor")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  checked={court.active}
                  onCheckedChange={(checked) =>
                    updateCourt(court.id, { active: checked })
                  }
                />
                <span className="w-14 text-xs text-muted-foreground">
                  {court.active ? t("common.active") : t("common.inactive")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeCourt(court.id)}
                aria-label={t("settings.reservations.removeCourt", {
                  name: court.name,
                })}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={addCourt}
          >
            <IconPlus className="size-4" />
            {t("settings.reservations.addCourt")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.reservations.slots.title")}</CardTitle>
          <CardDescription>
            {t("settings.reservations.slots.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t("settings.reservations.slotDuration")}</Label>
            <Select
              value={String(reservations.slotDuration)}
              onValueChange={(v) => update({ slotDuration: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_DURATIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {t("settings.reservations.slotMinutes", { minutes: m })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultBookingLength">
              {t("settings.reservations.defaultBookingLength")}
            </Label>
            <Input
              id="defaultBookingLength"
              type="number"
              min={30}
              step={30}
              value={reservations.defaultBookingLength}
              onChange={(e) =>
                update({
                  defaultBookingLength: clampNumber(e.target.value, 30),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.reservations.bookingRules.title")}</CardTitle>
          <CardDescription>
            {t("settings.reservations.bookingRules.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="minAdvanceHours">
              {t("settings.reservations.minAdvance")}
            </Label>
            <Input
              id="minAdvanceHours"
              type="number"
              min={0}
              value={reservations.minAdvanceHours}
              onChange={(e) =>
                update({ minAdvanceHours: clampNumber(e.target.value, 0) })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxAdvanceDays">
              {t("settings.reservations.maxAdvance")}
            </Label>
            <Input
              id="maxAdvanceDays"
              type="number"
              min={1}
              value={reservations.maxAdvanceDays}
              onChange={(e) =>
                update({ maxAdvanceDays: clampNumber(e.target.value, 1) })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cancellationCutoffHours">
              {t("settings.reservations.cancellationCutoff")}
            </Label>
            <Input
              id="cancellationCutoffHours"
              type="number"
              min={0}
              value={reservations.cancellationCutoffHours}
              onChange={(e) =>
                update({
                  cancellationCutoffHours: clampNumber(e.target.value, 0),
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxConcurrentPerPlayer">
              {t("settings.reservations.maxConcurrent")}
            </Label>
            <Input
              id="maxConcurrentPerPlayer"
              type="number"
              min={1}
              value={reservations.maxConcurrentPerPlayer}
              onChange={(e) =>
                update({
                  maxConcurrentPerPlayer: clampNumber(e.target.value, 1),
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
