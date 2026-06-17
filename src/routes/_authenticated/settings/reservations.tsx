import { useEffect, useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { ensurePermission } from "@/lib/route-guards"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  countCourtUsage,
  createCourt,
  deleteCourt,
  listCourts,
  updateCourt,
} from "@/lib/courts.functions"
import type { CourtRecord } from "@/lib/courts.functions"
import {
  SettingsSection,
  SettingsSectionList,
} from "@/components/settings-section"
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
import { clampNumber, TIMEZONES } from "@/lib/app-settings"
import {
  DEFAULT_RESERVATION_SETTINGS,
  SLOT_DURATIONS,
  WEEKDAYS,
} from "@/lib/reservation-settings"
import type { DayHours, Weekday } from "@/lib/reservation-settings"
import {
  getReservationSettings,
  updateReservationSettings,
} from "@/lib/reservation-settings.functions"
import type { ReservationSettingsData } from "@/lib/reservation-settings.functions"

type CourtType = "indoor" | "outdoor"

export const Route = createFileRoute("/_authenticated/settings/reservations")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "settings:manage"),
  loader: async () => ({
    courts: await listCourts(),
    settings: await getReservationSettings(),
  }),
  component: ReservationSettingsPage,
})

function buildWeekdays(t: TFunction): { key: Weekday; label: string }[] {
  return WEEKDAYS.map((d) => ({
    key: d.key,
    label: t(`settings.reservations.weekdays.${d.key}`),
  }))
}

// Default court names are stored as "Court N". For read-only display, localize
// the "Court" word (e.g. "Pista N" in Spanish). Custom names are left as-is.
function localizeCourtName(name: string, t: TFunction): string {
  const match = /^Court\s+(.+)$/i.exec(name)
  return match ? t("stats.court", { court: match[1] }) : name
}

function ReservationSettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { courts: loadedCourts, settings: loadedSettings } =
    Route.useLoaderData()
  const weekdays = useMemo(() => buildWeekdays(t), [t])
  // Local mirror of the DB courts so name edits stay snappy (saved on blur).
  const [courts, setCourts] = useState<CourtRecord[]>(loadedCourts)
  // Local mirror of the DB reservation settings (hours + rules), saved to the
  // server on change (selects/switches) or on blur (text/number inputs).
  const [reservations, setReservations] =
    useState<ReservationSettingsData>(loadedSettings)
  const [courtToDelete, setCourtToDelete] = useState<CourtRecord | null>(null)
  const [checkingCourt, setCheckingCourt] = useState(false)

  useEffect(() => setCourts(loadedCourts), [loadedCourts])
  useEffect(() => setReservations(loadedSettings), [loadedSettings])

  // Persists the full settings blob; reverts (via refetch) on failure.
  async function persistSettings(next: ReservationSettingsData) {
    try {
      await updateReservationSettings({ data: next })
    } catch {
      toast.error(t("common.genericError"), {
        description: t("common.tryAgain"),
      })
      router.invalidate()
    }
  }

  // Update local state only (for typing in inputs); persisted on blur via flush.
  function updateLocal(partial: Partial<ReservationSettingsData>) {
    setReservations((prev) => ({ ...prev, ...partial }))
  }

  // Update local state and persist immediately (for selects/switches).
  function commit(partial: Partial<ReservationSettingsData>) {
    setReservations((prev) => {
      const next = { ...prev, ...partial }
      void persistSettings(next)
      return next
    })
  }

  // Persist the current local state without changing it (input onBlur).
  function flush() {
    setReservations((prev) => {
      void persistSettings(prev)
      return prev
    })
  }

  function updateDayLocal(day: Weekday, partial: Partial<DayHours>) {
    setReservations((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], ...partial } },
    }))
  }

  function commitDay(day: Weekday, partial: Partial<DayHours>) {
    setReservations((prev) => {
      const next = {
        ...prev,
        hours: { ...prev.hours, [day]: { ...prev.hours[day], ...partial } },
      }
      void persistSettings(next)
      return next
    })
  }

  function updateCourtLocal(id: string, partial: Partial<CourtRecord>) {
    setCourts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...partial } : c))
    )
  }

  // Persists a single court to the DB. Reverts (via refetch) on failure.
  async function saveCourt(id: string, partial: Partial<CourtRecord>) {
    try {
      await updateCourt({ data: { id, ...partial } })
    } catch {
      toast.error(t("common.genericError"), {
        description: t("common.tryAgain"),
      })
      router.invalidate()
    }
  }

  async function addCourt() {
    const nextNumber = Math.max(0, ...courts.map((c) => c.sortOrder)) + 1
    try {
      await createCourt({
        data: { name: `Court ${nextNumber}`, type: "indoor", active: true },
      })
      router.invalidate()
    } catch {
      toast.error(t("common.genericError"), {
        description: t("common.tryAgain"),
      })
    }
  }

  // Confirm in a modal, then block deletion if the court is still in use by a
  // reservation or class; otherwise delete it.
  async function confirmRemoveCourt() {
    if (!courtToDelete) return
    const court = courtToDelete
    const courtLabel = localizeCourtName(court.name, t)
    setCheckingCourt(true)
    try {
      const usage = await countCourtUsage({ data: { id: court.id } })
      const total = usage.reservations + usage.classes
      if (total > 0) {
        toast.error(t("settings.reservations.deleteCourtBlockedTitle"), {
          description: t(
            total === 1
              ? "settings.reservations.deleteCourtBlockedOne"
              : "settings.reservations.deleteCourtBlockedOther",
            { name: courtLabel, count: total }
          ),
        })
        return
      }
      await deleteCourt({ data: { id: court.id } })
      toast.success(
        t("settings.reservations.courtRemoved", { name: courtLabel })
      )
      router.invalidate()
    } catch {
      toast.error(t("common.genericError"), {
        description: t("common.tryAgain"),
      })
    } finally {
      // Flip off loading so the bar snaps to 100%, then let it stay visible for
      // a beat before the dialog closes.
      setCheckingCourt(false)
      setTimeout(() => setCourtToDelete(null), 400)
    }
  }

  function reset() {
    const next = DEFAULT_RESERVATION_SETTINGS
    setReservations(next)
    void persistSettings(next)
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

      <SettingsSectionList>
        <SettingsSection
          title={t("settings.reservations.operatingHours.title")}
          description={t("settings.reservations.operatingHours.description")}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 border-b pb-4 sm:max-w-xs">
              <Label>{t("settings.reservations.timezone")}</Label>
              <Select
                value={reservations.timezone}
                onValueChange={(v) => commit({ timezone: v })}
              >
                <SelectTrigger className="h-8">
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
            {weekdays.map((day) => {
              const value = reservations.hours[day.key]
              const invalid = !value.closed && value.open >= value.close
              return (
                <div
                  key={day.key}
                  className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-24 text-sm font-medium">
                      {day.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!value.closed}
                        onCheckedChange={(checked) =>
                          commitDay(day.key, { closed: !checked })
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
                        updateDayLocal(day.key, { open: e.target.value })
                      }
                      onBlur={flush}
                      className="h-8 w-32"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      value={value.close}
                      disabled={value.closed}
                      aria-invalid={invalid}
                      onChange={(e) =>
                        updateDayLocal(day.key, { close: e.target.value })
                      }
                      onBlur={flush}
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
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.reservations.courts.title")}
          description={t("settings.reservations.courts.description")}
        >
          <div className="flex flex-col gap-3">
            {courts.map((court) => (
              <div
                key={court.id}
                className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <Input
                  value={court.name}
                  onChange={(e) =>
                    updateCourtLocal(court.id, { name: e.target.value })
                  }
                  onBlur={(e) => saveCourt(court.id, { name: e.target.value })}
                  className="h-8 w-40"
                />
                <Select
                  value={court.type}
                  onValueChange={(v) => {
                    updateCourtLocal(court.id, { type: v as CourtType })
                    saveCourt(court.id, { type: v as CourtType })
                  }}
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
                    onCheckedChange={(checked) => {
                      updateCourtLocal(court.id, { active: checked })
                      saveCourt(court.id, { active: checked })
                    }}
                  />
                  <span className="w-14 text-xs text-muted-foreground">
                    {court.active ? t("common.active") : t("common.inactive")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setCourtToDelete(court)}
                  aria-label={t("settings.reservations.removeCourt", {
                    name: localizeCourtName(court.name, t),
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
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.reservations.slots.title")}
          description={t("settings.reservations.slots.description")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("settings.reservations.slotDuration")}</Label>
              <Select
                value={String(reservations.slotDuration)}
                onValueChange={(v) => commit({ slotDuration: Number(v) })}
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
                  updateLocal({
                    defaultBookingLength: clampNumber(e.target.value, 30),
                  })
                }
                onBlur={flush}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.reservations.bookingRules.title")}
          description={t("settings.reservations.bookingRules.description")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
                  updateLocal({
                    minAdvanceHours: clampNumber(e.target.value, 0),
                  })
                }
                onBlur={flush}
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
                  updateLocal({
                    maxAdvanceDays: clampNumber(e.target.value, 1),
                  })
                }
                onBlur={flush}
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
                  updateLocal({
                    cancellationCutoffHours: clampNumber(e.target.value, 0),
                  })
                }
                onBlur={flush}
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
                  updateLocal({
                    maxConcurrentPerPlayer: clampNumber(e.target.value, 1),
                  })
                }
                onBlur={flush}
              />
            </div>
          </div>
        </SettingsSection>
      </SettingsSectionList>

      <AlertDialog
        open={!!courtToDelete}
        onOpenChange={(open) => {
          if (!open && !checkingCourt) setCourtToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.reservations.deleteCourtTitle", {
                name: courtToDelete
                  ? localizeCourtName(courtToDelete.name, t)
                  : "",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.reservations.deleteCourtConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={checkingCourt}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              loading={checkingCourt}
              onClick={(e) => {
                e.preventDefault()
                void confirmRemoveCourt()
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
