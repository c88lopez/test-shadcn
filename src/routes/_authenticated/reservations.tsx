import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPencil, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"

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
    time: "10:00 – 11:30",
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
    time: "17:00 – 18:30",
    paid: false,
  },
  {
    id: 12,
    court: 2,
    reservedTo: "Antonio Díaz",
    reservedBy: "Antonio Díaz",
    time: "19:00 – 20:30",
    paid: true,
  },
  {
    id: 13,
    court: 6,
    reservedTo: "Carmen López",
    reservedBy: "Admin",
    time: "10:30 – 12:00",
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
    cell: ({ row }) =>
      row.getValue("paid") ? (
        <Badge variant="default">Paid</Badge>
      ) : (
        <Badge variant="outline">Unpaid</Badge>
      ),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: () => (
      <Button variant="ghost" size="icon" className="size-8">
        <IconPencil className="size-4" />
      </Button>
    ),
  },
]

function ReservationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reservations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage court reservations.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={reservations}
        searchPlaceholder="Search reservations..."
        action={
          <Button size="sm">
            <IconPlus className="size-4" />
            New Reservation
          </Button>
        }
      />
    </div>
  )
}
