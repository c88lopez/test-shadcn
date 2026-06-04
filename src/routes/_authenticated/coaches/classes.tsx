import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { NewClassDrawer } from "@/components/new-class-drawer"

export const Route = createFileRoute("/_authenticated/coaches/classes")({
  component: ClassesPage,
})

type ClassStatus = "Upcoming" | "Ongoing" | "Completed"

interface CoachClass {
  id: number
  coach: string
  court: number
  date: string
  time: string
  duration: string
  status: ClassStatus
}

const classesData: CoachClass[] = [
  {
    id: 1,
    coach: "Marcos Delgado",
    court: 1,
    date: "2026-06-03",
    time: "09:00",
    duration: "90 min",
    status: "Ongoing",
  },
  {
    id: 2,
    coach: "Elena Vidal",
    court: 3,
    date: "2026-06-03",
    time: "10:30",
    duration: "60 min",
    status: "Upcoming",
  },
  {
    id: 3,
    coach: "Rubén Fernández",
    court: 5,
    date: "2026-06-03",
    time: "12:00",
    duration: "90 min",
    status: "Upcoming",
  },
  {
    id: 4,
    coach: "Patricia Ríos",
    court: 2,
    date: "2026-06-02",
    time: "08:00",
    duration: "60 min",
    status: "Completed",
  },
  {
    id: 5,
    coach: "Jorge Salinas",
    court: 4,
    date: "2026-06-02",
    time: "10:00",
    duration: "120 min",
    status: "Completed",
  },
  {
    id: 6,
    coach: "Marcos Delgado",
    court: 6,
    date: "2026-06-02",
    time: "17:00",
    duration: "90 min",
    status: "Completed",
  },
  {
    id: 7,
    coach: "Elena Vidal",
    court: 1,
    date: "2026-06-01",
    time: "09:30",
    duration: "60 min",
    status: "Completed",
  },
  {
    id: 8,
    coach: "Rubén Fernández",
    court: 3,
    date: "2026-06-01",
    time: "11:00",
    duration: "90 min",
    status: "Completed",
  },
  {
    id: 9,
    coach: "Patricia Ríos",
    court: 2,
    date: "2026-06-04",
    time: "08:00",
    duration: "60 min",
    status: "Upcoming",
  },
  {
    id: 10,
    coach: "Jorge Salinas",
    court: 5,
    date: "2026-06-04",
    time: "10:00",
    duration: "120 min",
    status: "Upcoming",
  },
]

const statusVariant: Record<ClassStatus, "default" | "secondary" | "outline"> =
  {
    Upcoming: "secondary",
    Ongoing: "default",
    Completed: "outline",
  }

const columns: ColumnDef<CoachClass>[] = [
  {
    accessorKey: "coach",
    header: "Coach",
  },
  {
    accessorKey: "court",
    header: "Court",
    cell: ({ row }) => `Court ${row.getValue("court")}`,
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "time",
    header: "Time",
  },
  {
    accessorKey: "duration",
    header: "Duration",
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { className: "w-[416px] text-center" },
    cell: ({ row }) => {
      const status = row.getValue<ClassStatus>("status")
      return (
        <div className="flex justify-center">
          <Badge variant={statusVariant[status]}>{status}</Badge>
        </div>
      )
    },
  },
]

function ClassesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Classes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Coach-led sessions linked to reserved courts.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={classesData}
        searchPlaceholder="Search classes..."
        action={
          <NewClassDrawer
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                New Class
              </Button>
            }
          />
        }
      />
    </div>
  )
}
