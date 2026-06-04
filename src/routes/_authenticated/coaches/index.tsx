import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"
import { differenceInYears } from "date-fns"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { NewCoachDrawer } from "@/components/new-coach-drawer"
import type { CoachData } from "@/components/new-coach-drawer"
import { RowActions } from "@/components/row-actions"

export const Route = createFileRoute("/_authenticated/coaches/")({
  component: CoachesPage,
})

interface Coach extends CoachData {
  id: number
}

const coaches: Coach[] = [
  { id: 1, name: "Marcos Delgado", phone: "+34 611 234 567", birthday: new Date("1985-03-12") },
  { id: 2, name: "Elena Vidal",    phone: "+34 622 345 678", birthday: new Date("1990-07-24") },
  { id: 3, name: "Rubén Fernández",phone: "+34 633 456 789", birthday: new Date("1988-11-05") },
  { id: 4, name: "Patricia Ríos",  phone: "+34 644 567 890", birthday: new Date("1993-02-18") },
  { id: 5, name: "Jorge Salinas",  phone: "+34 655 678 901", birthday: new Date("1979-09-30") },
]

function CoachActions({ coach }: { coach: Coach }) {
  const [editOpen, setEditOpen] = useState(false)
  return (
    <>
      <NewCoachDrawer coach={coach} open={editOpen} onOpenChange={setEditOpen} />
      <RowActions
        onEdit={() => setEditOpen(true)}
        onDuplicate={() => console.log("[dummy] duplicate", coach.name)}
        onDelete={() => console.log("[dummy] delete", coach.name)}
      />
    </>
  )
}

const columns: ColumnDef<Coach>[] = [
  {
    accessorKey: "name",
    header: "Full Name",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    enableSorting: false,
  },
  {
    accessorKey: "birthday",
    header: "Birthday",
    cell: ({ row }) => {
      const date = row.getValue<Date>("birthday")
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    },
  },
  {
    id: "age",
    header: "Age",
    cell: ({ row }) => {
      const age = differenceInYears(new Date(), row.original.birthday)
      return `${age} yrs`
    },
  },
  {
    id: "actions",
    enableSorting: false,
    meta: { className: "text-right" },
    cell: ({ row }) => <CoachActions coach={row.original} />,
  },
]

function CoachesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Coaches</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage club coaches.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={coaches}
        searchPlaceholder="Search coaches..."
        action={
          <NewCoachDrawer
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                New Coach
              </Button>
            }
          />
        }
      />
    </div>
  )
}
