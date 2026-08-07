"use client"

import { jsPDF } from "jspdf"
import { COMMANDS, type EssentialCommand } from "@/lib/features/student/commands"

/**
 * The printable cheat sheet: every command the course teaches, one per line,
 * what it does beside it, and nada más.
 *
 * It goes out light on purpose. A PDF ends up printed on white paper or read in
 * a viewer that has no idea about the platform's dark surfaces, so the only
 * thing borrowed from the brand is the red of the command names — everything
 * else is ink on paper.
 */

/** El mismo rojo del `--primary` de la plataforma. */
const RED: [number, number, number] = [196, 30, 58]
const INK: [number, number, number] = [24, 24, 27]
const MUTED: [number, number, number] = [110, 110, 120]
const RULE: [number, number, number] = [228, 228, 234]

const PAGE = { width: 210, height: 297 }
const MARGIN = 14
const COLUMN_GAP = 10
const COLUMN_WIDTH = (PAGE.width - MARGIN * 2 - COLUMN_GAP) / 2

const BODY_TOP = 34
const BOTTOM = PAGE.height - 16
const LINE = 3.6
const ROW_GAP = 2.4

function header(doc: jsPDF) {
  doc.setFont("courier", "bold").setFontSize(15).setTextColor(...RED)
  doc.text(">_", MARGIN, MARGIN + 6)

  doc.setFont("helvetica", "bold").setFontSize(19).setTextColor(...INK)
  doc.text("Comandos Esenciales", MARGIN + 11, MARGIN + 6)

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...MUTED)
  doc.text("LinuxLab UFPS · Referencia rápida", MARGIN + 11, MARGIN + 11)

  doc.setDrawColor(...RULE).setLineWidth(0.3)
  doc.line(MARGIN, MARGIN + 15, PAGE.width - MARGIN, MARGIN + 15)
}

/** Ancho del nombre con sus argumentos, que es lo que decide la sangría. */
function commandWidth(doc: jsPDF, command: EssentialCommand): number {
  doc.setFont("courier", "bold").setFontSize(8.5)
  let width = doc.getTextWidth(command.name)
  if (command.args) {
    doc.setFont("courier", "normal")
    width += 1.5 + doc.getTextWidth(command.args)
  }
  return width
}

/**
 * La sangría sale de medir los comandos, no de un número escogido a ojo: con un
 * valor fijo, `systemctl <acción> <servicio>` se montaba encima de su
 * descripción. El tope es lo que evita que un comando largo estreche la columna
 * de las descripciones para todos los demás: el que se pase, baja de renglón.
 */
function describeAt(doc: jsPDF): number {
  const widest = Math.max(...COMMANDS.map((command) => commandWidth(doc, command)))
  return Math.min(widest + 4, COLUMN_WIDTH * 0.45)
}

interface Row {
  command: EssentialCommand
  /** Líneas de la descripción, ya partidas al ancho que les toca. */
  lines: string[]
  /** Un comando largo empuja su descripción al renglón de abajo. */
  wraps: boolean
  height: number
}

function layout(doc: jsPDF, offset: number): Row[] {
  return COMMANDS.map((command) => {
    const wraps = commandWidth(doc, command) + 2 > offset
    const lines = doc.splitTextToSize(
      command.description,
      COLUMN_WIDTH - offset,
    ) as string[]
    const height = (wraps ? lines.length + 1 : lines.length) * LINE + ROW_GAP
    return { command, lines, wraps, height }
  })
}

function drawRow(doc: jsPDF, row: Row, x: number, y: number, offset: number) {
  doc.setFont("courier", "bold").setFontSize(8.5).setTextColor(...RED)
  doc.text(row.command.name, x, y)

  if (row.command.args) {
    const nameWidth = doc.getTextWidth(row.command.name)
    doc.setFont("courier", "normal").setTextColor(...MUTED)
    doc.text(row.command.args, x + nameWidth + 1.5, y)
  }

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...INK)
  doc.text(row.lines, x + offset, row.wraps ? y + LINE : y)
}

/**
 * Reparte las filas en columnas.
 *
 * Si todo cabe en una hoja se parte por la mitad de la altura, no llenando la
 * primera hasta abajo: con lo segundo la izquierda llegaba al borde, la derecha
 * quedaba a un tercio y la última fila se iba sola a una segunda página.
 */
function columns(rows: Row[]): Row[][] {
  const available = BOTTOM - BODY_TOP
  const total = rows.reduce((sum, row) => sum + row.height, 0)

  if (total <= available * 2) {
    let accumulated = 0
    const split = rows.findIndex((row) => (accumulated += row.height) >= total / 2) + 1
    return [rows.slice(0, split), rows.slice(split)]
  }

  const packed: Row[][] = [[]]
  let height = 0
  for (const row of rows) {
    const current = packed[packed.length - 1]
    if (current.length > 0 && height + row.height > available) {
      packed.push([])
      height = 0
    }
    packed[packed.length - 1].push(row)
    height += row.height
  }
  return packed
}

export function downloadCheatSheet() {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  header(doc)

  const offset = describeAt(doc)
  const rows = layout(doc, offset)

  for (const [index, column] of columns(rows).entries()) {
    if (index > 0 && index % 2 === 0) {
      doc.addPage()
      header(doc)
    }
    let cursor = BODY_TOP
    const x = MARGIN + (index % 2) * (COLUMN_WIDTH + COLUMN_GAP)
    for (const row of column) {
      drawRow(doc, row, x, cursor, offset)
      cursor += row.height
    }
  }

  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...MUTED)
  doc.text("LinuxLab UFPS", MARGIN, PAGE.height - 9)

  doc.save("comandos-esenciales-linuxlab.pdf")
}
