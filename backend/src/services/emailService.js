const fs = require("fs")
const path = require("path")
const nodemailer = require("nodemailer")
const config = require("../config/env")
const logger = require("../lib/logger")
const { renderResetPasswordEmail } = require("../templates/resetPassword")
const { renderVerificationEmail } = require("../templates/verification")
const { renderSetupAccountEmail } = require("../templates/setupAccount")
const { renderStudentEnrollmentEmail } = require("../templates/studentEnrollment")
const { renderStudentCertificateEmail } = require("../templates/studentCertificate")
const { renderTeacherFinalizationEmail } = require("../templates/teacherFinalization")

let transport = null

function getTransport() {
  if (transport) return transport
  const s = config.email.smtp
  if (!s.host) {
    throw new Error("SMTP no configurado: define SMTP_HOST/SMTP_USER/SMTP_PASS")
  }
  transport = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: s.user || s.pass ? { user: s.user, pass: s.pass } : undefined,
    tls: { rejectUnauthorized: false },
  })
  return transport
}

function fromAddress() {
  return { address: config.email.fromAddress, name: config.email.fromName }
}

async function sendMail({ to, subject, html, text, category, attachments = [] }) {
  const t = getTransport()
  const allAttachments = [...attachments]
  try {
    const logoPath = path.join(__dirname, "../templates/assets/logo.png")
    if (html && html.includes("cid:logo") && fs.existsSync(logoPath)) {
      allAttachments.push({ filename: "logo.png", path: logoPath, cid: "logo" })
    }
  } catch {}
  const info = await t.sendMail({
    from: fromAddress(),
    to: Array.isArray(to) ? to : [to],
    subject,
    text: text || html?.replace(/<[^>]+>/g, "") || "",
    html,
    attachments: allAttachments.length ? allAttachments : undefined,
    category: category || "auth",
  })
  logger.info({ to, subject, messageId: info?.messageId }, "Email enviado")
  return info
}

module.exports = {
  sendMail,
  renderResetPasswordEmail,
  renderVerificationEmail,
  renderSetupAccountEmail,
  renderStudentEnrollmentEmail,
  renderStudentCertificateEmail,
  renderTeacherFinalizationEmail,
  getTransport,
}
