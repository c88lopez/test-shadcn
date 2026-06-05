import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { NewStockItemDrawer } from "@/components/new-stock-item-drawer"
import { RowActions } from "@/components/row-actions"
import { cn } from "@/lib/utils"
import { formatCurrency, useAppSettings } from "@/lib/app-settings"
import { stockItems } from "@/lib/inventory-data"
import type { StockItem } from "@/lib/inventory-data"

export const Route = createFileRoute("/_authenticated/inventory/")({
  component: StockPage,
})

function EditableStockCell({
  initialValue,
  threshold,
}: {
  initialValue: number
  threshold: number
}) {
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
        value <= threshold && "font-medium text-destructive"
      )}
    >
      {value} units
    </button>
  )
}

function StockActions({ item }: { item: StockItem }) {
  const [editOpen, setEditOpen] = useState(false)
  return (
    <>
      <NewStockItemDrawer
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <RowActions
        onEdit={() => setEditOpen(true)}
        onDuplicate={() => console.log("[dummy] duplicate", item.name)}
        onDelete={() => console.log("[dummy] delete", item.name)}
      />
    </>
  )
}

function buildStockColumns(threshold: number): ColumnDef<StockItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Product",
    },
    {
      accessorKey: "category",
      header: "Category",
      meta: { className: "w-[448px] text-center" },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="outline">{row.getValue("category")}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatCurrency(row.getValue<number>("price")),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <EditableStockCell
          initialValue={row.getValue<number>("stock")}
          threshold={threshold}
        />
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => <StockActions item={row.original} />,
    },
  ]
}

function StockPage() {
  const { inventory } = useAppSettings()
  const threshold = inventory.lowStockThreshold
  const stockColumns = useMemo(() => buildStockColumns(threshold), [threshold])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage stock levels. Click a count to edit it. Items at or below{" "}
          {threshold} units are highlighted.
        </p>
      </div>

      <DataTable
        columns={stockColumns}
        data={stockItems}
        searchPlaceholder="Search products..."
        exportFileName="stock"
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
