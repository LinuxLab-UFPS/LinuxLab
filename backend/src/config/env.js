require("dotenv/config")

const REQUIRED_ENV = ["JWT_SECRET", "DATABASE_URL"]

const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  throw new Error(
    `Faltan variables de entorno requeridas: ${missing.join(", ")}. ` +
      "Revisa el archivo .env o las variables del contenedor.",
  )
}

const isProd = process.env.NODE_ENV === "production"

const config = Object.freeze({
  isProd,
  port: Number.parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET,
    expiresIn: "7d",
    cookieName: "token",
    cookie: Object.freeze({
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    }),
  }),
  firebase: Object.freeze({
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  }),
  ssh: Object.freeze({
    host: process.env.SSH_HOST || "entorno",
    port: Number.parseInt(process.env.SSH_PORT || "22", 10),
    username: process.env.SSH_USER || "labadmin",
    keyPath: process.env.SSH_KEY_PATH || "/ssh/ssh_key",
  }),
  frontendUrl: (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001").replace(/\/$/, ""),
  email: Object.freeze({
    provider: (process.env.EMAIL_PROVIDER || "log").toLowerCase(),
    fromAddress: process.env.EMAIL_FROM_ADDRESS || "hello@demomailtrap.co",
    fromName: process.env.EMAIL_FROM_NAME || "LinuxLab",
    mailtrapToken: process.env.MAILTRAP_TOKEN || "",
    smtp: Object.freeze({
      host: process.env.SMTP_HOST || "",
      port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    }),
  }),
  logLevel: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
})

module.exports = config
