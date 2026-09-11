import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, "../../..")
const ENV_PATH = path.join(ROOT, ".env")

function readEnv(key) {
  if (process.env[key]) return process.env[key]
  const raw = fs.readFileSync(ENV_PATH, "utf8")
  const line = raw.split("\n").find((l) => l.startsWith(`${key}=`))
  if (!line) throw new Error(`Falta ${key} en ${ENV_PATH}`)
  return line.slice(key.length + 1).trim()
}

function postgresContainer() {
  const names = execFileSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8" })
    .split("\n")
    .filter((n) => n.includes("postgres"))
  if (!names[0]) throw new Error("No encuentro el contenedor de Postgres en ejecucion")
  return names[0]
}

function query(sql) {
  const out = execFileSync(
    "docker",
    ["exec", postgresContainer(), "psql", "-U", "linuxlab", "-d", "linuxlab", "-tAc", sql],
    { encoding: "utf8" },
  )
  return out.trim()
}

const DEMO = {
  admin: { email: "admin@ufps.edu.co", role: "admin" },
  teacher: { email: "ana.torres@ufps.edu.co", role: "teacher" },
  student: { email: "estudiante1@ufps.edu.co", role: "student" },
}

/**
 * Resuelve los IDs reales del seed demo (usuarios, grupo, actividad y
 * certificado) y firma un JWT por rol con el mismo secreto del stack local.
 * No hay login por UI: la cookie se inyecta directo en el navegador.
 */
export function buildAuth() {
  const secret = readEnv("JWT_SECRET")

  const users = {}
  for (const [key, { email, role }] of Object.entries(DEMO)) {
    const row = query(`SELECT id, name, COALESCE(s.code, t.code, '') FROM "User" u
      LEFT JOIN "Student" s ON s.user_id = u.id
      LEFT JOIN "Teacher" t ON t.user_id = u.id
      WHERE u.email = '${email}' LIMIT 1`)
    if (!row) throw new Error(`No existe el usuario demo ${email}; corre el seed-demo`)
    const [id, name, code] = row.split("|")
    users[key] = { id, name, code, email, role: role }
  }

  const groupId = query(`SELECT id FROM "Group" WHERE name = 'Sistemas Operativos - Grupo A' LIMIT 1`)
  const activityId = query(`SELECT id FROM "GroupActivity" WHERE group_id = '${groupId}' ORDER BY activity_number ASC LIMIT 1`)
  const certCode = query(`SELECT code FROM "Certificate" WHERE code = 'CERT-DEMO-001' LIMIT 1`)

  return { secret, users, groupId, activityId, certCode }
}

/**
 * storageState (cookies) para inyectar en un BrowserContext de Playwright.
 * hasEnrollment=true en el token del estudiante: el middleware lo exige para
 * las rutas con requiresEnrollment.
 */
export function storageStateFor(auth, roleKey, baseUrl) {
  const user = auth.users[roleKey]
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    code: user.code || null,
    hasEnrollment: user.role === "student",
  }
  const token = signJwt(payload, auth.secret)
  const { hostname } = new URL(baseUrl)
  return {
    cookies: [
      {
        name: "token",
        value: token,
        domain: hostname,
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        expires: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
      },
    ],
    origins: [],
  }
}

/** HS256 manual para no depender de jsonwebtoken en el frontend. */
function signJwt(payload, secret) {
  const enc = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url")
  const header = { alg: "HS256", typ: "JWT" }
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 }
  const data = `${enc(header)}.${enc(body)}`
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url")
  return `${data}.${sig}`
}
