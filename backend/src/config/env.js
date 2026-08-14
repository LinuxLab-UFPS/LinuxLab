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
  ssh: Object.freeze({
    host: process.env.SSH_HOST || "entorno",
    port: Number.parseInt(process.env.SSH_PORT || "22", 10),
    username: process.env.SSH_USER || "labadmin",
    keyPath: process.env.SSH_KEY_PATH || "/ssh/ssh_key",
  }),
  logLevel: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
})

module.exports = config
