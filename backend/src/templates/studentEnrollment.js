const { wrap } = require("./layout")

function renderStudentEnrollmentEmail(groupName, loginUrl) {
  const html = wrap({
    preheader: "Te inscribieron en un grupo de LinuxLab UFPS",
    heading: "Te inscribieron en " + (groupName || "un grupo"),
    intro: `<p style="margin:0 0 10px;">Tu docente te inscribió en el grupo <strong>${groupName || ""}</strong> de <strong>LinuxLab UFPS</strong>.</p><p style="margin:0;">Para acceder, entra con este mismo correo o crea tu cuenta con él. Completa la verificación de tu correo y tu acceso quedará activo.</p>`,
    ctaText: "Entrar a LinuxLab",
    ctaHref: loginUrl,
    footerNote: "Si no esperabas este correo, puedes ignorarlo.",
  })
  return {
    subject: `Inscrito en ${groupName || "un grupo"} — LinuxLab UFPS`,
    html,
    text: `Te inscribieron en el grupo ${groupName || ""} de LinuxLab UFPS.\n\nPara acceder, entra con este mismo correo o crea tu cuenta con él:\n\n${loginUrl}\n\nCompleta la verificación de tu correo y tu acceso quedará activo.`,
  }
}

module.exports = { renderStudentEnrollmentEmail }