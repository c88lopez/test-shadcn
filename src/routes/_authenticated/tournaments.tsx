import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"
import { parseISO } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { NewTournamentDrawer } from "@/components/new-tournament-drawer"
import type { TournamentData } from "@/components/new-tournament-drawer"
import { RowActions } from "@/components/row-actions"
import { deleteTournament, listTournaments } from "@/lib/tournaments.functions"
import { useCan } from "@/hooks/use-permissions"
import type { TranslationKey } from "@/lib/i18n"
import type { Tournament } from "@/db/schema"

export const Route = createFileRoute("/_authenticated/tournaments")({
  loader: async () => ({ tournaments: await listTournaments() }),
  component: TournamentsPage,
})

const FORMAT_LABEL_KEYS: Record<string, TranslationKey | undefined> = {
  round_robin: "options.roundRobin",
  elimination: "options.singleElimination",
  double_elimination: "options.doubleElimination",
}

function toFormat(value: string): TournamentData["format"] {
  return value === "elimination" || value === "double_elimination"
    ? value
    : "round_robin"
}

function TournamentActions({ tournament }: { tournament: Tournament }) {
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("tournaments:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteTournament({ data: { id: tournament.id } })
      toast.success(t("pages.tournaments.deleted"), {
        description: tournament.name,
      })
      router.invalidate()
    } catch {
      toast.error(t("pages.tournaments.deleteError"), {
        description: t("common.tryAgain"),
      })
    }
  }

  if (!canManage) return null

  return (
    <>
      <NewTournamentDrawer
        tournament={{
          id: tournament.id,
          name: tournament.name,
          date: parseISO(tournament.date),
          category: tournament.category,
          format: toFormat(tournament.format),
          maxTeams: tournament.maxTeams,
        }}
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
  canManage: boolean
): ColumnDef<Tournament>[] {
  const columns: ColumnDef<Tournament>[] = [
    {
      accessorKey: "name",
      header: t("forms.tournament.nameLabel"),
    },
    {
      accessorKey: "date",
      header: t("fields.date"),
      cell: ({ row }) =>
        parseISO(row.getValue<string>("date")).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      accessorKey: "category",
      header: t("fields.category"),
    },
    {
      accessorKey: "format",
      header: t("forms.tournament.formatLabel"),
      cell: ({ row }) => {
        const key = FORMAT_LABEL_KEYS[row.getValue<string>("format")]
        return key ? t(key) : row.getValue<string>("format")
      },
    },
    {
      accessorKey: "maxTeams",
      header: t("forms.tournament.maxTeamsLabel"),
      meta: { className: "text-right" },
    },
  ]

  if (canManage) {
    columns.push({
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => <TournamentActions tournament={row.original} />,
    })
  }

  return columns
}

function TournamentsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("tournaments:manage")
  const { tournaments } = Route.useLoaderData()
  const columns = useMemo(() => buildColumns(t, canManage), [t, canManage])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {t("pages.tournaments.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pages.tournaments.description")}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={tournaments}
        searchPlaceholder={t("pages.tournaments.searchPlaceholder")}
        exportFileName="tournaments"
        action={
          canManage ? (
            <NewTournamentDrawer
              onSaved={() => router.invalidate()}
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  {t("pages.tournaments.newButton")}
                </Button>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
