import { createFileRoute } from "@tanstack/react-router"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { IconCoin, IconShoppingCart, IconTrendingUp } from "@tabler/icons-react"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency, getCurrencySymbol } from "@/lib/app-settings"
import { getSalesStats } from "@/lib/stats.functions"

export const Route = createFileRoute("/_authenticated/inventory/dashboard")({
  loader: async () => ({ stats: await getSalesStats() }),
  component: InventoryDashboard,
})

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function InventoryDashboard() {
  const { stats } = Route.useLoaderData()
  const symbol = getCurrencySymbol()

  const revenueChartConfig = {
    revenue: { label: `Revenue (${symbol})`, color: "var(--chart-1)" },
  } satisfies ChartConfig

  const topProductsConfig = {
    sales: { label: `Revenue (${symbol})`, color: "var(--chart-2)" },
  } satisfies ChartConfig

  const revenueByCategory = stats.revenueByCategory.map((c, i) => ({
    ...c,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const categoryChartConfig = Object.fromEntries(
    revenueByCategory.map((c) => [c.category, { label: c.category }])
  ) satisfies ChartConfig

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sales Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Product sales overview for this week.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Weekly Revenue
            </CardTitle>
            <CardDescription>Total product sales</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <IconCoin className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-4xl font-bold">
                {symbol}
                {stats.totalRevenue.toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">this week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <CardDescription>Transactions this week</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <IconShoppingCart className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground">orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Best Seller</CardTitle>
            <CardDescription>Top revenue product</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <IconTrendingUp className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg leading-tight font-bold">
                {stats.bestSeller?.name ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.bestSeller
                  ? formatCurrency(stats.bestSeller.sales)
                  : "No sales this week"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue</CardTitle>
          <CardDescription>
            Revenue from product sales this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={revenueChartConfig}
            className="h-[220px] w-full"
          >
            <AreaChart
              data={stats.dailyRevenue}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${symbol}${v}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="revenue"
                stroke="var(--chart-1)"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Revenue by category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>
              Breakdown of sales by product type
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {revenueByCategory.length === 0 ? (
              <p className="py-12 text-sm text-muted-foreground">
                No sales this week.
              </p>
            ) : (
              <>
                <ChartContainer
                  config={categoryChartConfig}
                  className="h-[180px] w-[180px]"
                >
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      dataKey="revenue"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {revenueByCategory.map((entry) => (
                        <Cell key={entry.category} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  {revenueByCategory.map((c) => (
                    <span
                      key={c.category}
                      className="flex items-center gap-1.5"
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: c.fill }}
                      />
                      {c.category} · {formatCurrency(c.revenue)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Revenue by product this week</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No sales this week.
              </p>
            ) : (
              <ChartContainer
                config={topProductsConfig}
                className="h-[220px] w-full"
              >
                <BarChart
                  data={stats.topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${symbol}${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={130}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="sales"
                    fill="var(--chart-2)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
