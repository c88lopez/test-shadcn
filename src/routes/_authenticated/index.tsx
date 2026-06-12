import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
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

export const Route = createFileRoute("/_authenticated/")({
  loader: async () => ({ stats: await getOverviewStats() }),
  component: Dashboard,
})

function buildCourtsChartConfig(t: TFunction): ChartConfig {
  return {
    occupied: { label: t("pages.dashboard.occupied"), color: "var(--chart-1)" },
    available: {
      label: t("pages.dashboard.available"),
      color: "var(--chart-2)",
    },
  }
}

function buildWeeklyChartConfig(t: TFunction): ChartConfig {
  return {
    reservations: {
      label: t("pages.dashboard.chartReservations"),
      color: "var(--chart-1)",
    },
  }
}

function buildSubscribersChartConfig(t: TFunction): ChartConfig {
  return {
    subscribers: {
      label: t("pages.dashboard.chartSubscribers"),
      color: "var(--chart-1)",
    },
  }
}

function Dashboard() {
  const { t } = useTranslation()
  const { stats } = Route.useLoaderData()
  const courtsChartConfig = useMemo(() => buildCourtsChartConfig(t), [t])
  const weeklyChartConfig = useMemo(() => buildWeeklyChartConfig(t), [t])
  const subscribersChartConfig = useMemo(
    () => buildSubscribersChartConfig(t),
    [t]
  )

  const totalCourts = stats.activeCourts
  const occupied = Math.min(stats.courtsOccupiedNow, totalCourts)
  const available = Math.max(totalCourts - occupied, 0)

  const courtsChartData = [
    { status: "Occupied", count: occupied, fill: "var(--chart-1)" },
    { status: "Available", count: available, fill: "var(--chart-2)" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pages.dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pages.dashboard.description")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Courts status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("pages.dashboard.courts")}
            </CardTitle>
            <CardDescription>
              {t("pages.dashboard.currentOccupancy")}
            </CardDescription>
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
                {occupied} {t("pages.dashboard.occupied")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--chart-2)]" />
                {available} {t("pages.dashboard.available")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Today's bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("pages.dashboard.todaysBookings")}
            </CardTitle>
            <CardDescription>
              {t("pages.dashboard.reservationsForToday")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <IconCalendar className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.todayTotal}</p>
              <p className="text-sm text-muted-foreground">
                {t("pages.dashboard.reservationsLabel")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly total */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("pages.dashboard.thisWeek")}
            </CardTitle>
            <CardDescription>
              {t("pages.dashboard.totalReservations")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <IconChartBar className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.weeklyTotal}</p>
              <p className="text-sm text-muted-foreground">
                {t("pages.dashboard.reservationsLabel")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.dashboard.reservationsThisWeek")}</CardTitle>
          <CardDescription>
            {t("pages.dashboard.reservationsPerDay")}
          </CardDescription>
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
          <CardTitle>{t("pages.dashboard.courtSubscribers")}</CardTitle>
          <CardDescription>
            {t("pages.dashboard.subscribersSummary", {
              total: stats.subscribersTotal,
              growth: stats.subscribersGrowth,
            })}
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
          <CardTitle>{t("pages.dashboard.todaysReservations")}</CardTitle>
          <CardDescription>
            {t("pages.dashboard.allBookingsToday")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.court")}</TableHead>
                <TableHead>{t("pages.dashboard.account")}</TableHead>
                <TableHead>{t("pages.dashboard.time")}</TableHead>
                <TableHead className="text-right">
                  {t("common.status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.today.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {t("pages.dashboard.noReservationsToday")}
                  </TableCell>
                </TableRow>
              ) : (
                stats.today.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {t("stats.court", { court: r.court })}
                    </TableCell>
                    <TableCell>{r.player}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell className="text-right">
                      {r.paid ? (
                        <Badge variant="default">{t("options.paid")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("options.unpaid")}</Badge>
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
