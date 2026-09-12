/**
 * Prueba de CARGA del canal de terminal (RNF-05), aparte de la suite de Jest.
 *
 * Abre N sesiones WebSocket reales contra el gateway de la terminal y mide
 * cuantas se establecen. A diferencia de la prueba de concurrencia de Jest
 * (que usa la PTY simulada), esta golpea el backend/entorno reales, asi que
 * consume recursos del servidor: ejecutala contra el stack local o de
 * despliegue, no en CI.
 *
 * Requisitos:
 *   - El stack levantado (backend, entorno, postgres).
 *   - Un estudiante demo con matricula activa y su cuenta Linux provisionada
 *     (por ejemplo el que crea `prisma/seed-demo.js`).
 *
 * Uso (desde backend/):
 *   node scripts/loadtest-terminal.mjs \
 *     --url ws://localhost:3000/terminal \
 *     --userId <uuid-del-estudiante> \
 *     --count 40 --seconds 15
 *
 * La cookie se firma con el JWT_SECRET del backend/.env (o de la variable de
 * entorno JWT_SECRET), igual que la inyecta la aplicacion.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import jwt from "jsonwebtoken"
import WebSocket from "ws"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.join(__dirname, "..", ".env")

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

function readSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  const raw = fs.readFileSync(ENV_PATH, "utf8")
  const line = raw.split("\n").find((l) => l.startsWith("JWT_SECRET="))
  if (!line) throw new Error(`Falta JWT_SECRET en ${ENV_PATH}`)
  return line.slice("JWT_SECRET=".length).trim()
}

const url = arg("url", "ws://localhost:3000/terminal")
const userId = arg("userId")
const count = Number(arg("count", "40"))
const seconds = Number(arg("seconds", "15"))

if (!userId) {
  console.error("Falta --userId (uuid de un estudiante con matricula y cuenta provisionada).")
  process.exit(1)
}

const token = jwt.sign(
  {
    id: userId,
    email: "loadtest@ufps.edu.co",
    role: "student",
    name: "Load Test",
    code: null,
    hasEnrollment: true,
  },
  readSecret(),
  { expiresIn: "1h" },
)

const sockets = []
let abiertas = 0
let cerradas = 0
const inicio = Date.now()

function conectar(i) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, { headers: { Cookie: `token=${token}` } })
    const timer = setTimeout(() => {
      ws.terminate()
      resolve({ i, ok: false, code: "timeout" })
    }, 15000)

    ws.on("open", () => {
      clearTimeout(timer)
      abiertas += 1
      resolve({ i, ok: true })
    })
    ws.on("close", (code) => {
      cerradas += 1
      resolve({ i, ok: false, code })
    })
    ws.on("error", (err) => {
      clearTimeout(timer)
      resolve({ i, ok: false, code: err.message })
    })
    sockets.push(ws)
  })
}

console.log(`Abriendo ${count} sesiones de terminal contra ${url} ...`)
const resultados = await Promise.all(Array.from({ length: count }, (_, i) => conectar(i)))
const aperturaMs = Date.now() - inicio

console.log(`\nSesiones abiertas: ${abiertas}/${count} en ${aperturaMs} ms`)
const fallidas = resultados.filter((r) => !r.ok)
if (fallidas.length) {
  console.log("Fallidas:", fallidas.map((f) => `${f.i}:${f.code}`).join(", "))
}

console.log(`Manteniendo las sesiones ${seconds} s ...`)
await new Promise((resolve) => setTimeout(resolve, seconds * 1000))

const totalMs = Date.now() - inicio
console.log(`\nResumen RNF-05:`)
console.log(`  meta:              40 sesiones simultaneas`)
console.log(`  abiertas:          ${abiertas}`)
console.log(`  cerradas:          ${cerradas}`)
console.log(`  tiempo de apertura: ${aperturaMs} ms`)
console.log(`  duracion total:    ${totalMs} ms`)
console.log(abiertas >= 40 ? "  resultado: CUMPLE" : "  resultado: NO CUMPLE")

for (const ws of sockets) ws.terminate()
process.exit(0)
