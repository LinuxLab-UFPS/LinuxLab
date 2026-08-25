const { wrap } = require("./layout")

function renderResetPasswordEmail(link) {
  const html = wrap({
    preheader: "Restablece tu contraseña en LinuxLab UFPS",
    heading: "Restablecer contraseña",
    intro: `<p style="margin:0 0 10px;">Recibimos una solicitud para restablecer tu contraseña en <strong>LinuxLab UFPS</strong>.</p><p style="margin:0;">Haz clic en el botón para crear una nueva contraseña. Si no fuiste tú, puedes ignorar este correo.</p>`,
    ctaText: "Restablecer contraseña",
    ctaHref: link,
    footerNote: "Si no solicitaste este cambio, ignora este mensaje. Tu contraseña no será modificada.",
  })
  return {
    subject: "Restablecer contraseña — LinuxLab UFPS",
    html,
    text: `Restablecer contraseña — LinuxLab UFPS\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nVisita: ${link}\n\nSi no solicitaste esto, ignora este correo. Expira en 1 hora.`,
  }
}

module.exports = { renderResetPasswordEmail }
