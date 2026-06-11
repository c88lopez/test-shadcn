import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { NewClassDrawer } from "@/components/new-class-drawer"
import { RowActions } from "@/components/row-actions"
import { listClasses, deleteClass } from "@/lib/classes.functions"
import type { ClassRecord } from "@/lib/classes.functions"
import { listCoaches } from "@/lib/coaches.functions"
import { classStatus, formatDuration } from "@/lib/classes"
import type { ClassStatus } from "@/lib/classes"
import { useCan } from "@/hooks/use-permissions"
import type { Coach } from "@/db/schema"

export const Route = createFileRoute("/_authenticated/coaches/classes")({
  loader: async () => ({
    classes: await listClasses(),
    coaches: await listCoaches(),
  }),
  component: ClassesPage,
})

const statusVariant: Record<ClassStatus, "default" | "secondary" | "outline"> =
  {
    Upcoming: "secondary",
    Ongoing: "default",
    Completed: "outline",
  }

function ClassActions({
  coachClass,
  coaches,
}: {
  coachClass: ClassRecord
  coaches: Coach[]
}) {
  const router = useRouter()
  const canManage = useCan("coaches:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteClass({ data: { id: coachClass.id } })
      toast.success("Class deleted")
      router.invalidate()
    } catch {
      toast.error("Could not delete class", {
        description: "Please try again.",
      })
    }
  }

  if (!canManage) return null

  return (
    <>
      <NewClassDrawer
        coaches={coaches}
        coachClass={coachClass}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => router.invalidate()}
      />
      <RowActions onEdit={() => setEditOpen(true)} onDelete={handleDelete} />
    </>
  )
}

function buildColumns(
  canManage: boolean,
  coaches: Coach[]
): ColumnDef<ClassRecord>[] {
  const columns: ColumnDef<ClassRecord>[] = [
    {
      accessorKey: "coachName",
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
      accessorKey: "startTime",
      header: "Time",
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => formatDuration(row.original.durationMinutes),
    },
    {
      id: "status",
      header: "Status",
      meta: { className: "text-center" },
      cell: ({ row }) => {
        const c = row.original
        const status = classStatus(c.date, c.startTime, c.durationMinutes)
        return (
          <div className="flex justify-center">
            <Badge variant={statusVariant[status]}>{status}</Badge>
          </div>
        )
      },
    },
  ]

  if (canManage) {
    columns.push({
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <ClassActions coachClass={row.original} coaches={coaches} />
      ),
    })
  }

  return columns
}

function ClassesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("coaches:manage")
  const { classes, coaches } = Route.useLoaderData()
  const columns = buildColumns(canManage, coaches)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pages.classes.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pages.classes.description")}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        searchPlaceholder="Search classes..."
        exportFileName="classes"
        action={
          canManage ? (
            <NewClassDrawer
              coaches={coaches}
              onSaved={() => router.invalidate()}
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  New Class
                </Button>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
