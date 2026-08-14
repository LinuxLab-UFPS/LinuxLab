# LinuxLab UFPS

[![Deploy to Production](https://github.com/LinuxLab-UFPS/LinuxLab/actions/workflows/deploy.yml/badge.svg)](https://github.com/LinuxLab-UFPS/LinuxLab/actions/workflows/deploy.yml)

Laboratorio virtual de Linux para la asignatura de Sistemas Operativos de la
Universidad Francisco de Paula Santander. La plataforma reúne en un mismo lugar el
material teórico del temario, una terminal Linux accesible desde el navegador y
actividades prácticas con evaluación automática sobre un entorno real.

## Estructura del proyecto

```
LinuxLab/
├── backend/                    # API REST (Express + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── controllers/        # Handlers de rutas
│   │   ├── middleware/         # Auth y roles (admin, teacher, student)
│   │   ├── routes/             # auth, admin, groups, activities, group-activities
│   │   ├── services/           # Lógica de negocio y de entorno:
│   │   │                       #   · grupos y matrículas
│   │   │                       #   · actividades y aserciones (activityService, checkCatalog)
│   │   │                       #   · aprovisionamiento del entorno (worker, reconcile, linuxContainer)
│   │   ├── gateway.js          # WebSocket gateway (terminal Xterm.js)
│   │   └── index.js            # Punto de entrada
│   ├── prisma/                 # Schema, migraciones y seeds
│   └── Dockerfile
├── entorno/                    # Imagen del contenedor de estudiantes
│   ├── Dockerfile              # Ubuntu 22.04 + herramientas + checker/setup horneados
│   └── scripts/                # entrypoint.sh, checker.py, setup.py, linuxlab-shell.sh
├── frontend/                   # Interfaz (Next.js 16 + shadcn/ui)
│   ├── app/                    # App Router
│   ├── components/             # Componentes React (terminal, paneles, tablas)
│   └── content/temario/        # Lecciones en Markdown
├── scripts/docker/             # Infraestructura (claves SSH, etc.)
└── docker-compose.yml          # 6 servicios
```

## Arquitectura app-entorno

```
                Navegador (Xterm.js)
                      │  HTTP :3001              │  WS :3000/terminal
                      ▼                          │
   ┌──────────────────── RED EXTERNA ────────────┼───────────────┐
   │  ┌──────────────┐                           │              │
   │  │   frontend   │──── HTTP ────────────┐    │              │
   │  │  (Next.js)   │                      │    │              │
   │  └──────────────┘                      │    │              │
   └────────────────────────────────────────┼────┼──────────────┘
                                            │    │
   RED INTERNA (solo contenedores, sin      │    │
   salida al host; el backend está en       │    │
   ambas redes)                             ▼    │
   ┌─────────────────────────────────────────────┼──────────────┐
   │  ┌──────────────┐      ┌────────────────────┼────────────┐ │
   │  │   postgres   │◄─────│      backend       │◄───────────┘ │
   │  │ PostgreSQL16 │Prisma│ Express + WS +     │  (WS del     │
   │  └──────────────┘      │ worker aprovision. │  navegador)  │
   │                        └─────────┬──────────┘              │
   │                                  │  SSH interno (ssh2)     │
   │                                  │  clave RSA en volumen   │
   │  ┌───────────────────────────────▼───────────────────────┐ │
   │  │                        entorno                        │ │
   │  │  Ubuntu 22.04 · sshd · checker.py · setup.py          │ │
   │  │  /home (entorno_home) · /var/lib/linuxlab (etc)       │ │
   │  └───────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────────┘
```

- **El backend es el puente.** Es el único cliente de `postgres` (Prisma) y el
  único cliente del `entorno` (SSH interno). Por eso vive en las dos redes:
  recibe al navegador por la externa y opera sobre la base y el entorno por la
  interna.
- **El entorno no expone su SSH.** El puerto 22 no se publica al host: la única
  puerta es la conexión `ssh2` del backend por la red interna, autenticada con
  una clave RSA de 4096 bits que el sidecar `init` genera en el volumen
  `ssh_keys` en el primer arranque.
- **`entorno` y `postgres` no tienen salida al host.** Ningún servicio de la
  red interna publica puertos (excepto el backend, que publica `:3000`).

Servicios (`docker-compose.yml`): `frontend` (Next.js, red externa, :3001) ·
`backend` (Express + WS + worker, ambas redes, :3000) · `entorno` (estudiantes,
red interna) · `postgres` (red interna) · `migrate` (aplica migraciones de
Prisma al arrancar) · `init` (genera las claves SSH).

## El contenedor del entorno

La imagen (`entorno/Dockerfile`) parte de **Ubuntu 22.04** e incluye las
herramientas del curso (bash, vim, nano, tar, gzip, bzip2, zip, grep, find,
procps, sudo, quota) y un `systemctl` simulado para el tema de servicios.

- **`checker.py` y `setup.py` van horneados en la imagen** (`/usr/local/lib/linuxlab/`),
  con permisos `755 root:root`. No viajan por red y el estudiante no puede
  reemplazarlos ni interceptarlos. El checker **solo lee**; el setup **escribe**
  (el árbol de trabajo de las actividades del temario) — van separados a
  propósito, para que un fallo del evaluador no pueda estropear lo que mide.
- **`entrypoint.sh`** (autoritativo en cada arranque):
  - Restaura `/etc/passwd`, `/etc/group`, `/etc/shadow` y `/etc/gshadow` desde
    el volumen `entorno_etc` (`/var/lib/linuxlab`); en el primer arranque
    siembra los archivos base.
  - Configura la clave pública de `labadmin` y el aislamiento base:
    `/home` en `711`, `hidepid=2` en `/proc`.
  - **Reescribe `/etc/sudoers.d/labadmin`**: cualquier cambio hecho solo en el
    Dockerfile no tiene efecto — hay que tocar el entrypoint.
  - Habilita cgroups v2 (`/sys/fs/cgroup` como rw) con un cgroup por usuario
    para el techo de CPU, y quotas en `/home`. Ambos con fallback silencioso
    si el host no los soporta.

Volúmenes: `entorno_home` (`/home` — los archivos de los estudiantes y
docentes) e `entorno_etc` (`/var/lib/linuxlab` — el snapshot de las cuentas).
Ambos sobreviven a `stop`, `restart` y al reinicio del host.

## Jerarquía de roles y directorios

```
/home/                          → 711 root:root (no listable por otros)
├── labadmin/                   → 700 (cuenta operativa del backend)
└── <docente>/                  → 751 docente:docente
    ├── home/                   → 750 (home personal del docente)
    └── grupos/                 → 751
        └── <grp_dir>/          → 2751 docente:grp_xxx (setgid)
            └── <estudiante>/   → 2750 estudiante:grp_xxx (setgid)
```

| Rol            | Cómo se crea                                | Directorio                          | Permisos      |
| -------------- | ------------------------------------------- | ----------------------------------- | ------------- |
| **labadmin**   | Imagen + entrypoint (authorized_keys)       | `/home/labadmin/`                   | 700           |
| **docente**    | `provisionTeacherAccount` → `createTeacher` | `/home/<docente>/{home,grupos}`     | 751/750       |
| **grupo**      | `createGroup` (job con prioridad)           | `/home/<docente>/grupos/<grp_dir>/` | 2751 (setgid) |
| **estudiante** | `provisionStudentAccount` → `createStudent` | `.../grupos/<grp_dir>/<usuario>/`   | 2750 (setgid) |

- **Setgid (`2xxx`)**: los archivos creados dentro heredan el grupo del curso
  (`grp_xxx`), no el grupo primario de quien los crea.
- **Aislamiento entre estudiantes**: sus homes son `2750` — solo el dueño y el
  grupo del curso entran. Un estudiante no está en el grupo Unix de su curso,
  así que el acceso de "other" es `---`. `/home` en `711` impide listar homes
  ajenos, y `hidepid=2` oculta procesos de otros.
- **El docente supervisa**: al crear un grupo se agrega al grupo Unix del curso
  y su directorio pasa a ser suyo (`syncTeacherGroups`), de modo que puede
  leer (`r-x`) el trabajo de sus estudiantes sin poder modificarlo (`2750`
  no da `w` al grupo).

## Cuentas y aprovisionamiento

El flujo respeta la jerarquía: **el admin registra al docente** (job con
prioridad 10), **el docente crea el grupo** con sus estudiantes (jobs de grupo
prioridad 5 y de estudiante prioridad 1). La prioridad vive en el dato, no en
el orden del código: `claimJobs` ordena `ORDER BY priority DESC, created_at ASC`.

**El worker** (`provisioningWorker.js`) procesa en 4 fases por ciclo (poll cada
5 s, batch de 5, pool de 3, retries hasta `maxRetries=3`):

1. **Docentes** → `createTeacher`: usuario + `/home/<docente>/{home,grupos}`.
2. **Grupos** → `createGroup`: `groupadd` + directorio `2751`. No depende de que
   el docente exista (nace `root:grp`); al terminar, `syncTeacherGroups` hace al
   docente dueño de sus grupos y miembro del grupo Unix.
3. **Estudiantes** → `createStudent`: verifica el grupo Unix, crea home +
   usuario + `chown estudiante:grp` + `chmod 2750`, aplica cuota de disco
   (20 MB) y cgroup de CPU (10%). Es idempotente: si un intento previo dejó el
   home roto, lo repara. Si el chown falla, borra el home vacío en vez de dejar
   uno `root:root` colgado. Antes de marcar `provisioned`, `provisionStudentAccount`
   verifica que el home pertenezca al estudiante (por uid).
4. **Teardowns** → al archivar un curso.

**El reconcile** (`reconcileService.js`) es el mecanismo de recuperación: si el
entorno pierde estado (volumen borrado, contenedor recreado), reconstruye todo
desde la base de datos siguiendo el mismo orden jerárquico y verificando la
**calidad** de los homes (no solo que el usuario exista), no solo su presencia.
También repara la ownership de los directorios de grupo (`repairGroupOwnership`).

**Archivado**: el borrado del entorno está atado al archivado del curso. El
teardown elimina los usuarios Linux de los matriculados (los usernames salen de
la base, nunca de listar el directorio), el grupo Unix y la carpeta del curso.
El histórico de la base se conserva.

## Sesiones de terminal

- **Gateway** (`gateway.js`): WebSocket en `:3000/terminal`. El mensaje de
  `resize` que llega antes de abrir la PTY se guarda en `pending` y se aplica
  al crearla; la entrada que llega antes de que exista el stream se descarta.
- **Apertura de sesión** (`openPtySession`): `sudo sh -c '...; exec nice -n 10 su - <usuario>'`
  — el shell corre a prioridad baja (`nice 10`) y, si el cgroup del usuario
  existe, se mueve ahí (techo de CPU del 10%).
- **`MaxSessions 100`**: cada terminal abierta ocupa un canal sobre la única
  conexión SSH que mantiene el backend; 100 es el techo de terminales.
- **`TMOUT=900` readonly** (en `/etc/bash.bashrc`): la sesión inactiva se cierra
  a los 15 minutos, liberando su cupo.
- **`pkill -u`** al cerrar la terminal: elimina los procesos huérfanos del
  estudiante.

## El checker y las actividades

**La decisión central: el evaluador corre con la identidad del estudiante.**
`checker.py` se invoca con `sudo -u <estudiante>`, nunca como root: si corriera
como root, "el archivo existe y se puede leer" sería cierto siempre, y la
comprobación no mediría nada. Los parámetros viajan por **stdin como JSON** y
nunca se interpolan en la línea de comandos.

- **`resolve()`**: cada `ruta` se resuelve contra el home real del estudiante.
  El token `$usuario` lo sustituye el propio checker (lee su identidad de
  proceso — no se puede falsear); el home simbólico `/home/<usuario>` se
  traduce al real (que cuelga del curso); `realpath` colapsa los `..` y sigue
  los enlaces simbólicos; cualquier ruta que quede fuera del home se rechaza.
- **Catálogo de aserciones** (9 tipos): `directorio_existe`, `archivo_existe`,
  `archivo_no_existe`, `permisos_son`, `propietario_es`, `archivo_contiene`,
  `minimo_lineas`, `archivo_es`, `ultima_linea_es`. Viven en el checker del
  entorno y en `checkCatalog.js` (backend), que los sirve a la interfaz del
  docente vía `GET /api/activities/catalog` — una sola fuente de verdad.
- **Rutas relativas a la carpeta de trabajo.** Cada actividad de curso tiene un
  `workdir` autogenerado (del título + id); el docente escribe las rutas de sus
  aserciones **relativas** a esa carpeta (`informe.txt`) y el backend las
  resuelve a `actividades/<workdir>/<ruta>` al evaluar. Las comprobaciones del
  temario conservan rutas absolutas.
- **`setup.py`**: materializa el árbol de trabajo de las actividades del temario
  en `~/actividades/<slug>/` (el estudiante puede recargarlo sin perder lo
  suyo; el botón de recarga manda `force`).
- **Tokens**: `$codigo` y `$correo` los sustituye el backend desde la base (el
  contenedor no los conoce), lo que permite rutas personales por estudiante.
- **Evaluación de curso**: `POST /api/group-activities/:id/check` valida la
  matrícula activa en ese grupo, que la actividad esté habilitada y no vencida;
  registra cada intento numerado con su detalle por aserción y su puntaje, y
  deja rastro en la bitácora (`activity_audit_events`). La edición de una
  actividad publicada queda bloqueada tras el primer intento.

## Límites de recursos

| Límite                        | Valor                      | Frena                                          |
| ----------------------------- | -------------------------- | ---------------------------------------------- |
| `mem_limit` del entorno       | 512 MB                     | ~48 estudiantes simultáneos                    |
| `cpus` del entorno            | 0.5 núcleos                | un `while true` no degrada al backend/frontend |
| CPU por usuario (cgroup v2)   | 10% de 1 CPU               | un estudiante no acapara el laboratorio        |
| Cuota de disco por estudiante | 20 MB (`setquota`)         | llenar el disco del curso                      |
| `MaxSessions` del sshd        | 100                        | techo de terminales abiertas                   |
| `ulimit -u`                   | 16 procesos                | fork bombs y acaparamiento de CPU              |
| `ulimit -f`                   | 15 MB                      | archivos individuales enormes                  |
| `ulimit -v`                   | 256 MB                     | un proceso que se coma la RAM                  |
| `TMOUT`                       | 900 s, readonly            | sesiones abiertas para siempre                 |
| `pkill -u`                    | al cerrar la terminal      | procesos huérfanos                             |
| `restart: unless-stopped`     | backend, entorno, frontend | el laboratorio vuelve solo tras reinicio       |

La CPU se reparte en tres capas: el `cpus` del contenedor aísla el laboratorio
de los demás servicios; el cgroup por usuario da a cada estudiante un techo
propio; y el `nice 10` + `ulimit -u 16` funcionan como respaldo universal. Si
el host no soporta cgroups por usuario o cuotas de disco, el entorno sigue
operando con el `cpus` del contenedor y los ulimits (las cuotas simplemente no
se aplican).

## Tecnologías

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Xterm.js
- **Backend:** Express 5, Prisma ORM, PostgreSQL 16, ssh2, ws
- **Infra:** Docker Compose, contenedor Ubuntu 22.04, SSH interno con claves RSA
