import { useEffect, useMemo, useRef, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import type { ColumnDef } from "@tanstack/react-table"
import { IconMinus, IconPlus, IconZoomIn } from "@tabler/icons-react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { NewReservationDrawer } from "@/components/new-reservation-drawer"
import { RowActions } from "@/components/row-actions"
import { cn } from "@/lib/utils"
import {
  deleteReservation,
  listReservations,
} from "@/lib/reservations.functions"
import type { Reservation as DbReservation } from "@/db/schema"
import type { TranslationKey } from "@/lib/i18n"
import { useCan } from "@/hooks/use-permissions"
import {
  formatHour,
  formatTimeRange,
  todayHours,
  useAppSettings,
} from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/reservations")({
  loader: async () => ({ reservations: await listReservations() }),
  component: ReservationsPage,
})

// Table/timeline row: a DB reservation plus a derived "HH:MM – HH:MM" range.
type ReservationRow = DbReservation & { timeRange: string }

interface TimelineReservation {
  id: string
  court: number
  reservedTo: string
  time: string
  paid: boolean
}

function endTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number)
  const total = h * 60 + m + durationMinutes
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`
}

function buildRange(r: DbReservation): string {
  return `${r.startTime} – ${endTime(r.startTime, r.durationMinutes)}`
}

// --- Timeline ---

// px per hour → roughly how many hours fit in a ~800px viewport
const ZOOM_STEPS = [52, 80, 120, 160, 200, 260]
const DEFAULT_ZOOM = 3 // index 3 → 160 px/h → ~5 h visible
const SIDE_PAD = 24 // px of breathing room before open and after close
const LABEL_COL = 96 // w-24 in px
const BLOCK_GAP = 5 // px horizontal gap between adjacent reservation blocks

function parseTimeRange(time: string): { startMin: number; endMin: number } {
  const [startStr, endStr] = time.split(" – ")
  const [sh, sm] = startStr.split(":").map(Number)
  const [eh, em] = endStr.split(":").map(Number)
  return { startMin: sh * 60 + sm, endMin: eh * 60 + em }
}

// Returns px offset from the left edge of the track area
function toPx(minutes: number, pxPerHour: number, startHour: number): number {
  return SIDE_PAD + ((minutes - startHour * 60) / 60) * pxPerHour
}

function CourtTimeline({
  reservations,
  hoveredId,
  onHover,
}: {
  reservations: TimelineReservation[]
  hoveredId: string | null
  onHover: (id: string | null) => void
}) {
  const { t, i18n } = useTranslation()
  const { reservations: reservationSettings, general } = useAppSettings()
  const dayHours = todayHours(reservationSettings)
  const fallback = dayHours.closed
  const startHour = fallback ? 8 : Number(dayHours.open.split(":")[0])
  // Round the close time up to the next hour so the final label is visible.
  const closeParts = dayHours.close.split(":").map(Number)
  const endHour = fallback
    ? 23
    : closeParts[1] > 0
      ? closeParts[0] + 1
      : closeParts[0]
  const totalHours = Math.max(1, endHour - startHour)
  const courts = reservationSettings.courts.filter((c) => c.active)
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM)
  const pxPerHour = ZOOM_STEPS[zoomIdx]
  const innerWidth = LABEL_COL + 2 * SIDE_PAD + totalHours * pxPerHour

  const [now, setNow] = useState(() => new Date())
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowInRange = nowMin >= startHour * 60 && nowMin <= endHour * 60

  // Tick the "now" indicator forward, aligned to each minute boundary, so it
  // stays in sync without requiring a page refresh.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const scheduleNextTick = () => {
      timer = setTimeout(
        () => {
          setNow(new Date())
          scheduleNextTick()
        },
        60_000 - (Date.now() % 60_000)
      )
    }
    scheduleNextTick()
    return () => clearTimeout(timer)
  }, [])

  // Center the view on the current time on mount and whenever zoom changes.
  // Reads the time fresh here (instead of depending on the ticking `now`) so the
  // per-minute updates don't yank the user's scroll position.
  useEffect(() => {
    if (!scrollRef.current) return
    const current = new Date()
    const currentMin = current.getHours() * 60 + current.getMinutes()
    if (currentMin < startHour * 60 || currentMin > endHour * 60) return
    const el = scrollRef.current
    requestAnimationFrame(() => {
      // LABEL_COL is sticky so add it to reach the track's coordinate space
      el.scrollLeft =
        LABEL_COL + toPx(currentMin, pxPerHour, startHour) - el.clientWidth / 2
    })
  }, [pxPerHour, startHour, endHour])

  const dateLocale = i18n.language === "es" ? "es-ES" : "en-GB"
  const rawTodayLabel = now.toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  // Spanish locale lowercases the weekday/month; capitalize the first letter
  // so the subtitle reads e.g. "Jueves 11 de junio de 2026".
  const todayLabel =
    rawTodayLabel.charAt(0).toUpperCase() + rawTodayLabel.slice(1)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {todayLabel}
          {fallback && ` · ${t("pages.reservations.closedToday")}`}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
          >
            <IconMinus className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() =>
              setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))
            }
            disabled={zoomIdx === ZOOM_STEPS.length - 1}
          >
            <IconZoomIn className="size-3.5" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto rounded-md border">
        <div style={{ width: innerWidth }}>
          {/* Hour header */}
          <div className="flex border-b">
            <div className="sticky left-0 z-30 flex w-24 shrink-0 items-center border-r bg-background px-3 text-xs font-bold">
              {t("fields.court")}
            </div>
            <div className="relative h-8 flex-1 overflow-visible">
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute top-1 -translate-x-1/2 text-[11px] font-bold text-muted-foreground select-none"
                  style={{ left: toPx(h * 60, pxPerHour, startHour) }}
                >
                  {formatHour(h, general.timeFormat)}
                </span>
              ))}
            </div>
          </div>

          {/* Court rows */}
          {courts.map((court, courtIdx) => {
            const courtReservations = reservations.filter(
              (r) => r.court === court.id
            )
            return (
              <div
                key={court.id}
                className={cn(
                  "flex",
                  courtIdx < courts.length - 1 && "border-b"
                )}
              >
                {/* Label */}
                <div className="sticky left-0 z-30 flex w-24 shrink-0 items-center border-r bg-background px-3 text-xs font-bold text-muted-foreground">
                  {court.name.replace(/^Court\s+/i, "# ")}
                </div>

                {/* Track */}
                <div className="relative h-12 flex-1">
                  {/* Hour grid lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 w-px bg-border"
                      style={{ left: toPx(h * 60, pxPerHour, startHour) }}
                    />
                  ))}

                  {/* Now indicator */}
                  {nowInRange && (
                    <div
                      className="absolute top-0 bottom-0 z-20 w-0.5 bg-destructive"
                      style={{ left: toPx(nowMin, pxPerHour, startHour) }}
                    />
                  )}

                  {/* Reservation blocks */}
                  {courtReservations.map((r) => {
                    const { startMin, endMin } = parseTimeRange(r.time)
                    const highlighted = hoveredId === r.id
                    return (
                      <div
                        key={r.id}
                        title={`${r.reservedTo} · ${formatTimeRange(r.time, general.timeFormat)}${r.paid ? "" : ` · ${t("options.unpaid")}`}`}
                        onMouseEnter={() => onHover(r.id)}
                        onMouseLeave={() => onHover(null)}
                        className={cn(
                          "absolute top-2.5 bottom-2.5 z-10 flex items-center overflow-hidden rounded bg-primary px-2 text-primary-foreground ring-offset-2 ring-offset-background transition-shadow",
                          highlighted && "z-20 ring-2 ring-ring"
                        )}
                        style={{
                          left:
                            toPx(startMin, pxPerHour, startHour) +
                            BLOCK_GAP / 2,
                          width:
                            ((endMin - startMin) / 60) * pxPerHour - BLOCK_GAP,
                        }}
                      >
                        <span className="truncate text-[11px] font-medium">
                          {r.reservedTo}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- Table columns ---

function TimeCell({ time }: { time: string }) {
  const { general } = useAppSettings()
  return <>{formatTimeRange(time, general.timeFormat)}</>
}

function toReservationData(r: ReservationRow) {
  return {
    id: r.id,
    player: r.player,
    court: String(r.court),
    date: parseISO(r.date),
    time: r.startTime,
    duration: String(r.durationMinutes),
    paymentStatus: r.paymentStatus,
  }
}

function ReservationActions({ reservation }: { reservation: ReservationRow }) {
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("reservations:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteReservation({ data: { id: reservation.id } })
      toast.success(t("pages.reservations.deleted"), {
        description: `${reservation.player} · ${reservation.timeRange}`,
      })
      router.invalidate()
    } catch {
      toast.error(t("pages.reservations.deleteError"), {
        description: t("common.tryAgain"),
      })
    }
  }

  if (!canManage) return null

  return (
    <>
      <NewReservationDrawer
        reservation={toReservationData(reservation)}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => router.invalidate()}
      />
      <RowActions onEdit={() => setEditOpen(true)} onDelete={handleDelete} />
    </>
  )
}

const PAYMENT_BADGE: Record<
  string,
  { labelKey: TranslationKey; variant: "default" | "secondary" | "outline" }
> = {
  paid: { labelKey: "options.paid", variant: "default" },
  partial: {
    labelKey: "pages.reservations.statusPartial",
    variant: "secondary",
  },
  unpaid: { labelKey: "options.unpaid", variant: "outline" },
}

function buildColumns(t: TFunction): ColumnDef<ReservationRow>[] {
  return [
    {
      accessorKey: "court",
      header: t("fields.court"),
      cell: ({ row }) => `# ${row.getValue<string>("court")}`,
    },
    {
      accessorKey: "player",
      header: t("pages.reservations.reservedTo"),
    },
    {
      accessorKey: "bookedBy",
      header: t("pages.reservations.reservedBy"),
    },
    {
      accessorKey: "timeRange",
      header: t("pages.reservations.time"),
      cell: ({ row }) => <TimeCell time={row.getValue<string>("timeRange")} />,
    },
    {
      accessorKey: "paymentStatus",
      header: t("common.status"),
      meta: { className: "w-[384px] text-center" },
      cell: ({ row }) => {
        const badge =
          PAYMENT_BADGE[row.getValue<string>("paymentStatus")] ??
          PAYMENT_BADGE.unpaid
        return (
          <div className="flex justify-center">
            <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
          </div>
        )
      },
    },
    {
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => <ReservationActions reservation={row.original} />,
    },
  ]
}

// --- Page ---

function ReservationsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("reservations:manage")
  const { reservations } = Route.useLoaderData()
  const columns = useMemo(() => buildColumns(t), [t])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const rows: ReservationRow[] = reservations.map((r) => ({
    ...r,
    timeRange: buildRange(r),
  }))

  const todayISO = format(new Date(), "yyyy-MM-dd")
  const todayReservations: TimelineReservation[] = rows
    .filter((r) => r.date === todayISO)
    .map((r) => ({
      id: r.id,
      court: r.court,
      reservedTo: r.player,
      time: r.timeRange,
      paid: r.paymentStatus === "paid",
    }))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {t("pages.reservations.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pages.reservations.description")}
          </p>
        </div>
        {canManage && (
          <NewReservationDrawer
            onSaved={() => router.invalidate()}
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                {t("pages.reservations.newButton")}
              </Button>
            }
          />
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          {t("pages.reservations.todaysTimeline")}
        </h2>
        <CourtTimeline
          reservations={todayReservations}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          {t("pages.reservations.allReservations")}
        </h2>
        <DataTable
          columns={columns}
          data={rows}
          searchPlaceholder={t("pages.reservations.searchPlaceholder")}
          onRowHover={(r) => setHoveredId(r ? r.id : null)}
          isRowHighlighted={(r) => r.id === hoveredId}
        />
      </section>
    </div>
  )
}
