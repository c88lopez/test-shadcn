import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPencil, IconPlus, IconTrophy, IconUsers, IconCalendar, IconMedal } from "@tabler/icons-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DataTable } from "@/components/data-table"
import { NewPlayerDrawer } from "@/components/new-player-drawer"

export const Route = createFileRoute("/_authenticated/players")({
  component: PlayersPage,
})

type MaleCategory = "C8" | "C7" | "C6" | "C5" | "C4"
type FemaleCategory = "D8" | "D7" | "D6" | "D5" | "D4"
type Category = MaleCategory | FemaleCategory

interface Player {
  id: number
  fullName: string
  email: string
  phone: string
  age: number
  gender: "Male" | "Female"
  category: Category
}

const players: Player[] = [
  {
    id: 1,
    fullName: "Carlos López",
    email: "carlos.lopez@email.com",
    phone: "+34 623 456 789",
    age: 35,
    gender: "Male",
    category: "C6",
  },
  {
    id: 2,
    fullName: "Pedro Sánchez",
    email: "pedro.sanchez@email.com",
    phone: "+34 645 678 901",
    age: 41,
    gender: "Male",
    category: "C5",
  },
  {
    id: 3,
    fullName: "Diego Ruiz",
    email: "diego.ruiz@email.com",
    phone: "+34 667 890 123",
    age: 25,
    gender: "Male",
    category: "C8",
  },
  {
    id: 4,
    fullName: "Javier Moreno",
    email: "javier.moreno@email.com",
    phone: "+34 689 012 345",
    age: 38,
    gender: "Male",
    category: "C5",
  },
  {
    id: 5,
    fullName: "Miguel Álvarez",
    email: "miguel.alvarez@email.com",
    phone: "+34 601 234 567",
    age: 45,
    gender: "Male",
    category: "C4",
  },
  {
    id: 6,
    fullName: "Antonio Díaz",
    email: "antonio.diaz@email.com",
    phone: "+34 623 456 780",
    age: 52,
    gender: "Male",
    category: "C7",
  },
  {
    id: 7,
    fullName: "Francisco Pérez",
    email: "francisco.perez@email.com",
    phone: "+34 645 678 902",
    age: 24,
    gender: "Male",
    category: "C8",
  },
  {
    id: 8,
    fullName: "Roberto Martín",
    email: "roberto.martin@email.com",
    phone: "+34 667 890 124",
    age: 43,
    gender: "Male",
    category: "C5",
  },
  {
    id: 9,
    fullName: "Alejandro Castro",
    email: "alex.castro@email.com",
    phone: "+34 689 012 346",
    age: 39,
    gender: "Male",
    category: "C4",
  },
  {
    id: 10,
    fullName: "Sergio Navarro",
    email: "sergio.navarro@email.com",
    phone: "+34 611 223 344",
    age: 31,
    gender: "Male",
    category: "C6",
  },
  {
    id: 11,
    fullName: "Maria García",
    email: "maria.garcia@email.com",
    phone: "+34 612 345 678",
    age: 28,
    gender: "Female",
    category: "D6",
  },
  {
    id: 12,
    fullName: "Ana Martínez",
    email: "ana.martinez@email.com",
    phone: "+34 634 567 890",
    age: 22,
    gender: "Female",
    category: "D8",
  },
  {
    id: 13,
    fullName: "Laura Fernández",
    email: "laura.fernandez@email.com",
    phone: "+34 656 789 012",
    age: 30,
    gender: "Female",
    category: "D7",
  },
  {
    id: 14,
    fullName: "Sofía Torres",
    email: "sofia.torres@email.com",
    phone: "+34 678 901 234",
    age: 33,
    gender: "Female",
    category: "D4",
  },
  {
    id: 15,
    fullName: "Isabel Jiménez",
    email: "isabel.jimenez@email.com",
    phone: "+34 690 123 456",
    age: 27,
    gender: "Female",
    category: "D6",
  },
  {
    id: 16,
    fullName: "Elena Romero",
    email: "elena.romero@email.com",
    phone: "+34 612 345 679",
    age: 29,
    gender: "Female",
    category: "D8",
  },
  {
    id: 17,
    fullName: "Carmen López",
    email: "carmen.lopez@email.com",
    phone: "+34 634 567 891",
    age: 31,
    gender: "Female",
    category: "D5",
  },
  {
    id: 18,
    fullName: "Lucía González",
    email: "lucia.gonzalez@email.com",
    phone: "+34 656 789 013",
    age: 36,
    gender: "Female",
    category: "D4",
  },
  {
    id: 19,
    fullName: "Patricia Sanz",
    email: "patricia.sanz@email.com",
    phone: "+34 678 901 235",
    age: 26,
    gender: "Female",
    category: "D7",
  },
  {
    id: 20,
    fullName: "Marta Iglesias",
    email: "marta.iglesias@email.com",
    phone: "+34 699 334 455",
    age: 34,
    gender: "Female",
    category: "D5",
  },
]

// --- Mock stats data (would come from server in a real app) ---
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
  (a, b) => b[1] - a[1],
)[0]
const topTournamentPlayer = Object.entries(tournamentCounts).sort(
  (a, b) => b[1] - a[1],
)[0]

const categoryDistribution = [
  { category: "C4", count: 2, fill: "var(--chart-1)" },
  { category: "C5", count: 3, fill: "var(--chart-2)" },
  { category: "C6", count: 2, fill: "var(--chart-3)" },
  { category: "C7", count: 1, fill: "var(--chart-4)" },
  { category: "C8", count: 2, fill: "var(--chart-5)" },
  { category: "D4", count: 2, fill: "var(--chart-1)" },
  { category: "D5", count: 2, fill: "var(--chart-2)" },
  { category: "D6", count: 2, fill: "var(--chart-3)" },
  { category: "D7", count: 2, fill: "var(--chart-4)" },
  { category: "D8", count: 2, fill: "var(--chart-5)" },
]

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
    cell: ({ row }) => {
      const cat = row.getValue<Category>("category")
      return <Badge variant={levelVariant[cat]}>{cat}</Badge>
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
    cell: () => (
      <Button variant="ghost" size="icon" className="size-8">
        <IconPencil className="size-4" />
      </Button>
    ),
  },
]

function PlayersPage() {
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
            <IconUsers className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{players.length}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {players.filter((p) => p.gender === "Male").length}M ·{" "}
              {players.filter((p) => p.gender === "Female").length}F
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Most Reservations
            </CardTitle>
            <IconCalendar className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-xl font-bold">
              {topReservationPlayer[0]}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {topReservationPlayer[1]} reservations this season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Most Tournaments
            </CardTitle>
            <IconTrophy className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-xl font-bold">
              {topTournamentPlayer[0]}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {topTournamentPlayer[1]} tournaments played
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Top Category (M)
            </CardTitle>
            <IconMedal className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">C4</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {players.filter((p) => p.category === "C4").length} players at
              highest level
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
          <ChartContainer
            config={categoryChartConfig}
            className="h-40 w-full"
          >
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
