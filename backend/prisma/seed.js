const { execSync } = require("child_process")
const path = require("path")

const seeds = [
  "seed-temario.js",
  "seed-comprobacion-solo-lectura.js",
  "seed-comprobacion-ficha.js",
  "seed-comprobacion-logo.js",
  "seed-actividad-directorios.js",
  "seed-actividad-permisos-archivo.js",
  "seed-actividad-mensaje.js",
  "seed-actividad-universidad.js",
  "seed-actividad-comodines.js",
  "seed-actividad-cerrar-proyecto.js",
]

function run(file) {
  console.log(`\n=== ${file} ===`)
  execSync(`node ${path.join(__dirname, file)}`, { stdio: "inherit", timeout: 30000 })
}

console.log("Sembrando base de datos...")
for (const s of seeds) run(s)
console.log("\n=== Seed completado ===")
