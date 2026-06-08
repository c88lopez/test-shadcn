import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import {
  IconPlus,
  IconTrophy,
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
import type { Player as DbPlayer } from "@/db/schema"

export const Route = createFileRoute("/_authenticated/players")({
  loader: async () => ({ players: await listPlayers() }),
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

// --- Mock stats data (would come from server once reservations/tournaments
// are migrated). Kept illustrative for now. ---
const reservationCounts: Record<string, number> = {
  "Carlos López": 18,
  "Pedro Sánchez": 12,
  "Diego Ruiz": 9,
  "Javier Moreno": 14,
  "Miguel Álvarez": 21,
  "Antonio Díaz": 7,
  "Francisco Pérez": 11,
  "Roberto Martín": 16,
  "Alejandro Castro": 19,
  "Sergio Navarro": 8,
  "Maria García": 22,
  "Ana Martínez": 6,
  "Laura Fernández": 13,
  "Sofía Torres": 17,
  "Isabel Jiménez": 10,
  "Elena Romero": 5,
  "Carmen López": 15,
  "Lucía González": 20,
  "Patricia Sanz": 9,
  "Marta Iglesias": 14,
}

const tournamentCounts: Record<string, number> = {
  "Carlos López": 4,
  "Pedro Sánchez": 2,
  "Diego Ruiz": 1,
  "Javier Moreno": 3,
  "Miguel Álvarez": 6,
  "Antonio Díaz": 2,
  "Francisco Pérez": 1,
  "Roberto Martín": 5,
  "Alejandro Castro": 4,
  "Sergio Navarro": 2,
  "Maria García": 7,
  "Ana Martínez": 1,
  "Laura Fernández": 3,
  "Sofía Torres": 5,
  "Isabel Jiménez": 2,
  "Elena Romero": 1,
  "Carmen López": 4,
  "Lucía González": 6,
  "Patricia Sanz": 2,
  "Marta Iglesias": 3,
}

const topReservationPlayer = Object.entries(reservationCounts).sort(
  (a, b) => b[1] - a[1]
)[0]
const topTournamentPlayer = Object.entries(tournamentCounts).sort(
  (a, b) => b[1] - a[1]
)[0]

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
  const { players } = Route.useLoaderData()

  const maleCount = players.filter((p) => p.gender === "Male").length
  const femaleCount = players.filter((p) => p.gender === "Female").length
  const c4Count = players.filter((p) => p.category === "C4").length

  const categoryDistribution = CATEGORY_ORDER.map((category) => ({
    category,
    count: players.filter((p) => p.category === category).length,
    fill: CATEGORY_FILL[category],
  }))

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
              {topReservationPlayer[0]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {topReservationPlayer[1]} reservations this season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Most Tournaments
            </CardTitle>
            <IconTrophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-xl font-bold">
              {topTournamentPlayer[0]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {topTournamentPlayer[1]} tournaments played
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Top Category (M)
            </CardTitle>
            <IconMedal className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">C4</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {c4Count} players at highest level
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
          <NewPlayerDrawer
            onSaved={() => router.invalidate()}
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                New Player
              </Button>
            }
          />
        }
      />
    </div>
  )
}
