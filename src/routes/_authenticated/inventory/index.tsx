import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
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
import { formatCurrency } from "@/lib/app-settings"
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
  canManage,
}: {
  item: StockItem
  canManage: boolean
}) {
  const { t } = useTranslation()
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
      toast.success(t("pages.stock.stockUpdated"), {
        description:
          draft === 1
            ? t("pages.stock.stockUpdatedDescriptionOne", {
                name: item.name,
                count: draft,
              })
            : t("pages.stock.stockUpdatedDescriptionOther", {
                name: item.name,
                count: draft,
              }),
      })
      router.invalidate()
    } catch {
      toast.error(t("pages.stock.updateError"), {
        description: t("common.tryAgain"),
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
    item.stock <= item.lowStockThreshold && "font-medium text-destructive"
  )

  const unitsLabel =
    item.stock === 1
      ? t("pages.stock.unitsOne", { count: item.stock })
      : t("pages.stock.unitsOther", { count: item.stock })

  if (!canManage) {
    return <span className={className}>{unitsLabel}</span>
  }

  return (
    <button
      onClick={startEdit}
      disabled={saving}
      title={t("pages.stock.editTitle")}
      className={cn("cursor-pointer hover:bg-muted", className)}
    >
      {unitsLabel}
    </button>
  )
}

function StockActions({ item }: { item: StockItem }) {
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("inventory:manage")
  const [editOpen, setEditOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteStockItem({ data: { id: item.id } })
      toast.success(t("pages.stock.deleted"), { description: item.name })
      router.invalidate()
    } catch {
      toast.error(t("pages.stock.deleteError"), {
        description: t("common.tryAgain"),
      })
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
  t: TFunction,
  canManage: boolean
): ColumnDef<StockItem>[] {
  const columns: ColumnDef<StockItem>[] = [
    {
      accessorKey: "name",
      header: t("fields.product"),
    },
    {
      accessorKey: "category",
      header: t("fields.category"),
      meta: { className: "w-[448px] text-center" },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="outline">{row.getValue("category")}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: t("fields.price"),
      cell: ({ row }) => formatCurrency(row.getValue<number>("price")),
    },
    {
      accessorKey: "stock",
      header: t("fields.stock"),
      cell: ({ row }) => (
        <EditableStockCell item={row.original} canManage={canManage} />
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
  const { t } = useTranslation()
  const router = useRouter()
  const canManage = useCan("inventory:manage")
  const { stockItems } = Route.useLoaderData()
  const stockColumns = useMemo(
    () => buildStockColumns(t, canManage),
    [t, canManage]
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pages.stock.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pages.stock.manage")}{" "}
          {canManage ? `${t("pages.stock.clickToEdit")} ` : ""}
          {t("pages.stock.threshold")}
        </p>
      </div>

      <DataTable
        columns={stockColumns}
        data={stockItems}
        searchPlaceholder={t("pages.stock.searchPlaceholder")}
        exportFileName="stock"
        action={
          canManage ? (
            <NewStockItemDrawer
              onSaved={() => router.invalidate()}
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  {t("pages.stock.newButton")}
                </Button>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
