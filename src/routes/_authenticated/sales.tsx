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

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesPage,
})

const dailyRevenue = [
  { day: "Mon", revenue: 87.5 },
  { day: "Tue", revenue: 124.0 },
  { day: "Wed", revenue: 95.0 },
  { day: "Thu", revenue: 210.98 },
  { day: "Fri", revenue: 178.5 },
  { day: "Sat", revenue: 245.0 },
  { day: "Sun", revenue: 160.0 },
]

const revenueByCategory = [
  { category: "Drinks", revenue: 76.3, fill: "var(--chart-1)" },
  { category: "Equipment", revenue: 355.92, fill: "var(--chart-2)" },
  { category: "Accessories", revenue: 67.94, fill: "var(--chart-3)" },
]

const topProducts = [
  { name: "Padel Racket (Pro)", sales: 149.99 },
  { name: "Padel Racket (Basic)", sales: 99.98 },
  { name: "Padel Bag", sales: 69.98 },
  { name: "Ball Pack", sales: 55.92 },
  { name: "Energy Drink", sales: 22.5 },
]

const totalRevenue = dailyRevenue.reduce((s, d) => s + d.revenue, 0)
const totalOrders = 15
const bestSeller = "Padel Racket (Pro)"

const revenueChartConfig = {
  revenue: { label: "Revenue (€)", color: "var(--chart-1)" },
} satisfies ChartConfig

const categoryChartConfig = {
  drinks: { label: "Drinks", color: "var(--chart-1)" },
  equipment: { label: "Equipment", color: "var(--chart-2)" },
  accessories: { label: "Accessories", color: "var(--chart-3)" },
} satisfies ChartConfig

const topProductsConfig = {
  sales: { label: "Revenue (€)", color: "var(--chart-2)" },
} satisfies ChartConfig

function SalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sales</h1>
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
              <p className="text-4xl font-bold">€{totalRevenue.toFixed(0)}</p>
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
              <p className="text-4xl font-bold">{totalOrders}</p>
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
              <p className="text-lg leading-tight font-bold">{bestSeller}</p>
              <p className="text-sm text-muted-foreground">€149.99</p>
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
              data={dailyRevenue}
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
                tickFormatter={(v) => `€${v}`}
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
                  {revenueByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {revenueByCategory.map((c) => (
                <span key={c.category} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: c.fill }}
                  />
                  {c.category} · €{c.revenue.toFixed(2)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Revenue by product this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={topProductsConfig}
              className="h-[220px] w-full"
            >
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${v}`}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
