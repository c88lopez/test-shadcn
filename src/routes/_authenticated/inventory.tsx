import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPencil } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
})

interface StockItem {
  id: number
  name: string
  category: string
  price: number
  stock: number
}

interface SaleRecord {
  id: number
  item: string
  quantity: number
  date: string
  total: number
}

const stockItems: StockItem[] = [
  {
    id: 1,
    name: "Water Bottle (500ml)",
    category: "Drinks",
    price: 1.5,
    stock: 120,
  },
  { id: 2, name: "Energy Drink", category: "Drinks", price: 2.5, stock: 48 },
  { id: 3, name: "Sports Juice", category: "Drinks", price: 2.0, stock: 60 },
  { id: 4, name: "Isotonic Drink", category: "Drinks", price: 2.2, stock: 35 },
  {
    id: 5,
    name: "Padel Racket (Basic)",
    category: "Equipment",
    price: 49.99,
    stock: 8,
  },
  {
    id: 6,
    name: "Padel Racket (Pro)",
    category: "Equipment",
    price: 149.99,
    stock: 4,
  },
  {
    id: 7,
    name: "Ball Pack (3 units)",
    category: "Equipment",
    price: 6.99,
    stock: 55,
  },
  {
    id: 8,
    name: "Overgrip Tape",
    category: "Accessories",
    price: 3.5,
    stock: 80,
  },
  { id: 9, name: "Wristband", category: "Accessories", price: 4.0, stock: 40 },
  {
    id: 10,
    name: "Sports Towel",
    category: "Accessories",
    price: 8.99,
    stock: 22,
  },
  { id: 11, name: "Padel Bag", category: "Equipment", price: 34.99, stock: 6 },
  {
    id: 12,
    name: "Sports Socks",
    category: "Accessories",
    price: 5.99,
    stock: 50,
  },
]

const salesLog: SaleRecord[] = [
  {
    id: 1,
    item: "Water Bottle (500ml)",
    quantity: 6,
    date: "2026-06-03",
    total: 9.0,
  },
  { id: 2, item: "Energy Drink", quantity: 3, date: "2026-06-03", total: 7.5 },
  {
    id: 3,
    item: "Ball Pack (3 units)",
    quantity: 2,
    date: "2026-06-03",
    total: 13.98,
  },
  {
    id: 4,
    item: "Overgrip Tape",
    quantity: 4,
    date: "2026-06-02",
    total: 14.0,
  },
  {
    id: 5,
    item: "Padel Racket (Basic)",
    quantity: 1,
    date: "2026-06-02",
    total: 49.99,
  },
  {
    id: 6,
    item: "Water Bottle (500ml)",
    quantity: 8,
    date: "2026-06-02",
    total: 12.0,
  },
  { id: 7, item: "Sports Juice", quantity: 5, date: "2026-06-01", total: 10.0 },
  {
    id: 8,
    item: "Isotonic Drink",
    quantity: 4,
    date: "2026-06-01",
    total: 8.8,
  },
  {
    id: 9,
    item: "Sports Towel",
    quantity: 2,
    date: "2026-06-01",
    total: 17.98,
  },
  {
    id: 10,
    item: "Padel Racket (Pro)",
    quantity: 1,
    date: "2026-05-31",
    total: 149.99,
  },
  {
    id: 11,
    item: "Ball Pack (3 units)",
    quantity: 3,
    date: "2026-05-31",
    total: 20.97,
  },
  {
    id: 12,
    item: "Energy Drink",
    quantity: 6,
    date: "2026-05-30",
    total: 15.0,
  },
  { id: 13, item: "Padel Bag", quantity: 1, date: "2026-05-30", total: 34.99 },
  {
    id: 14,
    item: "Sports Socks",
    quantity: 4,
    date: "2026-05-29",
    total: 23.96,
  },
  { id: 15, item: "Wristband", quantity: 3, date: "2026-05-29", total: 12.0 },
]

const stockColumns: ColumnDef<StockItem>[] = [
  {
    accessorKey: "name",
    header: "Product",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("category")}</Badge>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => `€${row.getValue<number>("price").toFixed(2)}`,
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue<number>("stock")
      return (
        <span className={stock < 10 ? "font-medium text-destructive" : ""}>
          {stock} units
        </span>
      )
    },
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

const salesColumns: ColumnDef<SaleRecord>[] = [
  {
    accessorKey: "item",
    header: "Item",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => `€${row.getValue<number>("total").toFixed(2)}`,
  },
]

function InventoryPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage stock and track sales.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Stock</h2>
          <p className="text-sm text-muted-foreground">
            Current product inventory. Items below 10 units are highlighted.
          </p>
        </div>
        <DataTable
          columns={stockColumns}
          data={stockItems}
          searchPlaceholder="Search products..."
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Sales Log</h2>
          <p className="text-sm text-muted-foreground">
            Record of recent product sales.
          </p>
        </div>
        <DataTable
          columns={salesColumns}
          data={salesLog}
          searchPlaceholder="Search sales..."
        />
      </section>
    </div>
  )
}
