const fs = require("fs")
const path = require("path")
const PDFDocument = require("pdfkit")

// IBM Plex Sans via paquete npm (@ibm/plex v5, que trae TTF estaticos).
// Si la dependencia no estuviera, pdfkit cae a las fuentes estandar, que
// tambien cubren los acentos del espanol.
const FONT_DIR = path.join(__dirname, "../../node_modules/@ibm/plex/IBM-Plex-Sans/fonts/complete/ttf")
const HAS_PLEX = fs.existsSync(path.join(FONT_DIR, "IBMPlexSans-Regular.ttf"))

const FONTS = HAS_PLEX
  ? {
      regular: path.join(FONT_DIR, "IBMPlexSans-Regular.ttf"),
      semibold: path.join(FONT_DIR, "IBMPlexSans-SemiBold.ttf"),
      bold: path.join(FONT_DIR, "IBMPlexSans-Bold.ttf"),
    }
  : { regular: "Helvetica", semibold: "Helvetica-Bold", bold: "Helvetica-Bold" }

const RED = "#c41e3a"
const INK = "#18181b"
const MUTED = "#71717a"
const HAIR = "#e4e4e7"

const dateFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" })
const formatDate = (value) => dateFmt.format(new Date(value))

function newDocument({ layout, title }) {
  return new PDFDocument({
    size: "A4",
    layout,
    margin: 0,
    info: { Title: title, Author: "LinuxLab" },
  })
}

function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    doc.end()
  })
}

function setFont(doc, variant, size, color = INK) {
  doc.font(FONTS[variant]).fontSize(size).fillColor(color)
}

/** Doble marco rojo del certificado. */
function drawFrame(doc, width, height) {
  doc.save()
  doc.lineWidth(3).strokeColor(RED).rect(26, 26, width - 52, height - 52).stroke()
  doc.lineWidth(1).strokeOpacity(0.55).rect(34, 34, width - 68, height - 68).stroke()
  doc.restore()
}

/** Encabezado comun: marca, titulo y ornamento. Devuelve la Y donde sigue. */
function drawHeader(doc, width, title) {
  setFont(doc, "semibold", 10, RED)
  doc.text("LINUXLAB", 0, 76, { width, align: "center", characterSpacing: 6 })

  setFont(doc, "bold", 26, RED)
  doc.text(title, 0, 98, { width, align: "center", characterSpacing: 2 })

  doc.save()
  doc.lineWidth(1.5).strokeColor(RED)
  doc.moveTo(width / 2 - 32, 142).lineTo(width / 2 + 32, 142).stroke()
  doc.restore()
  return 168
}

/** Pie de certificado: codigo de verificacion a la izquierda, fecha a la derecha. */
function drawFooter(doc, width, height, code, verificationUrl, issuedAt) {
  const y = height - 84
  setFont(doc, "regular", 8.5, MUTED)
  doc.text("Código de verificación", 64, y)
  setFont(doc, "semibold", 10.5, INK)
  doc.text(code, 64, y + 14)
  setFont(doc, "regular", 8.5, MUTED)
  doc.text(verificationUrl, 64, y + 32)

  setFont(doc, "regular", 8.5, MUTED)
  doc.text(`Emitido el ${formatDate(issuedAt)}`, width - 64 - 220, y, {
    width: 220,
    align: "right",
  })
}

/**
 * Certificado de finalizacion de un estudiante. Los datos vienen congelados de
 * la fila Certificate: re-renderizar nunca cambia lo que se emitio.
 */
async function renderStudentCertificate(cert) {
  const width = 841.89
  const height = 595.28
  const doc = newDocument({ layout: "landscape", title: `Certificado de finalización — ${cert.holderName}` })
  const bodyWidth = 620
  const x = (width - bodyWidth) / 2

  drawFrame(doc, width, height)
  let y = drawHeader(doc, width, "CERTIFICADO DE FINALIZACIÓN")

  setFont(doc, "regular", 13, MUTED)
  doc.text("Se certifica que", 0, y, { width, align: "center" })
  y += 24

  setFont(doc, "semibold", 30)
  doc.text(cert.holderName, 0, y, { width, align: "center" })
  y += 42

  if (cert.holderCode) {
    setFont(doc, "regular", 10.5, MUTED)
    doc.text(`Código estudiantil ${cert.holderCode}`, 0, y, { width, align: "center" })
    y += 20
  }

  setFont(doc, "regular", 12.5)
  const body =
    `por completar satisfactoriamente el curso «${cert.groupName}» (grupo N° ${cert.groupNumber}), ` +
    `dirigido por el docente ${cert.teacherName}, entre el ${formatDate(cert.courseStartedAt)} y el ${formatDate(cert.issuedAt)}.`
  doc.text(body, x, y + 8, { width: bodyWidth, align: "center", lineGap: 4 })
  y += doc.heightOfString(body, { width: bodyWidth, align: "center", lineGap: 4 }) + 30

  setFont(doc, "semibold", 12.5)
  doc.text(
    `Temas completados: ${cert.topicsCompleted}/${cert.topicsTotal}      ·      Definitiva: ${cert.definitive ?? "—"}`,
    0,
    y,
    { width, align: "center" },
  )

  drawFooter(doc, width, height, cert.code, cert.verificationUrl, cert.issuedAt)
  return toBuffer(doc)
}

/** Certificado del docente por dirigir el curso, con el resultado del grupo. */
async function renderInstructorCertificate(cert) {
  const width = 841.89
  const height = 595.28
  const doc = newDocument({ layout: "landscape", title: `Certificado de instructor — ${cert.holderName}` })
  const bodyWidth = 620
  const x = (width - bodyWidth) / 2

  drawFrame(doc, width, height)
  let y = drawHeader(doc, width, "CERTIFICADO DE INSTRUCTOR")

  setFont(doc, "regular", 13, MUTED)
  doc.text("Se certifica que", 0, y, { width, align: "center" })
  y += 24

  setFont(doc, "semibold", 30)
  doc.text(cert.holderName, 0, y, { width, align: "center" })
  y += 42

  setFont(doc, "regular", 12.5)
  const body =
    `por dirigir el curso «${cert.groupName}» (grupo N° ${cert.groupNumber}) en la plataforma LinuxLab, ` +
    `finalizado el ${formatDate(cert.issuedAt)}, con ${cert.studentsCertified} de ${cert.studentsTotal} estudiantes ` +
    `que completaron satisfactoriamente el temario.`
  doc.text(body, x, y + 8, { width: bodyWidth, align: "center", lineGap: 4 })
  y += doc.heightOfString(body, { width: bodyWidth, align: "center", lineGap: 4 }) + 30

  setFont(doc, "semibold", 12.5)
  doc.text(`Estudiantes certificados: ${cert.studentsCertified}/${cert.studentsTotal}`, 0, y, {
    width,
    align: "center",
  })

  drawFooter(doc, width, height, cert.code, cert.verificationUrl, cert.issuedAt)
  return toBuffer(doc)
}

/**
 * Acta de finalizacion: todas las matriculas del grupo con su progreso,
 * definitiva y si fueron certificadas, con el codigo de verificacion cuando
 * aplica. Pagina simple con paginacion por renglones.
 */
async function renderActa(acta) {
  const width = 595.28
  const height = 841.89
  const margin = 56
  const doc = newDocument({ layout: "portrait", title: `Acta de finalización — ${acta.groupName}` })

  // Las columnas suman 482pt: el ancho util de A4 vertical con margen 56.
  // La de verificacion se ensancha para que un codigo completo (24 caracteres
  // a 8pt) entre sin truncar.
  const columns = [
    { key: "index", label: "#", width: 20, align: "left", size: 9 },
    { key: "name", label: "Estudiante", width: 124, align: "left", size: 9 },
    { key: "code", label: "Código", width: 66, align: "left", size: 9 },
    { key: "topics", label: "Temas", width: 46, align: "center", size: 9 },
    { key: "definitive", label: "Definitiva", width: 56, align: "center", size: 9 },
    { key: "certified", label: "Certificado", width: 58, align: "center", size: 9 },
    { key: "verification", label: "Verificación", width: 112, align: "left", size: 8 },
  ]
  const rowHeight = 24
  // pdfkit no expone el total de paginas: lo llevamos con el evento pageAdded.
  let pageCount = 1
  doc.on("pageAdded", () => { pageCount += 1 })
  const topOfPage = () => {
    let y = 152
    if (pageCount > 1) {
      setFont(doc, "regular", 9, MUTED)
      doc.text(`${acta.groupName} — continuación`, margin, 44, { width: width - margin * 2 })
      y = 76
    }
    let x = margin
    for (const col of columns) {
      setFont(doc, "semibold", col.size, MUTED)
      doc.text(col.label, x, y + 4, { width: col.width, align: col.align })
      x += col.width
    }
    doc.save()
    doc.lineWidth(1).strokeColor(RED).moveTo(margin, y + 20).lineTo(width - margin, y + 20).stroke()
    doc.restore()
    return y + rowHeight
  }

  setFont(doc, "bold", 16)
  doc.text("ACTA DE FINALIZACIÓN DEL CURSO", margin, 56, { width: width - margin * 2 })
  setFont(doc, "regular", 10.5, MUTED)
  doc.text(
    `«${acta.groupName}» · Grupo N° ${acta.groupNumber} · Docente: ${acta.teacherName} · Finalizado el ${formatDate(acta.finishedAt)}`,
    margin,
    80,
    { width: width - margin * 2 },
  )
  doc.save()
  doc.lineWidth(2).strokeColor(RED).moveTo(margin, 108).lineTo(width - margin, 108).stroke()
  doc.restore()

  let y = topOfPage()
  acta.rows.forEach((row, i) => {
    if (y + rowHeight > height - 90) {
      doc.addPage()
      y = topOfPage()
    }
    const values = {
      index: String(i + 1),
      name: row.name,
      code: row.code ?? "—",
      topics: `${row.topicsCompleted}/${row.topicsTotal}`,
      definitive: row.definitive === null ? "—" : String(row.definitive),
      certified: row.certified ? "Sí" : "No",
      verification: row.verificationCode ?? "—",
    }
    let x = margin
    for (const col of columns) {
      const isCert = col.key === "certified"
      setFont(doc, isCert && row.certified ? "semibold" : "regular", col.size, isCert ? (row.certified ? RED : MUTED) : INK)
      doc.text(values[col.key], x, y, { width: col.width, align: col.align, ellipsis: true, height: rowHeight, lineBreak: false })
      x += col.width
    }
    doc.save()
    doc.lineWidth(0.5).strokeColor(HAIR)
    doc.moveTo(margin, y + rowHeight - 6).lineTo(width - margin, y + rowHeight - 6).stroke()
    doc.restore()
    y += rowHeight
  })

  setFont(doc, "semibold", 10.5)
  doc.text(
    `Certificados emitidos: ${acta.rows.filter((r) => r.certified).length} de ${acta.rows.length}`,
    margin,
    height - 64,
    { width: width - margin * 2 },
  )
  setFont(doc, "regular", 8.5, MUTED)
  doc.text(`Acta generada el ${formatDate(new Date())} por la plataforma LinuxLab.`, margin, height - 46, {
    width: width - margin * 2,
  })

  return toBuffer(doc)
}

module.exports = { renderStudentCertificate, renderInstructorCertificate, renderActa }
