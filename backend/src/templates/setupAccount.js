const { wrap } = require("./layout")

function renderSetupAccountEmail(link) {
  const html = wrap({
    preheader: "Configura el acceso de tu cuenta de docente en LinuxLab UFPS",
    heading: "Configura tu cuenta de docente",
    intro: `<p style="margin:0 0 10px;">Un administrador registró tu correo como docente en <strong>LinuxLab UFPS</strong>.</p><p style="margin:0;">Haz clic en el botón para crear tu contraseña y activar tu acceso. Si no esperabas este correo, puedes ignorarlo.</p>`,
    ctaText: "Configurar mi cuenta",
    ctaHref: link,
    footerNote: "Este enlace es personal y expira en 1 hora. Si no fuiste tú, ignora este mensaje.",
  })
  return {
    subject: "Configura tu cuenta de docente — LinuxLab UFPS",
    html,
    text: `Configura tu cuenta de docente — LinuxLab UFPS\n\nUn administrador registró tu correo como docente.\n\nVisita: ${link}\n\nSi no esperabas este correo, ignóralo. Expira en 1 hora.`,
  }
}

module.exports = { renderSetupAccountEmail }
