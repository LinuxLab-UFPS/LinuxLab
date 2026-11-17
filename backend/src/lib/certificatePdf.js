/**
 * Los tres documentos de la certificacion: el certificado del estudiante, el
 * del instructor y el acta del curso.
 *
 * Salen en tinta sobre papel a proposito, igual que la hoja de comandos del
 * frontend: un PDF acaba impreso en blanco o en un visor que no sabe nada de
 * los fondos oscuros de la plataforma. De la marca se toman el icono y el
 * rojo, y el rojo solo se gasta en lo que importa —el logo, la definitiva, el
 * "Si" del acta—; el resto es tinta, gris y filetes.
 *
 * Sin marcos: un doble borde rojo alrededor de la hoja se lee como plantilla
 * de Word y le quita el sitio a lo unico que de verdad importa aqui, que es el
 * nombre de quien recibe el certificado.
 */

const fs = require("fs")
const path = require("path")
const PDFDocument = require("pdfkit")
const QRCode = require("qrcode")
const { COURSE_HOURS } = require("./constants")

// Las mismas fuentes que usa la plataforma, embebidas en el PDF. Viven junto
// al logo de los correos, que ya viaja en la imagen.
const FONT_DIR = path.join(__dirname, "../templates/assets/fonts")

// Los cinco ficheros de Onest declaran el mismo nombre interno de familia
// ("Onest-Regular") aunque son pesos distintos de verdad. No colisionan porque
// pdfkit indexa por la clave con la que se registran aqui, no por su metadata.
const FACES = {
  regular: { file: "onest/Onest-Regular.ttf", fallback: "Helvetica" },
  medium: { file: "onest/Onest-Medium.ttf", fallback: "Helvetica" },
  semibold: { file: "onest/Onest-SemiBold.ttf", fallback: "Helvetica-Bold" },
  bold: { file: "onest/Onest-Bold.ttf", fallback: "Helvetica-Bold" },
  mono: { file: "geist-mono/GeistMono-Regular.ttf", fallback: "Courier" },
}

// Se resuelve una vez por proceso: comprobar la existencia en cada documento
// seria I/O para nada. Si falta un fichero se cae a la fuente estandar, que
// tambien cubre los acentos del espanol.
const RESOLVED = Object.fromEntries(
  Object.entries(FACES).map(([key, face]) => {
    const full = path.join(FONT_DIR, face.file)
    return [key, fs.existsSync(full) ? full : face.fallback]
  }),
)

const isEmbedded = (source) => source.endsWith(".ttf")

// Los tokens del sitio (globals.css), no los de Tailwind.
const RED = "#C41E3A" // --primary
const INK = "#1c2128" // --foreground
const MUTED = "#5b626b" // --muted-foreground
const HAIR = "#e2e5ea" // --border

const dateFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" })
const formatDate = (value) => dateFmt.format(new Date(value))

// Version corta para las celdas de datos, donde la fecha larga no cabe en una
// linea. es-CO deja las preposiciones incluso en formato corto ("3 de mar de
// 2026"), asi que se arma a mano: "3 mar 2026".
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
function formatShort(value) {
  // Hora local, igual que `formatDate`: en UTC la misma fecha cae un dia
  // despues y la celda no cuadraria con la del parrafo.
  const d = new Date(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function newDocument({ layout, title }) {
  const doc = new PDFDocument({
    size: "A4",
    layout,
    margin: 0,
    info: { Title: title, Author: "LinuxLab UFPS" },
  })
  // pdfkit registra las fuentes por documento, no por proceso.
  for (const [key, source] of Object.entries(RESOLVED)) {
    if (isEmbedded(source)) doc.registerFont(key, source)
  }
  return doc
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
  const source = RESOLVED[variant]
  doc.font(isEmbedded(source) ? variant : source).fontSize(size).fillColor(color)
}

/**
 * Recorta un texto al ancho dado anadiendo puntos suspensivos.
 *
 * pdfkit ignora `ellipsis` cuando el bloque no lleva `height`, y con `height`
 * puesto deja de respetar `lineBreak: false`: en una tabla de alto fijo, un
 * nombre largo se parte en dos renglones y se come la fila siguiente. Medir y
 * cortar a mano es lo unico que se comporta igual siempre.
 */
function truncate(doc, text, width) {
  if (doc.widthOfString(text) <= width) return text
  let cut = text
  while (cut.length > 1 && doc.widthOfString(`${cut}…`) > width) {
    cut = cut.slice(0, -1)
  }
  return `${cut.trimEnd()}…`
}

/** Filete horizontal. Fino a proposito: 0.8 para dividir, 0.4 entre renglones. */
function rule(doc, x1, y, x2, weight = 0.8, color = HAIR) {
  doc.save()
  doc.lineWidth(weight).strokeColor(color).moveTo(x1, y).lineTo(x2, y).stroke()
  doc.restore()
}

/**
 * El icono de la marca (frontend/public/icon.svg) redibujado con primitivas,
 * escalando desde su caja de 64. Se redibuja en vez de incrustar el PNG porque
 * a este tamano el mapa de bits se ve blando al imprimir.
 *
 * La barra de titulo del SVG es un path con beziers, pero sus puntos de control
 * (57.732 y 6.268) son exactamente desplazamientos de 14 x 0.5523: es un rect
 * de 64x14 con las esquinas de arriba redondeadas a 14. Recortar con la misma
 * caja redondeada del cuerpo da esa forma sin transcribir la curva.
 */
function drawLogo(doc, x, y, size) {
  const k = size / 64
  doc.save()
  doc.translate(x, y).scale(k)

  doc.roundedRect(0, 0, 64, 64, 14).fill("#0A0A0A")

  doc.save()
  doc.roundedRect(0, 0, 64, 64, 14).clip()
  doc.rect(0, 0, 64, 14).fill("#16181D")
  doc.restore()

  doc.circle(9, 7, 2).fill(RED)
  doc.circle(16, 7, 2).fill("#2E323B")
  doc.circle(23, 7, 2).fill("#2E323B")

  // Las dos eles: rectas y sin redondeos, como en el icono.
  doc.moveTo(15, 22).lineTo(23, 22).lineTo(23, 42).lineTo(29, 42).lineTo(29, 50).lineTo(15, 50).closePath().fill(RED)
  doc.moveTo(35, 22).lineTo(43, 22).lineTo(43, 42).lineTo(49, 42).lineTo(49, 50).lineTo(35, 50).closePath().fill("#FFFFFF")

  doc.restore()
}

/** Marca de agua del encabezado: icono, nombre y linea de apoyo. */
function drawBrand(doc, x, y, subtitle) {
  drawLogo(doc, x, y, 28)
  setFont(doc, "semibold", 9.5, INK)
  doc.text("LINUXLAB UFPS", x + 40, y + 3, { characterSpacing: 1.2, lineBreak: false })
  setFont(doc, "regular", 8.5, MUTED)
  doc.text(subtitle, x + 40, y + 17, { lineBreak: false })
}

/**
 * Tira de datos del certificado: etiqueta pequena en versalitas sobre el valor.
 * `accent` pinta el valor en rojo. Las celdas van centradas porque el
 * certificado entero va centrado.
 */
function drawStatStrip(doc, x, y, width, cells) {
  rule(doc, x, y, x + width, 0.4)
  rule(doc, x, y + 58, x + width, 0.4)
  const cellWidth = width / cells.length
  cells.forEach((cell, i) => {
    const cx = x + i * cellWidth
    setFont(doc, "semibold", 7.5, MUTED)
    doc.text(cell.label.toUpperCase(), cx, y + 13, { width: cellWidth, align: "center", characterSpacing: 0.8 })
    setFont(doc, "semibold", 15, cell.accent ? RED : INK)
    doc.text(truncate(doc, cell.value, cellWidth - 12), cx, y + 28, { width: cellWidth, align: "center", lineBreak: false })
  })
}

/**
 * Codigo QR dibujado modulo a modulo con rectangulos. Se dibuja en vez de
 * incrustar una imagen porque asi es vectorial: se imprime nitido a cualquier
 * tamano. Todo el cuadro es ademas un enlace, para quien abre el PDF en
 * pantalla en vez de escanearlo.
 */
function drawQr(doc, url, x, y, size) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" })
  const count = qr.modules.size
  const cell = size / count
  doc.save()
  doc.rect(x - 4, y - 4, size + 8, size + 8).fill("#FFFFFF")
  doc.fillColor(INK)
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      // Un poco mas ancho que la celda: sin solape, los visores dejan lineas
      // blancas finas entre modulos vecinos.
      if (qr.modules.get(row, col)) doc.rect(x + col * cell, y + row * cell, cell + 0.2, cell + 0.2)
    }
  }
  doc.fill()
  doc.restore()
  doc.link(x, y, size, size, url)
}

/**
 * Bloque de firma: una linea para firmar y debajo quien firma, en que calidad
 * y por que institucion. Va en el pie izquierdo, como en los certificados de
 * la Cisco Networking Academy que usa la universidad.
 */
function drawSigner(doc, x, y, width, { name, role, institution }) {
  rule(doc, x, y, x + width, 0.6, MUTED)
  setFont(doc, "semibold", 10.5, INK)
  doc.text(truncate(doc, name, width), x, y + 8, { lineBreak: false })
  setFont(doc, "regular", 9.5, MUTED)
  doc.text(role, x, y + 23, { lineBreak: false })
  doc.text(institution, x, y + 37, { width })
}

const INSTITUTION = "Universidad Francisco de Paula Santander - Cúcuta"

/**
 * El esqueleto que comparten los dos certificados. Tenerlo en un solo sitio es
 * lo que hace que sean la misma familia y no dos ficheros que se separan.
 *
 * La composicion sigue la de los certificados de la Cisco Networking Academy
 * que la universidad ya entrega: todo centrado, el nombre y el curso como lo
 * mas grande de la hoja, y en el pie la firma a la izquierda, el QR de
 * verificacion al centro y el codigo a la derecha.
 */
async function renderCertificate({ title, name, lead, course, detail, cells, signer, code, verificationUrl }) {
  const width = 841.89
  const height = 595.28
  const margin = 64
  const right = width - margin
  const inner = right - margin
  const doc = newDocument({ layout: "landscape", title: `${title} — ${name}` })

  // Marco fino, apenas un filete gris: delimita la hoja impresa sin competir
  // con el contenido.
  doc.save()
  doc.lineWidth(0.8).strokeColor(HAIR).rect(24, 24, width - 48, height - 48).stroke()
  doc.restore()

  drawBrand(doc, margin, 46, "Laboratorio Virtual de Linux")
  setFont(doc, "semibold", 9, MUTED)
  doc.text(title.toUpperCase(), margin, 54, { width: inner, align: "right", characterSpacing: 1.2 })
  rule(doc, margin, 90, right)

  setFont(doc, "regular", 13, MUTED)
  doc.text("Este certificado se otorga a", margin, 118, { width: inner, align: "center" })

  // El nombre es lo mas grande de la hoja, y va en tinta: el rojo aqui le
  // quitaria fuerza en vez de darsela.
  setFont(doc, "bold", 34, INK)
  doc.text(truncate(doc, name, inner), margin, 140, { width: inner, align: "center", lineBreak: false })

  setFont(doc, "regular", 13, MUTED)
  doc.text(lead, margin, 196, { width: inner, align: "center" })

  setFont(doc, "semibold", 22, RED)
  doc.text(truncate(doc, course, inner), margin, 218, { width: inner, align: "center", lineBreak: false })

  setFont(doc, "regular", 11.5, MUTED)
  doc.text(detail, margin + 70, 256, { width: inner - 140, align: "center", lineGap: 3 })

  drawStatStrip(doc, margin, 320, inner, cells)

  // Pie: firma a la izquierda, QR al centro y verificacion a la derecha.
  const footY = 430
  drawSigner(doc, margin, footY + 30, 230, signer)

  const qrSize = 84
  const qrX = (width - qrSize) / 2
  drawQr(doc, verificationUrl, qrX, footY, qrSize)
  setFont(doc, "regular", 7.5, MUTED)
  doc.text("Escanea para verificar", qrX - 30, footY + qrSize + 8, { width: qrSize + 60, align: "center" })

  const colW = 250
  const colX = right - colW
  setFont(doc, "regular", 8, MUTED)
  doc.text("Código de verificación", colX, footY + 30, { width: colW, align: "right" })
  setFont(doc, "mono", 11, INK)
  doc.text(code, colX, footY + 43, { width: colW, align: "right", lineBreak: false })
  setFont(doc, "regular", 8, MUTED)
  doc.text("Verifícalo en", colX, footY + 64, { width: colW, align: "right" })
  setFont(doc, "mono", 7.5, RED)
  const shown = truncate(doc, verificationUrl.replace(/^https?:\/\//, ""), colW)
  doc.text(shown, colX, footY + 76, { width: colW, align: "right", lineBreak: false, link: verificationUrl })

  return toBuffer(doc)
}

/**
 * Certificado de finalizacion de un estudiante. Los datos vienen congelados de
 * la fila Certificate: re-renderizar nunca cambia lo que se emitio.
 */
async function renderStudentCertificate(cert) {
  return renderCertificate({
    title: "Certificado de finalización",
    name: cert.holderName,
    lead: "por completar con éxito el curso",
    course: cert.groupName,
    detail:
      `ofrecido por la ${INSTITUTION} a través de la plataforma LinuxLab, ` +
      `con una intensidad de ${COURSE_HOURS} horas.`,
    cells: [
      { label: "Inicio", value: formatShort(cert.courseStartedAt) },
      { label: "Finalización", value: formatShort(cert.issuedAt) },
      { label: "Intensidad", value: `${COURSE_HOURS} horas` },
      { label: "Temas completados", value: `${cert.topicsCompleted}/${cert.topicsTotal}` },
      { label: "Definitiva", value: cert.definitive == null ? "—" : String(cert.definitive), accent: true },
    ],
    signer: { name: cert.teacherName, role: "Instructor", institution: INSTITUTION },
    code: cert.code,
    verificationUrl: cert.verificationUrl,
  })
}

/**
 * Certificado del docente por dirigir el curso. Es su credencial, asi que
 * habla de su trabajo: cuantos de sus estudiantes se certificaron es una
 * metrica del grupo y no pinta nada en un documento personal. La firma es la
 * de la plataforma, porque el instructor no puede firmarse a si mismo.
 */
async function renderInstructorCertificate(cert) {
  return renderCertificate({
    title: "Certificado de instructor",
    name: cert.holderName,
    lead: "por dirigir el curso",
    course: cert.groupName,
    detail:
      `en la plataforma LinuxLab de la ${INSTITUTION}, ` +
      `con una intensidad de ${COURSE_HOURS} horas.`,
    cells: [
      { label: "Curso", value: `N° ${cert.groupNumber}` },
      { label: "Inicio", value: formatShort(cert.courseStartedAt) },
      { label: "Finalización", value: formatShort(cert.issuedAt), accent: true },
      { label: "Intensidad", value: `${COURSE_HOURS} horas` },
    ],
    signer: { name: "LinuxLab UFPS", role: "Laboratorio Virtual de Linux", institution: INSTITUTION },
    code: cert.code,
    verificationUrl: cert.verificationUrl,
  })
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
  const right = width - margin
  const doc = newDocument({ layout: "portrait", title: `Acta de finalización — ${acta.groupName}` })

  // Las columnas suman 482pt: el ancho util de A4 vertical con margen 56.
  // Las numericas van en mono para que alineen en vertical de un vistazo. El
  // codigo de verificacion baja a 7.5: a 8pt sus 24 caracteres no caben en los
  // 112 de la columna y se truncarian en silencio.
  const columns = [
    { key: "index", label: "#", width: 20, align: "left", size: 9, face: "regular" },
    { key: "name", label: "Estudiante", width: 124, align: "left", size: 9, face: "regular" },
    { key: "code", label: "Código", width: 66, align: "left", size: 8.5, face: "mono" },
    { key: "topics", label: "Temas", width: 46, align: "center", size: 8.5, face: "mono" },
    { key: "definitive", label: "Definitiva", width: 56, align: "center", size: 8.5, face: "mono" },
    { key: "certified", label: "Cert.", width: 40, align: "center", size: 9, face: "regular" },
    { key: "verification", label: "Verificación", width: 130, align: "left", size: 7.5, face: "mono" },
  ]
  const rowHeight = 24
  // pdfkit no expone el total de paginas: lo llevamos con el evento pageAdded.
  let pageCount = 1
  doc.on("pageAdded", () => { pageCount += 1 })
  const topOfPage = () => {
    let y = 150
    if (pageCount > 1) {
      setFont(doc, "regular", 9, MUTED)
      doc.text(`${acta.groupName} — continuación`, margin, 44, { width: right - margin })
      y = 76
    }
    let x = margin
    for (const col of columns) {
      setFont(doc, "semibold", 8, MUTED)
      doc.text(col.label.toUpperCase(), x, y + 6, {
        width: col.width,
        align: col.align,
        characterSpacing: 0.6,
        lineBreak: false,
      })
      x += col.width
    }
    rule(doc, margin, y + 20, right)
    return y + rowHeight
  }

  drawBrand(doc, margin, 48, "Acta de finalización")

  setFont(doc, "bold", 19, INK)
  doc.text(acta.groupName, margin, 92, { width: right - margin })
  setFont(doc, "regular", 9.5, MUTED)
  doc.text(
    `Curso N° ${acta.groupNumber} · Docente: ${acta.teacherName} · Finalizado el ${formatDate(acta.finishedAt)}`,
    margin,
    116,
    { width: right - margin },
  )

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
      // El negativo se retira en vez de afirmarse: el acta la lee el docente.
      certified: row.certified ? "Sí" : "—",
      verification: row.verificationCode ?? "—",
    }
    let x = margin
    for (const col of columns) {
      const isCert = col.key === "certified"
      const face = isCert && row.certified ? "semibold" : col.face
      const color = isCert ? (row.certified ? RED : MUTED) : INK
      setFont(doc, face, col.size, color)
      // El recorte se hace a mano (ver `truncate`) y por eso el bloque va sin
      // `ellipsis`: la fila tiene alto fijo y nada puede pasar a dos renglones.
      doc.text(truncate(doc, values[col.key], col.width - 4), x, y, {
        width: col.width,
        align: col.align,
        lineBreak: false,
      })
      x += col.width
    }
    rule(doc, margin, y + rowHeight - 6, right, 0.4)
    y += rowHeight
  })

  setFont(doc, "regular", 9, MUTED)
  doc.text("Certificados emitidos", margin, height - 68, { width: right - margin })
  setFont(doc, "semibold", 12, INK)
  doc.text(
    `${acta.rows.filter((r) => r.certified).length} de ${acta.rows.length}`,
    margin,
    height - 55,
    { width: right - margin },
  )
  setFont(doc, "regular", 8, MUTED)
  doc.text(`Acta generada el ${formatDate(new Date())} por la plataforma LinuxLab.`, margin, height - 34, {
    width: right - margin,
  })

  return toBuffer(doc)
}

module.exports = { renderStudentCertificate, renderInstructorCertificate, renderActa }
