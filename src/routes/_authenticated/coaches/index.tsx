import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"
import { differenceInYears, parseISO } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { NewCoachDrawer } from "@/components/new-coach-drawer"
import { RowActions } from "@/components/row-actions"
import { deleteCoach, listCoaches } from "@/lib/coaches.functions"
import { useCan } from "@/hooks/use-permissions"
import type { Coach } from "@/db/schema"

export const Route = createFileRoute("/_authenticated/coaches/")({
  loader: async () => ({ coaches: await listCoaches() }),
  component: CoachesPage,
})

function CoachActions({ coach }: { coach: Coach }) {
  const router = useRouter()
  const canManage = useCan("coaches:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteCoach({ data: { id: coach.id } })
      toast.success("Coach deleted", { description: coach.name })
      router.invalidate()
    } catch {
      toast.error("Could not delete coach", {
        description: "Please try again.",
      })
    }
  }

  if (!canManage) return null

  return (
    <>
      <NewCoachDrawer
        coach={{
          id: coach.id,
          name: coach.name,
          phone: coach.phone,
          birthday: coach.birthday ? parseISO(coach.birthday) : undefined,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => router.invalidate()}
      />
      <RowActions onEdit={() => setEditOpen(true)} onDelete={handleDelete} />
    </>
  )
}

function buildColumns(canManage: boolean): ColumnDef<Coach>[] {
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
        const birthday = row.getValue<string | null>("birthday")
        return birthday
          ? parseISO(birthday).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—"
      },
    },
    {
      id: "age",
      header: "Age",
      cell: ({ row }) =>
        row.original.birthday
          ? `${differenceInYears(new Date(), parseISO(row.original.birthday))} yrs`
          : "—",
    },
  ]

  if (canManage) {
    columns.push({
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => <CoachActions coach={row.original} />,
    })
  }

  return columns
}

function CoachesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("coaches:manage")
  const { coaches } = Route.useLoaderData()
  const columns = buildColumns(canManage)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pages.coaches.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pages.coaches.description")}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={coaches}
        searchPlaceholder="Search coaches..."
        exportFileName="coaches"
        action={
          canManage ? (
            <NewCoachDrawer
              onSaved={() => router.invalidate()}
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  New Coach
                </Button>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
