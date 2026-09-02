function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * `expires`: la nota de caducidad solo vale para los enlaces de un solo uso
 * (verificar el correo, restablecer la clave). Un certificado no caduca, y
 * decirle a alguien que su enlace expira en una hora lo manda a pedir otro que
 * nadie le va a enviar.
 */
function wrap({ preheader, heading, intro, ctaText, ctaHref, footerNote, expires = true }) {
  const safeHref = escapeHtml(ctaHref)
  const safeCta = escapeHtml(ctaText)
  const safeHeading = escapeHtml(heading)
  const safeIntro = intro
  const safeFooter = escapeHtml(footerNote)
  const safePre = escapeHtml(preheader)
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeHeading}</title></head><body style="margin:0;padding:0;background-color:#f6f7f9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${safePre}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f7f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;background-color:#ffffff;border:1px solid #e2e5ea;border-radius:12px;overflow:hidden;">
<tr><td align="center" style="padding:28px 24px 14px;background-color:#ffffff;">
<img src="cid:logo" width="48" height="48" alt="LinuxLab" style="display:block;border-radius:10px;width:48px;height:48px;">
<div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#5b626b;text-transform:uppercase;">LinuxLab UFPS</div>
<div style="margin-top:2px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8b949e;">Laboratorio Virtual de Linux</div>
</td></tr>
<tr><td style="padding:4px 24px 0 24px;">
<h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.3;color:#1c2128;font-weight:700;">${safeHeading}</h1>
</td></tr>
<tr><td style="padding:12px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1c2128;">
${safeIntro}
</td></tr>
<tr><td align="center" style="padding:20px 24px 18px;">
<a href="${safeHref}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 28px;background-color:#C41E3A;color:#ffffff;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:1;mso-padding-alt:0;">${safeCta}</a>
</td></tr>
<tr><td style="padding:0 24px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#64748b;word-break:break-all;">
Si el botón no funciona, copia y pega este enlace:<br>
<a href="${safeHref}" target="_blank" rel="noopener" style="color:#C41E3A;text-decoration:underline;word-break:break-all;">${safeHref}</a>
</td></tr>
<tr><td style="padding:14px 24px 20px;border-top:1px solid #eceef1;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#8b949e;text-align:center;">
${safeFooter}${expires ? "<br>Este enlace expira en 1 hora por seguridad." : ""}
</td></tr>
</table>
<div style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8b949e;text-align:center;">Enviado por LinuxLab · UFPS</div>
</td></tr>
</table>
</body></html>`
}

module.exports = { wrap }
