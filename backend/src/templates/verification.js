const { wrap } = require("./layout")

function renderVerificationEmail(link) {
  const html = wrap({
    preheader: "Verifica tu correo para activar tu cuenta en LinuxLab",
    heading: "Verifica tu correo",
    intro: `<p style="margin:0 0 10px;">Gracias por registrarte en <strong>LinuxLab UFPS</strong>.</p><p style="margin:0;">Confirma tu correo para activar tu cuenta y acceder al laboratorio virtual.</p>`,
    ctaText: "Verificar correo",
    ctaHref: link,
    footerNote: "Si no creaste una cuenta en LinuxLab, puedes ignorar este correo.",
  })
  return {
    subject: "Verifica tu correo — LinuxLab UFPS",
    html,
    text: `Verifica tu correo — LinuxLab UFPS\n\nGracias por registrarte.\n\nVisita: ${link}\n\nSi no creaste una cuenta, ignora este correo. Expira en 1 hora.`,
  }
}

module.exports = { renderVerificationEmail }
