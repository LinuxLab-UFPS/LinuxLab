"use client"

import type { Worksheet } from "exceljs"

/** Una celda del archivo: valor y estilo de presentación. */
export interface ExcelCell {
  value: string | number | null
  /** Color de relleno en hex sin "#" (ej. "DCFCE7"). */
  fill?: string
  bold?: boolean
  align?: "left" | "center" | "right"
  /** Color de fuente en hex sin "#". */
  fontColor?: string
  numFmt?: string
}

export interface ExcelMerge {
  from: { row: number; col: number }
  to: { row: number; col: number }
}

export interface ExcelSheetSpec {
  name: string
  /** Grid de celdas, row-major (fila 0 arriba). */
  grid: ExcelCell[][]
  /** Celdas combinadas, índices 0-based. */
  merges?: ExcelMerge[]
  /** Columnas/ filas fijas: { xSplit, ySplit }. */
  freeze?: { xSplit: number; ySplit: number }
  columnWidths?: number[]
}

export interface ExcelExportOptions {
  fileName: string
  sheets: ExcelSheetSpec[]
}

const GRID_BORDER = "FFE2E8F0"
const HEADER_FILL = "F1F5F9"

/**
 * Convierte una tabla plana (cabecera + filas) en una hoja: para bitácora,
 * listados de estudiantes, actividades, etc.
 */
export function tableToSheet(opts: {
  name?: string
  headers: string[]
  rows: (string | number | null)[][]
  columnWidths?: number[]
}): ExcelSheetSpec {
  const header: ExcelCell[] = opts.headers.map((h) => ({
    value: h,
    bold: true,
    align: "center",
    fill: HEADER_FILL,
  }))
  const body: ExcelCell[][] = opts.rows.map((row) =>
    row.map((value) => ({
      value,
      align: typeof value === "number" ? "center" : "left",
    })),
  )
  return {
    name: opts.name ?? "Datos",
    grid: [header, ...body],
    columnWidths: opts.columnWidths,
  }
}

/** Genera y descarga un archivo .xlsx en el navegador. */
export async function downloadExcel(options: ExcelExportOptions): Promise<void> {
  const ExcelJS = await import("exceljs")
  const workbook = new ExcelJS.Workbook()

  for (const sheet of options.sheets) {
    const ws = workbook.addWorksheet(sheet.name)
    writeGrid(ws, sheet.grid)

    if (sheet.columnWidths) {
      sheet.columnWidths.forEach((width, i) => {
        ws.getColumn(i + 1).width = width
      })
    }
    if (sheet.freeze) {
      ws.views = [{ state: "frozen", xSplit: sheet.freeze.xSplit, ySplit: sheet.freeze.ySplit }]
    }
    if (sheet.merges) {
      for (const m of sheet.merges) {
        ws.mergeCells(m.from.row + 1, m.from.col + 1, m.to.row + 1, m.to.col + 1)
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = options.fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function writeGrid(ws: Worksheet, grid: ExcelCell[][]): void {
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const target = ws.getCell(r + 1, c + 1)
      if (cell.value !== null) target.value = cell.value
      if (cell.numFmt) target.numFmt = cell.numFmt
      if (cell.align) target.alignment = { horizontal: cell.align, vertical: "middle" }
      if (cell.fill) {
        target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${cell.fill}` } }
      }
      if (cell.bold || cell.fontColor) {
        target.font = {
          bold: cell.bold ?? false,
          color: cell.fontColor ? { argb: `FF${cell.fontColor}` } : undefined,
        }
      }
      target.border = {
        top: { style: "thin", color: { argb: GRID_BORDER } },
        left: { style: "thin", color: { argb: GRID_BORDER } },
        bottom: { style: "thin", color: { argb: GRID_BORDER } },
        right: { style: "thin", color: { argb: GRID_BORDER } },
      }
    })
  })
}
