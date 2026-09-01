/** Respuesta estandar para un PDF descargable. */
function sendPdf(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.setHeader("Content-Length", buffer.length)
  res.setHeader("Cache-Control", "no-store")
  res.send(buffer)
}

module.exports = { sendPdf }
