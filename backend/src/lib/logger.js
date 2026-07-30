const pino = require("pino")

const isDev = process.env.NODE_ENV !== "production"

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: {
    target: "pino-pretty",
    options: {
      colorize: isDev,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
      singleLine: true,
    },
  },
  redact: ["req.headers.cookie", "req.headers.authorization"],
})

module.exports = logger
