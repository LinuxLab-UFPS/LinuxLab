const pino = require("pino")
const config = require("../config/env")

// pino-pretty is a devDependency and the production image installs with
// `npm ci --omit=dev`, so the transport can only be used in development.
// In production pino writes plain JSON to stdout, which is what the container
// log driver expects anyway.
const logger = pino({
  level: config.logLevel,
  ...(!config.isProd && {
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
