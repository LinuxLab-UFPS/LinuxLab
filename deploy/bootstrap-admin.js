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
let prisma, createLinuxAccountWithUniqueUsername, PRIORITIES
try {
  prisma = require("../backend/prisma/client")
  ;({ createLinuxAccountWithUniqueUsername } = require("../backend/src/utils/linuxUsername"))
  ;({ PRIORITIES } = require("../backend/src/lib/constants"))
} catch {
  prisma = require("./prisma/client")
  ;({ createLinuxAccountWithUniqueUsername } = require("./src/utils/linuxUsername"))
  ;({ PRIORITIES } = require("./src/lib/constants"))
}

const email = (process.argv[2] || "").toLowerCase().trim()
const name = process.argv[3]?.trim() || email.split("@")[0]
const role = process.argv.includes("--role") ? process.argv[process.argv.indexOf("--role") + 1] : "admin"

const VALID = new Set(["admin", "teacher", "student"])

/**
 * Deja al usuario con cuenta Unix y, si hace falta, con su job encolado.
 *
 * Es idempotente: reejecutar el script no duplica ni la cuenta ni el job, que
 * es lo que se espera de un bootstrap que se corre varias veces mientras se
 * afina un despliegue.
 */
async function asegurarCuentaLinux(user) {
  let account = await prisma.linuxAccount.findUnique({ where: { user_id: user.id } })

  if (!account) {
    // El helper del backend, no un sanitize a pelo: `linux_username` es unico y
    // dos correos distintos pueden reducirse al mismo nombre (jorge.perez@ y
    // jorge_perez@). El helper desambigua con sufijo en vez de fallar.
    const username = await createLinuxAccountWithUniqueUsername(prisma, user.id, user.email)
    account = await prisma.linuxAccount.findUnique({ where: { user_id: user.id } })
    console.log(`Cuenta Unix: ${username} (pendiente de crear)`)
  }

  if (account.linux_provisioned) {
    console.log(`Cuenta Unix: ${account.linux_username} ya existe en el entorno`)
    return
  }

  const pendiente = await prisma.userProvisioningJob.findFirst({
    where: { user_id: user.id, status: { in: ["pending", "processing"] } },
    select: { id: true },
  })
  if (pendiente) {
    console.log("Ya hay un job de aprovisionamiento en cola")
    return
  }

  await prisma.userProvisioningJob.create({
    data: {
      user_id: user.id,
      username: account.linux_username,
      priority: PRIORITIES.TEACHER,
    },
  })
  console.log("Job encolado: el worker la crea en el entorno en unos segundos")
}

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

  // La cuenta de la plataforma no basta para abrir la terminal: el gateway
  // exige ademas una cuenta Unix aprovisionada. El alta de docente del panel
  // (userService.register) crea la linuxAccount y encola su job; este script
  // hacia solo la fila de usuario, asi que quien entraba por aqui se quedaba
  // sin terminal y sin ninguna pista de por que.
  //
  // Los estudiantes no pasan por aqui: su cuenta cuelga del directorio de un
  // curso y se crea al matricularlos.
  if (role !== "student") {
    await asegurarCuentaLinux(user)
  }

  console.log("Ya puede iniciar sesion con Firebase en la URL publica.")
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
