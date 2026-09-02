const { wrap } = require("./layout")

/**
 * Correo del certificado de finalizacion: el PDF va adjunto y el enlace de
 * verificacion queda en el cuerpo, para que el estudiante (o quien reciba el
 * documento) pueda comprobarlo sin entrar a la plataforma.
 */
function renderStudentCertificateEmail({ holderName, groupName, verificationUrl, loginUrl }) {
  const html = wrap({
    preheader: "Tu certificado de finalización está listo",
    heading: "¡Felicidades, " + (holderName || "estudiante") + "!",
    intro:
      `<p style="margin:0 0 10px;">Completaste satisfactoriamente el curso <strong>${groupName || ""}</strong> de <strong>LinuxLab UFPS</strong>. Tu certificado va adjunto a este correo.</p>` +
      `<p style="margin:0;">Cualquier persona puede comprobar su autenticidad con el código de verificación que aparece en el documento:</p>`,
    ctaText: "Verificar certificado",
    ctaHref: verificationUrl,
    footerNote:
      (loginUrl
        ? `<p style="margin:0 0 10px;">También puedes consultarlo desde la plataforma con tu cuenta: <a href="${loginUrl}" style="color:#c41e3a;">${loginUrl}</a></p>`
        : "") +
      "Si no esperabas este correo, puedes ignorarlo.",
    expires: false,
  })
  return {
    subject: `Tu certificado de finalización — ${groupName || "LinuxLab UFPS"}`,
    html,
    text:
      `¡Felicidades${holderName ? ", " + holderName : ""}!\n\n` +
      `Completaste satisfactoriamente el curso ${groupName || ""} de LinuxLab UFPS. Tu certificado va adjunto.\n\n` +
      `Verifícalo en: ${verificationUrl}\n`,
  }
}

module.exports = { renderStudentCertificateEmail }
