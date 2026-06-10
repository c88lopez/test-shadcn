import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import {
  IconPlus,
  IconLayoutGrid,
  IconUsers,
  IconCalendar,
  IconMedal,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DataTable } from "@/components/data-table"
import { NewPlayerDrawer } from "@/components/new-player-drawer"
import { RowActions } from "@/components/row-actions"
import { deletePlayer, listPlayers } from "@/lib/players.functions"
import { getPlayerStats } from "@/lib/stats.functions"
import { useCan } from "@/hooks/use-permissions"
import type { Player as DbPlayer } from "@/db/schema"

export const Route = createFileRoute("/_authenticated/players")({
  loader: async () => ({
    players: await listPlayers(),
    stats: await getPlayerStats(),
  }),
  component: PlayersPage,
})

type Player = DbPlayer

const CATEGORY_ORDER = [
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "D4",
  "D5",
  "D6",
  "D7",
  "D8",
] as const

const CATEGORY_FILL: Record<string, string> = {
  C4: "var(--chart-1)",
  C5: "var(--chart-2)",
  C6: "var(--chart-3)",
  C7: "var(--chart-4)",
  C8: "var(--chart-5)",
  D4: "var(--chart-1)",
  D5: "var(--chart-2)",
  D6: "var(--chart-3)",
  D7: "var(--chart-4)",
  D8: "var(--chart-5)",
}

const categoryChartConfig = {
  count: { label: "Players" },
} satisfies ChartConfig

// --- Higher level (C4/D4) = bolder badge; lower level (C8/D8) = muted
const levelVariant: Record<string, "default" | "secondary" | "outline"> = {
  C4: "default",
  C5: "default",
  C6: "secondary",
  C7: "secondary",
  C8: "outline",
  D4: "default",
  D5: "default",
  D6: "secondary",
  D7: "secondary",
  D8: "outline",
}

function PlayerActions({ player }: { player: Player }) {
  const router = useRouter()
  const canManage = useCan("players:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deletePlayer({ data: { id: player.id } })
      toast.success("Player deleted", { description: player.fullName })
      router.invalidate()
    } catch {
      toast.error("Could not delete player", {
        description: "Please try again.",
      })
    }
  }

  if (!canManage) return null

  return (
    <>
      <NewPlayerDrawer
        player={{ ...player, gender: player.gender as "Male" | "Female" }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => router.invalidate()}
      />
      <RowActions onEdit={() => setEditOpen(true)} onDelete={handleDelete} />
    </>
  )
}

const columns: ColumnDef<Player>[] = [
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("gender")}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    meta: { className: "w-[384px] text-center" },
    cell: ({ row }) => {
      const cat = row.getValue<string>("category")
      return (
        <div className="flex justify-center">
          <Badge variant={levelVariant[cat]}>{cat}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    enableSorting: false,
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    id: "actions",
    enableSorting: false,
    meta: { className: "text-right" },
    cell: ({ row }) => <PlayerActions player={row.original} />,
  },
]

function PlayersPage() {
  const router = useRouter()
  const canManage = useCan("players:manage")
  const { players, stats } = Route.useLoaderData()

  const maleCount = players.filter((p) => p.gender === "Male").length
  const femaleCount = players.filter((p) => p.gender === "Female").length

  const categoryDistribution = CATEGORY_ORDER.map((category) => ({
    category,
    count: players.filter((p) => p.category === category).length,
    fill: CATEGORY_FILL[category],
  }))

  const topCategory = categoryDistribution.reduce(
    (best, c) => (c.count > best.count ? c : best),
    { category: "—", count: 0 }
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Players</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage club members.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <IconUsers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{players.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {maleCount}M · {femaleCount}F
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Most Reservations
            </CardTitle>
            <IconCalendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-xl font-bold">
              {stats.topReservationPlayer?.name ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.topReservationPlayer
                ? `${stats.topReservationPlayer.count} ${stats.topReservationPlayer.count === 1 ? "reservation" : "reservations"}`
                : "No reservations yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Busiest Court</CardTitle>
            <IconLayoutGrid className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-xl font-bold">
              {stats.busiestCourt ? `Court ${stats.busiestCourt.court}` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.busiestCourt
                ? `${stats.busiestCourt.count} ${stats.busiestCourt.count === 1 ? "reservation" : "reservations"}`
                : "No reservations yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <IconMedal className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{topCategory.category}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {topCategory.count} players
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoryChartConfig} className="h-40 w-full">
            <BarChart data={categoryDistribution} barSize={28}>
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis hide />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                cursor={false}
              />
              <Bar dataKey="count" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={players}
        searchPlaceholder="Search players..."
        action={
          canManage ? (
            <NewPlayerDrawer
              onSaved={() => router.invalidate()}
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  New Player
                </Button>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
