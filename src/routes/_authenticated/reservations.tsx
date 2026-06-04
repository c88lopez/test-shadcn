import { useEffect, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconMinus, IconPlus, IconZoomIn } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { NewReservationDrawer } from "@/components/new-reservation-drawer"
import type { ReservationData } from "@/components/new-reservation-drawer"
import { RowActions } from "@/components/row-actions"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_authenticated/reservations")({
  component: ReservationsPage,
})

interface Reservation {
  id: number
  court: number
  reservedTo: string
  reservedBy: string
  time: string
  paid: boolean
}

const reservations: Reservation[] = [
  {
    id: 1,
    court: 1,
    reservedTo: "Maria García",
    reservedBy: "Admin",
    time: "09:00 – 10:30",
    paid: true,
  },
  {
    id: 2,
    court: 3,
    reservedTo: "Carlos López",
    reservedBy: "Carlos López",
    time: "10:00 – 11:00",
    paid: false,
  },
  {
    id: 3,
    court: 2,
    reservedTo: "Ana Martínez",
    reservedBy: "Admin",
    time: "11:00 – 12:30",
    paid: true,
  },
  {
    id: 4,
    court: 1,
    reservedTo: "Pedro Sánchez",
    reservedBy: "Pedro Sánchez",
    time: "12:00 – 13:30",
    paid: true,
  },
  {
    id: 5,
    court: 4,
    reservedTo: "Laura Fernández",
    reservedBy: "Admin",
    time: "16:00 – 17:30",
    paid: false,
  },
  {
    id: 6,
    court: 2,
    reservedTo: "Diego Ruiz",
    reservedBy: "Diego Ruiz",
    time: "18:00 – 19:30",
    paid: true,
  },
  {
    id: 7,
    court: 5,
    reservedTo: "Sofía Torres",
    reservedBy: "Admin",
    time: "08:00 – 09:30",
    paid: true,
  },
  {
    id: 8,
    court: 6,
    reservedTo: "Javier Moreno",
    reservedBy: "Javier Moreno",
    time: "09:30 – 11:00",
    paid: false,
  },
  {
    id: 9,
    court: 3,
    reservedTo: "Isabel Jiménez",
    reservedBy: "Admin",
    time: "13:00 – 14:30",
    paid: true,
  },
  {
    id: 10,
    court: 1,
    reservedTo: "Miguel Álvarez",
    reservedBy: "Miguel Álvarez",
    time: "15:00 – 16:30",
    paid: true,
  },
  {
    id: 11,
    court: 4,
    reservedTo: "Elena Romero",
    reservedBy: "Admin",
    time: "17:30 – 19:00",
    paid: false,
  },
  {
    id: 12,
    court: 2,
    reservedTo: "Antonio Díaz",
    reservedBy: "Antonio Díaz",
    time: "19:30 – 21:00",
    paid: true,
  },
  {
    id: 13,
    court: 6,
    reservedTo: "Carmen López",
    reservedBy: "Admin",
    time: "11:00 – 12:30",
    paid: true,
  },
  {
    id: 14,
    court: 5,
    reservedTo: "Francisco Pérez",
    reservedBy: "Francisco Pérez",
    time: "14:00 – 15:30",
    paid: false,
  },
  {
    id: 15,
    court: 3,
    reservedTo: "Lucía González",
    reservedBy: "Admin",
    time: "20:00 – 21:30",
    paid: true,
  },
]

// --- Timeline ---

const START_HOUR = 8
const END_HOUR = 23
const TOTAL_HOURS = END_HOUR - START_HOUR
const COURTS = [1, 2, 3, 4, 5, 6]
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

// px per hour → roughly how many hours fit in a ~800px viewport
const ZOOM_STEPS = [52, 80, 120, 160, 200, 260]
const DEFAULT_ZOOM = 3 // index 3 → 160 px/h → ~5 h visible
const SIDE_PAD = 24 // px of breathing room before 08:00 and after 23:00
const LABEL_COL = 96 // w-24 in px
const BLOCK_GAP = 5 // px horizontal gap between adjacent reservation blocks

function parseTimeRange(time: string): { startMin: number; endMin: number } {
  const [startStr, endStr] = time.split(" – ")
  const [sh, sm] = startStr.split(":").map(Number)
  const [eh, em] = endStr.split(":").map(Number)
  return { startMin: sh * 60 + sm, endMin: eh * 60 + em }
}

// Returns px offset from the left edge of the track area
function toPx(minutes: number, pxPerHour: number): number {
  return SIDE_PAD + ((minutes - START_HOUR * 60) / 60) * pxPerHour
}

function CourtTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM)
  const pxPerHour = ZOOM_STEPS[zoomIdx]
  // track = SIDE_PAD + 15h * pxPerHour + SIDE_PAD; inner div = LABEL_COL + track
  const innerWidth = LABEL_COL + 2 * SIDE_PAD + TOTAL_HOURS * pxPerHour

  const [now, setNow] = useState(() => new Date())
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowInRange = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60

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
    if (currentMin < START_HOUR * 60 || currentMin > END_HOUR * 60) return
    const el = scrollRef.current
    requestAnimationFrame(() => {
      // LABEL_COL is sticky so add it to reach the track's coordinate space
      el.scrollLeft =
        LABEL_COL + toPx(currentMin, pxPerHour) - el.clientWidth / 2
    })
  }, [pxPerHour])

  const today = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{today}</p>
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
              Court
            </div>
            <div className="relative h-8 flex-1 overflow-visible">
              {HOURS.map((h) => (
                <span
                  key={h}
                  className="absolute top-1 -translate-x-1/2 text-[11px] font-bold text-muted-foreground select-none"
                  style={{ left: toPx(h * 60, pxPerHour) }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
          </div>

          {/* Court rows */}
          {COURTS.map((court, courtIdx) => {
            const courtReservations = reservations.filter(
              (r) => r.court === court
            )
            return (
              <div
                key={court}
                className={cn(
                  "flex",
                  courtIdx < COURTS.length - 1 && "border-b"
                )}
              >
                {/* Label */}
                <div className="sticky left-0 z-30 flex w-24 shrink-0 items-center border-r bg-background px-3 text-xs font-bold text-muted-foreground">
                  # {court}
                </div>

                {/* Track */}
                <div className="relative h-12 flex-1">
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 w-px bg-border"
                      style={{ left: toPx(h * 60, pxPerHour) }}
                    />
                  ))}

                  {/* Now indicator */}
                  {nowInRange && (
                    <div
                      className="absolute top-0 bottom-0 z-20 w-0.5 bg-destructive"
                      style={{ left: toPx(nowMin, pxPerHour) }}
                    />
                  )}

                  {/* Reservation blocks */}
                  {courtReservations.map((r) => {
                    const { startMin, endMin } = parseTimeRange(r.time)
                    return (
                      <div
                        key={r.id}
                        title={`${r.reservedTo} · ${r.time}${r.paid ? "" : " · Unpaid"}`}
                        className={cn(
                          "absolute top-2.5 bottom-2.5 z-10 flex items-center overflow-hidden rounded px-2",
                          r.paid
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-secondary text-secondary-foreground"
                        )}
                        style={{
                          left: toPx(startMin, pxPerHour) + BLOCK_GAP / 2,
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

function toReservationData(r: Reservation): ReservationData {
  const startTime = r.time.split(" – ")[0]
  return {
    player: r.reservedTo,
    court: String(r.court),
    date: new Date(),
    time: startTime,
    duration: "90",
    paymentStatus: r.paid ? "paid" : "unpaid",
  }
}

function ReservationActions({ reservation }: { reservation: Reservation }) {
  const [editOpen, setEditOpen] = useState(false)
  return (
    <>
      <NewReservationDrawer
        reservation={toReservationData(reservation)}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <RowActions
        onEdit={() => setEditOpen(true)}
        onDuplicate={() =>
          console.log("[dummy] duplicate reservation", reservation.id)
        }
        onDelete={() =>
          console.log("[dummy] delete reservation", reservation.id)
        }
      />
    </>
  )
}

const columns: ColumnDef<Reservation>[] = [
  {
    accessorKey: "court",
    header: "Court",
    cell: ({ row }) => `Court ${row.getValue("court")}`,
  },
  {
    accessorKey: "reservedTo",
    header: "Reserved To",
  },
  {
    accessorKey: "reservedBy",
    header: "Reserved By",
  },
  {
    accessorKey: "time",
    header: "Time",
  },
  {
    accessorKey: "paid",
    header: "Status",
    meta: { className: "w-[384px] text-center" },
    cell: ({ row }) =>
      row.getValue("paid") ? (
        <div className="flex justify-center">
          <Badge variant="default">Paid</Badge>
        </div>
      ) : (
        <div className="flex justify-center">
          <Badge variant="outline">Unpaid</Badge>
        </div>
      ),
  },
  {
    id: "actions",
    enableSorting: false,
    meta: { className: "text-right" },
    cell: ({ row }) => <ReservationActions reservation={row.original} />,
  },
]

// --- Page ---

function ReservationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage court reservations.
          </p>
        </div>
        <NewReservationDrawer
          trigger={
            <Button size="sm">
              <IconPlus className="size-4" />
              New Reservation
            </Button>
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Today's Timeline</h2>
        <CourtTimeline />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">All Reservations</h2>
        <DataTable
          columns={columns}
          data={reservations}
          searchPlaceholder="Search reservations..."
        />
      </section>
    </div>
  )
}
