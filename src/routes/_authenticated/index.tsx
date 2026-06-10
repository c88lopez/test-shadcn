import { createFileRoute } from "@tanstack/react-router"
import { IconCalendar, IconChartBar } from "@tabler/icons-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getOverviewStats } from "@/lib/stats.functions"
import { useAppSettings } from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/")({
  loader: async () => ({ stats: await getOverviewStats() }),
  component: Dashboard,
})

const courtsChartConfig = {
  occupied: { label: "Occupied", color: "var(--chart-1)" },
  available: { label: "Available", color: "var(--chart-2)" },
} satisfies ChartConfig

const weeklyChartConfig = {
  reservations: { label: "Reservations", color: "var(--chart-1)" },
} satisfies ChartConfig

const subscribersChartConfig = {
  subscribers: { label: "Subscribers", color: "var(--chart-1)" },
} satisfies ChartConfig

function Dashboard() {
  const { stats } = Route.useLoaderData()
  const settings = useAppSettings()

  const totalCourts = settings.reservations.courts.filter(
    (c) => c.active
  ).length
  const occupied = Math.min(stats.courtsOccupiedNow, totalCourts)
  const available = Math.max(totalCourts - occupied, 0)

  const courtsChartData = [
    { status: "Occupied", count: occupied, fill: "var(--chart-1)" },
    { status: "Available", count: available, fill: "var(--chart-2)" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Padel club overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Courts status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Courts</CardTitle>
            <CardDescription>Current occupancy</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <ChartContainer
              config={courtsChartConfig}
              className="h-[120px] w-[120px]"
            >
              <PieChart>
                <Pie
                  data={courtsChartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              </PieChart>
            </ChartContainer>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--chart-1)]" />
                {occupied} Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--chart-2)]" />
                {available} Available
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Today's bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Today's Bookings
            </CardTitle>
            <CardDescription>Reservations for today</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <IconCalendar className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.todayTotal}</p>
              <p className="text-sm text-muted-foreground">reservations</p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly total */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CardDescription>Total reservations</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <IconChartBar className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.weeklyTotal}</p>
              <p className="text-sm text-muted-foreground">reservations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reservations this week</CardTitle>
          <CardDescription>Number of reservations per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={weeklyChartConfig}
            className="h-[220px] w-full"
          >
            <BarChart
              data={stats.weekly}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="reservations"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Court subscribers */}
      <Card>
        <CardHeader>
          <CardTitle>Court Subscribers</CardTitle>
          <CardDescription>
            {stats.subscribersTotal} active members · +{stats.subscribersGrowth}{" "}
            in the last 7 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={subscribersChartConfig}
            className="h-[220px] w-full"
          >
            <AreaChart
              data={stats.subscribers}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="fillSubscribers"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="subscribers"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#fillSubscribers)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Today's reservations table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Reservations</CardTitle>
          <CardDescription>All bookings scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Court</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.today.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No reservations scheduled for today.
                  </TableCell>
                </TableRow>
              ) : (
                stats.today.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      Court {r.court}
                    </TableCell>
                    <TableCell>{r.player}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell className="text-right">
                      {r.paid ? (
                        <Badge variant="default">Paid</Badge>
                      ) : (
                        <Badge variant="outline">Unpaid</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
