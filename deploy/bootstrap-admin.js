/**
 * Bootstrap del administrador inicial de la plataforma.
 *
 * El login de Firebase exige que el correo ya exista en la base (RF-01):
 * este script crea (o promueve) al primer admin antes de cualquier login.
 *
 * Uso en el servidor (el contenedor del backend ya tiene el cliente y la
 * DATABASE_URL del entorno):
 *
 *   podman cp deploy/bootstrap-admin.js linuxlab-backend:/app/bootstrap-admin.js
 *   podman exec -it linuxlab-backend node bootstrap-admin.js admin@ufps.edu.co "Nombre Admin"
 *
 * Para un docente inicial, repetir con --role teacher:
 *
 *   podman exec -it linuxlab-backend node bootstrap-admin.js docente@ufps.edu.co "Nombre" --role teacher
 */
// Funciona ejecutado desde el repo (deploy/) o copiado al contenedor como
// /app/bootstrap-admin.js (donde prisma/ cuelga de la raiz del backend).
let prisma
try {
  prisma = require("../backend/prisma/client")
} catch {
  prisma = require("./prisma/client")
}

const email = (process.argv[2] || "").toLowerCase().trim()
const name = process.argv[3]?.trim() || email.split("@")[0]
const role = process.argv.includes("--role") ? process.argv[process.argv.indexOf("--role") + 1] : "admin"

const VALID = new Set(["admin", "teacher", "student"])

async function main() {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Uso: node bootstrap-admin.js <correo> [nombre] [--role admin|teacher|student]")
    process.exit(1)
  }
  if (!VALID.has(role)) {
    console.error(`Rol invalido: ${role}`)
    process.exit(1)
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { role, active: true, name },
    create: { email, name, role, active: true },
  })

  console.log(`Listo: ${user.email} (${user.name}) con rol ${user.role}`)
  console.log("Ya puede iniciar sesion con Firebase en la URL publica.")
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
