const { Client } = require("ssh2")
const fs = require("fs")

let _conn = null
let _ready = false
let _connecting = null
const _activeAborts = new Set()

const SSH_CONFIG = {
  host: process.env.SSH_HOST || "entorno",
  port: parseInt(process.env.SSH_PORT || "22"),
  username: process.env.SSH_USER || "labadmin",
  privateKey: fs.readFileSync(process.env.SSH_KEY_PATH || "/ssh/ssh_key"),
  readyTimeout: 10000,
  keepaliveInterval: 30000,
  keepaliveCountMax: 3,
}

const CONNECT_TIMEOUT = 15000
const CONNECT_RETRIES = 3
const EXEC_TIMEOUT = 15000

function abortActiveCommands(err) {
  for (const abort of _activeAborts) {
    try {
      abort(err)
    } catch {
      // ignore per-command abort failures
    }
  }
  _activeAborts.clear()
}

async function connectWithRetries() {
  let lastErr = null
  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
    if (attempt > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt - 1)))
    }
    const conn = new Client()
    _conn = conn
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`SSH connection timed out after ${CONNECT_TIMEOUT}ms`))
        }, CONNECT_TIMEOUT)
        conn.on("ready", () => {
          clearTimeout(timer)
          _ready = true
          resolve()
        })
        conn.on("error", (err) => {
          clearTimeout(timer)
          _ready = false
          reject(err)
        })
        conn.on("close", () => {
          _ready = false
          if (_conn === conn) _conn = null
          abortActiveCommands(new Error("SSH connection closed"))
        })
        conn.connect(SSH_CONFIG)
      })
      return conn
    } catch (err) {
      lastErr = err
      _ready = false
      _conn = null
      try {
        conn.end()
      } catch {
        // ignore teardown errors
      }
    }
  }
  throw lastErr || new Error("Unable to connect to SSH host")
}

async function getConnection() {
  if (_ready && _conn) return _conn
  if (_connecting) return _connecting
  _connecting = connectWithRetries().finally(() => {
    _connecting = null
  })
  return _connecting
}

async function execCommand(command, options = {}) {
  const conn = await getConnection()
  const timeoutMs = options.timeoutMs ?? EXEC_TIMEOUT
  return new Promise((resolve, reject) => {
    let settled = false
    let timer = null
    let streamRef = null

    const finish = (err, result) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      _activeAborts.delete(abort)
      if (err) reject(err)
      else resolve(result)
    }

    const abort = (err) => {
      try {
        streamRef?.destroy()
      } catch {
        // ignore destroy errors
      }
      finish(err)
    }

    conn.exec(command, (err, stream) => {
      if (err) return finish(err)
      streamRef = stream
      let stdout = ""
      let stderr = ""
      stream.on("data", (d) => {
        stdout += d.toString()
      })
      stream.stderr.on("data", (d) => {
        stderr += d.toString()
      })
      stream.on("close", (code) => finish(null, { code, stdout: stdout.trim(), stderr: stderr.trim() }))
      stream.on("error", (e) => finish(e))

      // Lo que entra por stdin nunca pasa por la shell: es la via para mandarle
      // datos a un comando sin interpolarlos en la linea de comandos.
      if (options.stdin !== undefined) {
        stream.write(options.stdin)
        stream.end()
      }
      _activeAborts.add(abort)
      timer = setTimeout(() => {
        abort(new Error(`SSH command timed out after ${timeoutMs}ms: ${command.slice(0, 120)}`))
      }, timeoutMs)
    })
  })
}

async function createShellStream() {
  const conn = await getConnection()
  return new Promise((resolve, reject) => {
    conn.shell({ term: "xterm-256color" }, (err, stream) => {
      if (err) return reject(err)
      resolve(stream)
    })
  })
}

async function createExecStream(command) {
  const conn = await getConnection()
  return new Promise((resolve, reject) => {
    conn.exec(command, {
      // 80x24 es el tamaño clásico de una terminal y el que asume cualquier
      // programa que no reciba otro. Sólo dura hasta que el navegador informa
      // el suyo, pero si eso fallara, 180x40 dejaba la pantalla descuadrada.
      pty: { cols: 80, rows: 24, term: "xterm-256color" },
    }, (err, stream) => {
      if (err) return reject(err)
      resolve(stream)
    })
  })
}

module.exports = { execCommand, createShellStream, createExecStream, getConnection }
