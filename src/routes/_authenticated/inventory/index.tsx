import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { NewStockItemDrawer } from "@/components/new-stock-item-drawer"
import { RowActions } from "@/components/row-actions"
import { cn } from "@/lib/utils"
import { formatCurrency, useAppSettings } from "@/lib/app-settings"
import {
  deleteStockItem,
  listStockItems,
  setStockLevel,
} from "@/lib/inventory.functions"
import { useCan } from "@/hooks/use-permissions"
import type { StockItem } from "@/db/schema"

export const Route = createFileRoute("/_authenticated/inventory/")({
  loader: async () => ({ stockItems: await listStockItems() }),
  component: StockPage,
})

function EditableStockCell({
  item,
  threshold,
  canManage,
}: {
  item: StockItem
  threshold: number
  canManage: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  // Draft value is only used while editing; the displayed count always comes
  // from `item.stock` (the loader) so it stays correct as rows are added/sorted.
  const [draft, setDraft] = useState(item.stock)
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setDraft(item.stock)
    setEditing(true)
  }

  async function save() {
    setEditing(false)
    if (draft === item.stock) return
    setSaving(true)
    try {
      await setStockLevel({ data: { id: item.id, stock: draft } })
      toast.success("Stock updated", {
        description: `${item.name} set to ${draft} units.`,
      })
      router.invalidate()
    } catch {
      toast.error("Could not update stock", {
        description: "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <Input
        type="number"
        value={draft}
        min={0}
        onChange={(e) => setDraft(Number(e.target.value))}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") setEditing(false)
        }}
        autoFocus
        className="h-7 w-20"
      />
    )
  }

  const className = cn(
    "rounded px-1 py-0.5 text-sm",
    item.stock <= threshold && "font-medium text-destructive"
  )

  if (!canManage) {
    return <span className={className}>{item.stock} units</span>
  }

  return (
    <button
      onClick={startEdit}
      disabled={saving}
      title="Click to edit"
      className={cn("cursor-pointer hover:bg-muted", className)}
    >
      {item.stock} units
    </button>
  )
}

function StockActions({ item }: { item: StockItem }) {
  const router = useRouter()
  const canManage = useCan("inventory:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteStockItem({ data: { id: item.id } })
      toast.success("Item deleted", { description: item.name })
      router.invalidate()
    } catch {
      toast.error("Could not delete item", { description: "Please try again." })
    }
  }

  if (!canManage) return null

  return (
    <>
      <NewStockItemDrawer
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => router.invalidate()}
      />
      <RowActions onEdit={() => setEditOpen(true)} onDelete={handleDelete} />
    </>
  )
}

function buildStockColumns(
  threshold: number,
  canManage: boolean
): ColumnDef<StockItem>[] {
  const columns: ColumnDef<StockItem>[] = [
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
          item={row.original}
          threshold={threshold}
          canManage={canManage}
        />
      ),
    },
  ]

  if (canManage) {
    columns.push({
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => <StockActions item={row.original} />,
    })
  }

  return columns
}

function StockPage() {
  const router = useRouter()
  const canManage = useCan("inventory:manage")
  const { inventory } = useAppSettings()
  const { stockItems } = Route.useLoaderData()
  const threshold = inventory.lowStockThreshold
  const stockColumns = useMemo(
    () => buildStockColumns(threshold, canManage),
    [threshold, canManage]
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage stock levels. {canManage ? "Click a count to edit it. " : ""}
          Items at or below {threshold} units are highlighted.
        </p>
      </div>

      <DataTable
        columns={stockColumns}
        data={stockItems}
        searchPlaceholder="Search products..."
        exportFileName="stock"
        action={
          canManage ? (
            <NewStockItemDrawer
              onSaved={() => router.invalidate()}
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  New Item
                </Button>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
