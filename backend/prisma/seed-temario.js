const prisma = require("./client")

const TOPICS = [
  {
    number: 1, slug: "introduccion-a-linux", title: "Introducción a Linux",
    description: "Historia, las partes del sistema, el Kernel, entorno de ventanas e instalación",
    subtopics: [
      { id: "historia", title: "Linux: Dónde todo empezó", file: "01-historia.md" },
      { id: "kernel", title: "Las partes del sistema", file: "02-kernel.md" },
      { id: "que-hace-kernel", title: "El Kernel", file: "03-que-hace-el-kernel.md" },
      { id: "entorno-ventanas", title: "Entorno de ventanas", file: "04-entorno-ventanas.md" },
      { id: "instalacion", title: "Instalación", file: "05-instalacion.md" },
    ],
  },
  {
    number: 2, slug: "la-terminal", title: "La Terminal",
    description: "La línea de comandos, el shell Bash y los comandos esenciales para moverte por el sistema",
    subtopics: [
      { id: "terminal", title: "La línea de comandos", file: "01-terminal.md" },
      { id: "anatomia-comando", title: "Anatomía de un comando", file: "02-anatomia-comando.md" },
      { id: "variables", title: "Variables en Bash", file: "03-variables.md" },
    ],
  },
  {
    number: 3, slug: "directorios", title: "Directorios",
    description: "El sistema de archivos de Linux, su estructura jerárquica, la navegación entre directorios y las operaciones que los crean, clonan y eliminan",
    subtopics: [
      { id: "filesystem", title: "El sistema de archivos", file: "01-filesystem.md" },
      { id: "navegacion", title: "Navegación esencial", file: "02-navegacion.md" },
      { id: "operaciones-directorios", title: "Operaciones con directorios", file: "03-operaciones-directorios.md" },
      { id: "practica-directorios", title: "Práctica: crea tu estructura", file: "04-practica-directorios.md" },
    ],
  },
  {
    number: 4, slug: "manejo-de-archivos", title: "Manejo de Archivos",
    description: "Crear archivos, copiarlos, moverlos y borrarlos, seleccionarlos con comodines, encadenar comandos con pipes y editarlos con vi",
    subtopics: [
      { id: "touch", title: "Crear archivos", file: "01-touch.md" },
      { id: "copiar-borrar", title: "Copiar, mover y borrar", file: "02-copiar-borrar.md" },
      { id: "comodines", title: "Comodines", file: "03-comodines.md" },
      { id: "pipes", title: "Encadenar comandos", file: "04-pipes.md" },
      { id: "editores", title: "Editores de texto", file: "05-editores.md" },
    ],
  },
  {
    number: 5, slug: "permisos", title: "Permisos",
    description: "Leer los permisos de un archivo, cambiarlos con chmod y entender qué significan sobre un directorio",
    subtopics: [
      { id: "dueno-y-permisos", title: "Dueño, grupo y permisos", file: "01-dueno-y-permisos.md" },
      { id: "octal", title: "Notación octal", file: "02-octal.md" },
      { id: "chmod", title: "Cambiar permisos con chmod", file: "03-chmod.md" },
      { id: "directorios", title: "Permisos sobre directorios", file: "04-directorios.md" },
      { id: "umask", title: "Permisos por defecto", file: "05-umask.md" },
    ],
  },
  {
    number: 6, slug: "compresion", title: "Compresión",
    description: "Reducir el tamaño de un archivo con gzip y bzip2, y empaquetar carpetas enteras con tar",
    subtopics: [
      { id: "comprimir", title: "Comprimir y descomprimir", file: "01-comprimir.md" },
      { id: "tar", title: "Empaquetar con tar", file: "02-tar.md" },
    ],
  },
  {
    number: 7, slug: "busqueda", title: "Búsqueda",
    description: "Las dos búsquedas del día a día: grep dentro de los archivos y find entre ellos, con expresiones regulares para afinar el patrón",
    subtopics: [
      { id: "grep", title: "Buscar dentro de los archivos", file: "01-grep.md" },
      { id: "expresiones-regulares", title: "Expresiones regulares", file: "02-expresiones-regulares.md" },
      { id: "find", title: "Buscar archivos con find", file: "03-find.md" },
      { id: "ordenar", title: "Ordenar los resultados", file: "04-ordenar.md" },
    ],
  },
  {
    number: 8, slug: "usuarios-y-grupos", title: "Usuarios y grupos",
    description: "Quién es uno para el sistema, dónde guarda esa información y cómo se administran las cuentas y los grupos",
    subtopics: [
      { id: "identidad", title: "Quién es uno para el sistema", file: "01-identidad.md" },
      { id: "passwd-y-group", title: "Dónde se guarda esa información", file: "02-passwd-y-group.md" },
      { id: "cuentas", title: "Administrar cuentas y grupos", file: "03-cuentas.md" },
      { id: "trabajo-en-grupo", title: "Compartir archivos con un grupo", file: "04-trabajo-en-grupo.md" },
    ],
  },
  {
    number: 9, slug: "gestion-de-procesos", title: "Gestión de procesos",
    description: "Ver qué procesos se están ejecutando, cómo ponerlos en primer o segundo plano, cómo terminarlos y qué son los daemons",
    subtopics: [
      { id: "ver-procesos", title: "Ver los procesos", file: "01-ver-procesos.md" },
      { id: "primer-y-segundo-plano", title: "Primer plano y segundo plano", file: "02-primer-y-segundo-plano.md" },
      { id: "senales-y-kill", title: "Señales y kill", file: "03-senales-y-kill.md" },
      { id: "daemons", title: "Daemons y servicios", file: "04-daemons.md" },
    ],
  },
  {
    number: 10, slug: "shell-scripting", title: "Shell scripting",
    description: "Variables, condicionales, ciclos y funciones en Bash.",
    subtopics: [],
  },
]

async function main() {
  for (const t of TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { order_number: t.number },
      update: { slug: t.slug, title: t.title, description: t.description },
      create: { order_number: t.number, slug: t.slug, title: t.title, description: t.description },
    })

    for (let i = 0; i < t.subtopics.length; i++) {
      const sub = t.subtopics[i]
      await prisma.subtopic.upsert({
        where: { topic_id_slug: { topic_id: topic.id, slug: sub.id } },
        update: { title: sub.title, file: sub.file, order_number: i + 1 },
        create: { topic_id: topic.id, slug: sub.id, title: sub.title, file: sub.file, order_number: i + 1 },
      })
    }

    console.log(`Topic ${t.number}: ${topic.title} (${t.subtopics.length} subtopics)`)
  }

  console.log(`\nTotal: ${TOPICS.length} topics sembrados`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
