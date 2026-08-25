const fs = require("fs")
const path = require("path")
const nodemailer = require("nodemailer")
const config = require("../config/env")
const logger = require("../lib/logger")
const { renderResetPasswordEmail } = require("../templates/resetPassword")
const { renderVerificationEmail } = require("../templates/verification")
const { renderSetupAccountEmail } = require("../templates/setupAccount")
const { renderStudentEnrollmentEmail } = require("../templates/studentEnrollment")

let transport = null

function getTransport() {
  if (transport) return transport
  const provider = config.email.provider
  if (provider === "mailtrap" && config.email.mailtrapToken) {
    try {
      const { MailtrapTransport } = require("mailtrap")
      transport = nodemailer.createTransport(
        MailtrapTransport({ token: config.email.mailtrapToken })
      )
      return transport
    } catch (err) {
      logger.error({ err }, "No se pudo inicializar MailtrapTransport, fallback a log")
    }
  }
  if (provider === "smtp" && config.email.smtp.host) {
    const s = config.email.smtp
    transport = nodemailer.createTransport({
      host: s.host,
      port: s.port,
      secure: s.secure,
      auth: s.user || s.pass ? { user: s.user, pass: s.pass } : undefined,
      tls: { rejectUnauthorized: false },
    })
    return transport
  }
  transport = {
    sendMail: async (opts) => {
      logger.info({ to: opts.to, subject: opts.subject }, "[log] email (provider=log)")
      return { messageId: "log" }
    },
  }
  return transport
}

function fromAddress() {
  return { address: config.email.fromAddress, name: config.email.fromName }
}

async function sendMail({ to, subject, html, text, category }) {
  const t = getTransport()
  const attachments = []
  try {
    const logoPath = path.join(__dirname, "../templates/assets/logo.png")
    if (html && html.includes("cid:logo") && fs.existsSync(logoPath)) {
      attachments.push({ filename: "logo.png", path: logoPath, cid: "logo" })
    }
  } catch {}
  const info = await t.sendMail({
    from: fromAddress(),
    to: Array.isArray(to) ? to : [to],
    subject,
    text: text || html?.replace(/<[^>]+>/g, "") || "",
    html,
    attachments: attachments.length ? attachments : undefined,
    category: category || "auth",
  })
  logger.info({ to, subject, messageId: info?.messageId }, "Email enviado")
  return info
}

module.exports = { sendMail, renderResetPasswordEmail, renderVerificationEmail, renderSetupAccountEmail, renderStudentEnrollmentEmail, getTransport }
