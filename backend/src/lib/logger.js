const pino = require("pino")

const isDev = process.env.NODE_ENV !== "production"

// pino-pretty is a devDependency and the production image installs with
// `npm ci --omit=dev`, so the transport can only be used in development.
// In production pino writes plain JSON to stdout, which is what the container
// log driver expects anyway.
const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: true,
      },
    },
  }),
  redact: ["req.headers.cookie", "req.headers.authorization"],
})

module.exports = logger
