import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPencil, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { NewStockItemDrawer } from "@/components/new-stock-item-drawer"
import type { StockItemData } from "@/components/new-stock-item-drawer"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_authenticated/inventory/")({
  component: StockPage,
})

interface StockItem extends StockItemData {
  id: number
}

const stockItemsData: StockItem[] = [
  { id: 1,  name: "Water Bottle (500ml)",  category: "Drinks",      price: 1.5,    stock: 120 },
  { id: 2,  name: "Energy Drink",           category: "Drinks",      price: 2.5,    stock: 48  },
  { id: 3,  name: "Sports Juice",           category: "Drinks",      price: 2.0,    stock: 60  },
  { id: 4,  name: "Isotonic Drink",         category: "Drinks",      price: 2.2,    stock: 35  },
  { id: 5,  name: "Padel Racket (Basic)",   category: "Equipment",   price: 49.99,  stock: 8   },
  { id: 6,  name: "Padel Racket (Pro)",     category: "Equipment",   price: 149.99, stock: 4   },
  { id: 7,  name: "Ball Pack (3 units)",    category: "Equipment",   price: 6.99,   stock: 55  },
  { id: 8,  name: "Overgrip Tape",          category: "Accessories", price: 3.5,    stock: 80  },
  { id: 9,  name: "Wristband",              category: "Accessories", price: 4.0,    stock: 40  },
  { id: 10, name: "Sports Towel",           category: "Accessories", price: 8.99,   stock: 22  },
  { id: 11, name: "Padel Bag",              category: "Equipment",   price: 34.99,  stock: 6   },
  { id: 12, name: "Sports Socks",           category: "Accessories", price: 5.99,   stock: 50  },
]

function EditableStockCell({ initialValue }: { initialValue: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue)

  if (editing) {
    return (
      <Input
        type="number"
        value={value}
        min={0}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={() => {
          console.log("[dummy] Update stock →", value)
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            setValue(initialValue)
            setEditing(false)
          }
        }}
        autoFocus
        className="h-7 w-20"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={cn(
        "cursor-pointer rounded px-1 py-0.5 text-sm hover:bg-muted",
        value < 10 && "font-medium text-destructive",
      )}
    >
      {value} units
    </button>
  )
}

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
    cell: ({ row }) => `$${(row.getValue<number>("price")).toFixed(2)}`,
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => (
      <EditableStockCell initialValue={row.getValue<number>("stock")} />
    ),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => (
      <NewStockItemDrawer
        item={row.original}
        trigger={
          <Button variant="ghost" size="icon" className="size-8">
            <IconPencil className="size-4" />
          </Button>
        }
      />
    ),
  },
]

function StockPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage stock levels. Click a count to edit it. Items below 10 units
          are highlighted.
        </p>
      </div>

      <DataTable
        columns={stockColumns}
        data={stockItemsData}
        searchPlaceholder="Search products..."
        action={
          <NewStockItemDrawer
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                New Item
              </Button>
            }
          />
        }
      />
    </div>
  )
}
