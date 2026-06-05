import { Fragment, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  IconChevronDown,
  IconChevronRight,
  IconDownload,
  IconPlus,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NewSaleDrawer } from "@/components/new-sale-drawer"
import { saleTotal } from "@/lib/sales"
import type { Sale } from "@/lib/sales"
import { exportRecords } from "@/lib/export"
import type { ExportFormat } from "@/lib/export"
import { formatCurrency } from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/inventory/sales-log")({
  component: SalesLogPage,
})

const salesData: Sale[] = [
  {
    id: 1,
    date: "2026-06-03",
    items: [
      { item: "Water Bottle (500ml)", quantity: 6, unitPrice: 1.5 },
      { item: "Energy Drink", quantity: 3, unitPrice: 2.5 },
    ],
  },
  {
    id: 2,
    date: "2026-06-03",
    items: [{ item: "Ball Pack (3 units)", quantity: 2, unitPrice: 6.99 }],
  },
  {
    id: 3,
    date: "2026-06-02",
    items: [
      { item: "Overgrip Tape", quantity: 4, unitPrice: 3.5 },
      { item: "Padel Racket (Basic)", quantity: 1, unitPrice: 49.99 },
      { item: "Water Bottle (500ml)", quantity: 8, unitPrice: 1.5 },
    ],
  },
  {
    id: 4,
    date: "2026-06-01",
    items: [
      { item: "Sports Juice", quantity: 5, unitPrice: 2.0 },
      { item: "Isotonic Drink", quantity: 4, unitPrice: 2.2 },
      { item: "Sports Towel", quantity: 2, unitPrice: 8.99 },
    ],
  },
  {
    id: 5,
    date: "2026-05-31",
    items: [
      { item: "Padel Racket (Pro)", quantity: 1, unitPrice: 149.99 },
      { item: "Ball Pack (3 units)", quantity: 3, unitPrice: 6.99 },
    ],
  },
  {
    id: 6,
    date: "2026-05-30",
    items: [
      { item: "Energy Drink", quantity: 6, unitPrice: 2.5 },
      { item: "Padel Bag", quantity: 1, unitPrice: 34.99 },
    ],
  },
  {
    id: 7,
    date: "2026-05-29",
    items: [
      { item: "Sports Socks", quantity: 4, unitPrice: 5.99 },
      { item: "Wristband", quantity: 3, unitPrice: 4.0 },
    ],
  },
]

function SalesLogPage() {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState("")

  const toggle = (id: number) =>
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const filtered = filter
    ? salesData.filter(
        (s) =>
          s.date.includes(filter) ||
          s.items.some((i) =>
            i.item.toLowerCase().includes(filter.toLowerCase())
          )
      )
    : salesData

  function handleExport(format: ExportFormat) {
    const records = filtered.map((sale) => ({
      Date: sale.date,
      Items: sale.items.map((i) => `${i.quantity}x ${i.item}`).join("; "),
      "Item count": sale.items.length,
      Total: saleTotal(sale),
    }))
    exportRecords(records, format, "sales-log")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sales Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click a row to expand its line items.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search sales..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconDownload className="size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <NewSaleDrawer
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                New Sale
              </Button>
            }
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sale) => {
                const expanded = expandedRows.has(sale.id)
                const total = saleTotal(sale)
                return (
                  <Fragment key={sale.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggle(sale.id)}
                    >
                      <TableCell className="pr-0">
                        {expanded ? (
                          <IconChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <IconChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sale.items.length}{" "}
                        {sale.items.length === 1 ? "item" : "items"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow key={`${sale.id}-detail`}>
                        <TableCell colSpan={4} className="bg-muted/30 p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-8">Product</TableHead>
                                <TableHead className="w-20">Qty</TableHead>
                                <TableHead className="w-32">
                                  Unit Price
                                </TableHead>
                                <TableHead className="w-32 text-right">
                                  Subtotal
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sale.items.map((line, i) => (
                                <TableRow key={i}>
                                  <TableCell className="pl-8">
                                    {line.item}
                                  </TableCell>
                                  <TableCell>{line.quantity}</TableCell>
                                  <TableCell>
                                    {formatCurrency(line.unitPrice)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(
                                      line.quantity * line.unitPrice
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
