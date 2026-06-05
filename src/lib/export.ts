/**
 * Generic client-side data export helpers used by the data tables. Records are
 * plain objects keyed by the column header label; values are stringified for
 * CSV and kept as-is for JSON.
 */

export type ExportFormat = "csv" | "json"

export type ExportRecord = Record<string, unknown>

function cellToString(value: unknown): string {
  if (value == null) return ""
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv(records: ExportRecord[]): string {
  if (records.length === 0) return ""
  const headers = Object.keys(records[0])
  const lines = [
    headers.map(escapeCsv).join(","),
    ...records.map((record) =>
      headers.map((h) => escapeCsv(cellToString(record[h]))).join(",")
    ),
  ]
  return lines.join("\n")
}

function download(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportRecords(
  records: ExportRecord[],
  format: ExportFormat,
  baseName: string
) {
  const stamp = new Date().toISOString().slice(0, 10)
  if (format === "csv") {
    download(
      `${baseName}-${stamp}.csv`,
      toCsv(records),
      "text/csv;charset=utf-8"
    )
  } else {
    download(
      `${baseName}-${stamp}.json`,
      JSON.stringify(records, null, 2),
      "application/json"
    )
  }
}
