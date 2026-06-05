import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import {
  IconChevronUp,
  IconChevronDown,
  IconDownload,
  IconSelector,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { exportRecords } from "@/lib/export"
import type { ExportFormat, ExportRecord } from "@/lib/export"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  pageSize?: number
  action?: React.ReactNode
  onRowHover?: (row: TData | null) => void
  isRowHighlighted?: (row: TData) => boolean
  /** Enables the CSV/JSON export menu. Defaults to true. */
  enableExport?: boolean
  /** Base name (without extension) for exported files. */
  exportFileName?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  pageSize = 10,
  action,
  onRowHover,
  isRowHighlighted,
  enableExport = true,
  exportFileName = "export",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  function handleExport(format: ExportFormat) {
    // Only accessor columns (those with a real value) are exported; display
    // columns like row actions are skipped. Respects the active search filter.
    const accessorCols = table
      .getAllLeafColumns()
      .filter((col) => col.accessorFn != null)
    const labelFor = (id: string) => {
      const header = accessorCols.find((c) => c.id === id)?.columnDef.header
      return typeof header === "string" ? header : id
    }
    const records: ExportRecord[] = table
      .getFilteredRowModel()
      .rows.map((row) =>
        Object.fromEntries(
          accessorCols.map((col) => [labelFor(col.id), row.getValue(col.id)])
        )
      )
    exportRecords(records, format, exportFileName)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {enableExport && (
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
          )}
          {action}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const metaClass = header.column.columnDef.meta?.className
                  const centered = metaClass?.includes("text-center")
                  return (
                    <TableHead key={header.id} className={metaClass}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          className={cn(
                            "flex items-center gap-1 hover:text-foreground",
                            centered && "w-full justify-center"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() === "asc" ? (
                            <IconChevronUp className="size-3.5" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <IconChevronDown className="size-3.5" />
                          ) : (
                            <IconSelector className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <div
                          className={cn(
                            centered && "text-center",
                            metaClass?.includes("text-right") && "text-right"
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-highlighted={
                    isRowHighlighted?.(row.original) || undefined
                  }
                  onMouseEnter={() => onRowHover?.(row.original)}
                  onMouseLeave={() => onRowHover?.(null)}
                  className={cn(
                    onRowHover && "cursor-default",
                    "data-[highlighted=true]:bg-muted"
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const metaClass = cell.column.columnDef.meta?.className
                    const isRight = metaClass?.includes("text-right")
                    return (
                      <TableCell key={cell.id} className={metaClass}>
                        <div className={cn(isRight && "flex justify-end")}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
