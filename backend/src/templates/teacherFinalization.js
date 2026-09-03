const { wrap } = require("./layout")

/**
 * Correo del docente al finalizar un grupo: el acta del curso y su certificado
 * de instructor van adjuntos, con el enlace de verificacion de este ultimo.
 */
function renderTeacherFinalizationEmail({ teacherName, groupName, studentsCertified, studentsTotal, verificationUrl }) {
  const html = wrap({
    preheader: "Curso finalizado: acta y certificado adjuntos",
    heading: "Curso finalizado: " + (groupName || ""),
    intro:
      `<p style="margin:0 0 10px;">Finalizaste el grupo <strong>${groupName || ""}</strong>. Se emitieron <strong>${studentsCertified}</strong> certificado(s) de <strong>${studentsTotal}</strong> estudiante(s) que cumplieron la regla de certificación.</p>` +
      `<p style="margin:0;">El <strong>acta del curso</strong> con el detalle de cada estudiante y tu <strong>certificado de instructor</strong> van adjuntos a este correo.</p>`,
    ctaText: "Verificar certificado de instructor",
    ctaHref: verificationUrl,
    footerNote:
      "Los certificados de tus estudiantes les llegaron a su propio correo con su enlace de verificación.",
    expires: false,
  })
  return {
    subject: `Curso finalizado: ${groupName || "grupo"} — acta y certificado`,
    html,
    text:
      `Finalizaste el grupo ${groupName || ""}.\n\n` +
      `Se emitieron ${studentsCertified} certificado(s) de ${studentsTotal} estudiante(s).\n` +
      `El acta del curso y tu certificado de instructor van adjuntos.\n\n` +
      `Verifica tu certificado en: ${verificationUrl}\n`,
  }
}

module.exports = { renderTeacherFinalizationEmail }
