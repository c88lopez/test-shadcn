import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { ensurePermission } from "@/lib/route-guards"
import type { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NewClubDrawer } from "@/components/new-club-drawer"
import {
  createClub,
  deleteClub,
  listClubs,
  updateClub,
} from "@/lib/clubs.functions"
import type { ClubRecord } from "@/lib/clubs.functions"

export const Route = createFileRoute("/_authenticated/settings/clubs")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "clubs:manage"),
  loader: async () => ({ clubs: await listClubs() }),
  component: ClubsSettingsPage,
})

function ClubActions({ club }: { club: ClubRecord }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isDefault = club.slug === "default"

  async function handleDelete() {
    try {
      await deleteClub({ data: { id: club.id } })
      toast.success(t("settings.clubs.deleted"), {
        description: t("settings.clubs.deletedDescription", {
          name: club.name,
        }),
      })
      router.invalidate()
    } catch (error) {
      toast.error(t("settings.clubs.deleteError"), {
        description:
          error instanceof Error ? error.message : t("common.tryAgain"),
      })
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <NewClubDrawer
        club={{
          name: club.name,
          status: club.status === "inactive" ? "inactive" : "active",
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (data) => {
          await updateClub({ data: { id: club.id, ...data } })
          router.invalidate()
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <IconDotsVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={isDefault}
            onClick={() => setConfirmOpen(true)}
          >
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.clubs.deleteTitle", { name: club.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.clubs.deleteConfirmLead")}{" "}
              <strong>{t("settings.clubs.deleteConfirmEmphasis")}</strong>{" "}
              {t("settings.clubs.deleteConfirmRest", {
                count: club.memberCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function buildColumns(t: TFunction): ColumnDef<ClubRecord>[] {
  return [
    {
      accessorKey: "name",
      header: t("settings.clubs.colName"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: t("settings.clubs.colSlug"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.slug}</span>
      ),
    },
    {
      accessorKey: "memberCount",
      header: t("settings.clubs.colMembers"),
      cell: ({ row }) => row.original.memberCount,
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) =>
        row.original.status === "active" ? (
          <Badge variant="default">{t("options.active")}</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {t("options.inactive")}
          </Badge>
        ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => <ClubActions club={row.original} />,
    },
  ]
}

function ClubsSettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { clubs } = Route.useLoaderData()

  const columns = useMemo(() => buildColumns(t), [t])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">{t("settings.clubs.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.clubs.description")}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={clubs}
        searchPlaceholder={t("settings.clubs.searchPlaceholder")}
        exportFileName="clubs"
        action={
          <NewClubDrawer
            onSave={async (data) => {
              await createClub({ data })
              router.invalidate()
            }}
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                {t("settings.clubs.newButton")}
              </Button>
            }
          />
        }
      />
    </div>
  )
}
