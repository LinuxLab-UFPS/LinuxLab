const { Client } = require("ssh2")
const fs = require("fs")

let _conn = null
let _ready = false

const SSH_CONFIG = {
  host: process.env.SSH_HOST || "entorno",
  port: parseInt(process.env.SSH_PORT || "22"),
  username: process.env.SSH_USER || "root",
  privateKey: fs.readFileSync(process.env.SSH_KEY_PATH || "/ssh/ssh_key"),
  readyTimeout: 10000,
  keepaliveInterval: 30000,
  keepaliveCountMax: 3,
}

function applyReadyHandlers(resolve, reject) {
  _conn.on("ready", () => {
    _ready = true
    resolve(_conn)
  })
  _conn.on("error", (err) => {
    _ready = false
    if (!resolve) return
    reject(err)
    resolve = null
  })
  _conn.on("close", () => {
    _ready = false
    _conn = null
  })
}

async function getConnection() {
  if (_ready && _conn) return _conn
  _conn = new Client()
  _ready = false
  return new Promise((resolve, reject) => {
    applyReadyHandlers(resolve, reject)
    _conn.connect(SSH_CONFIG)
  })
}

async function execCommand(command) {
  const conn = await getConnection()
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err)
      let stdout = ""
      let stderr = ""
      stream.on("data", (d) => { stdout += d.toString() })
      stream.stderr.on("data", (d) => { stderr += d.toString() })
      stream.on("close", (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }))
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

module.exports = { execCommand, createShellStream, getConnection }
