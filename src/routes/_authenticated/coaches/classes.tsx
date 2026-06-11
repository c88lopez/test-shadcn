import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
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
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("coaches:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteClass({ data: { id: coachClass.id } })
      toast.success(t("pages.classes.deleted"))
      router.invalidate()
    } catch {
      toast.error(t("pages.classes.deleteError"), {
        description: t("common.tryAgain"),
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
  t: TFunction,
  canManage: boolean,
  coaches: Coach[]
): ColumnDef<ClassRecord>[] {
  const statusLabel: Record<ClassStatus, string> = {
    Upcoming: t("pages.classes.statusUpcoming"),
    Ongoing: t("pages.classes.statusOngoing"),
    Completed: t("pages.classes.statusCompleted"),
  }

  const columns: ColumnDef<ClassRecord>[] = [
    {
      accessorKey: "coachName",
      header: t("fields.coach"),
    },
    {
      accessorKey: "court",
      header: t("fields.court"),
      cell: ({ row }) =>
        t("stats.court", { court: row.getValue<number>("court") }),
    },
    {
      accessorKey: "date",
      header: t("fields.date"),
    },
    {
      accessorKey: "startTime",
      header: t("pages.classes.time"),
    },
    {
      id: "duration",
      header: t("fields.duration"),
      cell: ({ row }) => formatDuration(row.original.durationMinutes),
    },
    {
      id: "status",
      header: t("common.status"),
      meta: { className: "text-center" },
      cell: ({ row }) => {
        const c = row.original
        const status = classStatus(c.date, c.startTime, c.durationMinutes)
        return (
          <div className="flex justify-center">
            <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
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
  const columns = useMemo(
    () => buildColumns(t, canManage, coaches),
    [t, canManage, coaches]
  )

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
        searchPlaceholder={t("pages.classes.searchPlaceholder")}
        exportFileName="classes"
        action={
          canManage ? (
            <NewClassDrawer
              coaches={coaches}
              onSaved={() => router.invalidate()}
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  {t("pages.classes.newButton")}
                </Button>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
