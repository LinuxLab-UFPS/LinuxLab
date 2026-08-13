"use client"

import { jsPDF } from "jspdf"
import { COMMANDS, type EssentialCommand } from "@/lib/features/student/commands"

/**
 * The printable cheat sheet: every command the course teaches, one per row,
 * what it does beside it, and nada más.
 *
 * Es una tabla, no una lista: todas las filas miden lo mismo y las dos columnas
 * empiezan siempre en la misma x. Antes cada fila medía lo que midiera su
 * descripción y un comando largo empujaba la suya al renglón de abajo, así que
 * nada quedaba a la altura de nada.
 *
 * Sale en tinta sobre papel a propósito. Un PDF acaba impreso en blanco o en un
 * visor que no sabe nada de los fondos oscuros de la plataforma, así que lo
 * único que se toma de la marca es el rojo de los nombres.
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

const BODY_TOP = 32
const BOTTOM = PAGE.height - 16

const CMD_SIZE = 8
const BODY_SIZE = 8

/**
 * El alto de renglón, en milímetros, y el factor que hay que darle a jsPDF para
 * que reparta las líneas de un texto de varias justo a esa distancia. Iban por
 * separado y no coincidían: el cursor avanzaba 3.6 mm por línea y jsPDF pintaba
 * cada una a 1.15 × el tamaño de fuente, de modo que la segunda línea de una
 * descripción caía por encima de donde se la esperaba.
 */
const MM_PER_PT = 25.4 / 72
const LINE_FACTOR = 1.3
const LINE = BODY_SIZE * LINE_FACTOR * MM_PER_PT

/** Aire entre el último renglón de una fila y la línea que la cierra. */
const ROW_PADDING = 1.8

function header(doc: jsPDF) {
  doc.setFont("courier", "bold").setFontSize(15).setTextColor(...RED)
  doc.text(">_", MARGIN, MARGIN + 6)

  doc.setFont("helvetica", "bold").setFontSize(19).setTextColor(...INK)
  doc.text("Comandos Esenciales", MARGIN + 11, MARGIN + 6)

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...MUTED)
  doc.text("LinuxLab UFPS · Referencia rápida", MARGIN + 11, MARGIN + 11)

  doc.setDrawColor(...RULE).setLineWidth(0.3)
  doc.line(MARGIN, MARGIN + 14, PAGE.width - MARGIN, MARGIN + 14)
}

/** Ancho del nombre con sus argumentos, que es lo que decide la columna. */
function commandWidth(doc: jsPDF, command: EssentialCommand): number {
  doc.setFont("courier", "bold").setFontSize(CMD_SIZE)
  let width = doc.getTextWidth(command.name)
  if (command.args) {
    doc.setFont("courier", "normal")
    width += 1.5 + doc.getTextWidth(command.args)
  }
  return width
}

/**
 * El ancho de la columna de comandos: lo que mide el más largo, con un tope para
 * que uno solo no estreche las descripciones de todos los demás. El que se pase
 * del tope parte sus argumentos al renglón de abajo, dentro de su propia fila,
 * en vez de invadir la columna de al lado.
 */
function commandColumn(doc: jsPDF): number {
  const widest = Math.max(...COMMANDS.map((command) => commandWidth(doc, command)))
  return Math.min(widest + 3, COLUMN_WIDTH * 0.44)
}

interface Row {
  command: EssentialCommand
  /** Líneas de la descripción, ya partidas al ancho que les toca. */
  lines: string[]
  /** El comando no cabe de una: los argumentos bajan de renglón. */
  stacked: boolean
}

function layout(doc: jsPDF, column: number): Row[] {
  doc.setFont("helvetica", "normal").setFontSize(BODY_SIZE)
  return COMMANDS.map((command) => {
    const lines = doc.splitTextToSize(command.description, COLUMN_WIDTH - column) as string[]
    return { command, lines, stacked: commandWidth(doc, command) > column - 2 }
  })
}

/**
 * Todas las filas miden lo mismo: lo que necesite la más alta. Es lo que hace
 * que la hoja se lea como una tabla y que las dos columnas de la página avancen
 * a la par en vez de desfasarse renglón a renglón.
 */
function rowHeight(rows: Row[]): number {
  const tallest = Math.max(...rows.map((row) => Math.max(row.lines.length, row.stacked ? 2 : 1)))
  return tallest * LINE + ROW_PADDING * 2
}

function drawRow(doc: jsPDF, row: Row, x: number, top: number, column: number, height: number) {
  const baseline = top + ROW_PADDING + LINE * 0.8

  doc.setFont("courier", "bold").setFontSize(CMD_SIZE).setTextColor(...RED)
  doc.text(row.command.name, x, baseline)

  if (row.command.args) {
    const nameWidth = doc.getTextWidth(row.command.name)
    doc.setFont("courier", "normal").setTextColor(...MUTED)
    // Cabiendo, los argumentos van pegados al nombre; si no, debajo. En ninguno
    // de los dos casos se meten en la columna de la descripción.
    if (row.stacked) doc.text(row.command.args, x, baseline + LINE)
    else doc.text(row.command.args, x + nameWidth + 1.5, baseline)
  }

  doc.setFont("helvetica", "normal").setFontSize(BODY_SIZE).setTextColor(...INK)
  doc.text(row.lines, x + column, baseline)

  doc.setDrawColor(...RULE).setLineWidth(0.15)
  doc.line(x, top + height, x + COLUMN_WIDTH, top + height)
}

/**
 * Reparte las filas en columnas de alto fijo.
 *
 * Si todo cabe en una hoja se parte por la mitad del número de filas, no
 * llenando la primera columna hasta abajo: con lo segundo la izquierda llegaba
 * al borde y la derecha quedaba a un tercio.
 */
function columns(rows: Row[], height: number): Row[][] {
  const perColumn = Math.max(1, Math.floor((BOTTOM - BODY_TOP) / height))

  if (rows.length <= perColumn * 2) {
    const half = Math.ceil(rows.length / 2)
    return [rows.slice(0, half), rows.slice(half)]
  }

  const packed: Row[][] = []
  for (let i = 0; i < rows.length; i += perColumn) {
    packed.push(rows.slice(i, i + perColumn))
  }
  return packed
}

export function downloadCheatSheet() {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  doc.setLineHeightFactor(LINE_FACTOR)
  header(doc)

  const column = commandColumn(doc)
  const rows = layout(doc, column)
  const height = rowHeight(rows)

  for (const [index, group] of columns(rows, height).entries()) {
    if (index > 0 && index % 2 === 0) {
      doc.addPage()
      header(doc)
    }
    const x = MARGIN + (index % 2) * (COLUMN_WIDTH + COLUMN_GAP)
    group.forEach((row, position) => {
      drawRow(doc, row, x, BODY_TOP + position * height, column, height)
    })
  }

  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...MUTED)
  doc.text("LinuxLab UFPS", MARGIN, PAGE.height - 9)

  doc.save("comandos-esenciales-linuxlab.pdf")
}
