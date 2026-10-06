# LinuxLab UFPS

[![Versión](https://img.shields.io/github/v/release/LinuxLab-UFPS/LinuxLab?label=versi%C3%B3n)](https://github.com/LinuxLab-UFPS/LinuxLab/releases/latest)
[![Deploy to Production](https://github.com/LinuxLab-UFPS/LinuxLab/actions/workflows/deploy.yml/badge.svg)](https://github.com/LinuxLab-UFPS/LinuxLab/actions/workflows/deploy.yml)

**Laboratorio Virtual de Linux como Mediador Pedagógico para Cursos de Sistemas Operativos**
Trabajo de grado del programa de Ingeniería de Sistemas, Universidad Francisco de
Paula Santander, 2026.

---

## ¿Qué es LinuxLab?

LinuxLab es un laboratorio virtual que integra una terminal Linux con los recursos
hipermediales y conceptuales del curso de Sistemas Operativos de la Universidad
Francisco de Paula Santander.

Antes de la plataforma, la práctica de la asignatura se realizaba sobre un servidor
personal del docente, con cuentas limitadas y disponibles solo en un horario
definido. Esa situación trasladaba al docente los costos y la administración del
servidor, exponía el servicio SSH a accesos externos y dejaba al estudiante sin
lecciones estructuradas, sin seguimiento de su avance y sin ejercicios que pudiera
comprobar por su cuenta.

LinuxLab reúne en una sola aplicación web, desplegada sobre la infraestructura de la
universidad, los tres elementos que faltaban.

- **Un temario** de diez temas y 40 lecciones, acompañado de simuladores
  interactivos y videos explicativos.
- **Una terminal Linux real** en el navegador, con una cuenta propia para cada
  estudiante, aislada de las demás y persistente entre sesiones.
- **Talleres con validación automática**, que comprueban sobre el propio entorno del
  estudiante si el trabajo pedido quedó hecho, además de entregas que el docente
  califica manualmente.

Este repositorio contiene el código completo de la plataforma, la imagen del entorno
Linux, la definición de los servicios de producción y los scripts con los que se
despliega.

---

## Autores

| Nombre                             | Rol      | Correo                                                            |
| ---------------------------------- | -------- | ----------------------------------------------------------------- |
| Mauricio Di Donato Sanchez         | Autor    | [mauriciods@ufps.edu.co](mailto:mauriciods@ufps.edu.co)           |
| Andersson Camilo Cardenas Guarin   | Autor    | [anderssoncamilocg@ufps.edu.co](mailto:anderssoncamilocg@ufps.edu.co) |
| Marco Antonio Adarme Jaimes        | Director | [madarme@ufps.edu.co](mailto:madarme@ufps.edu.co)                 |

---

## Funciones por rol

La plataforma distingue tres roles, y cada usuario ingresa con su cuenta de Google o
con correo y contraseña.

- **Estudiante.** Se vincula a un grupo mediante la matrícula del docente o el
  enlace de invitación que este comparte, consulta el temario, practica en la
  terminal, resuelve las actividades con su comprobación automática, envía las
  entregas manuales, revisa sus calificaciones y obtiene el certificado al finalizar
  el curso.
- **Docente.** Crea y administra sus grupos, matricula a los estudiantes, crea
  talleres con validación automática a partir de un catálogo de aserciones, sigue el
  avance de cada estudiante, califica las entregas manuales, exporta las
  calificaciones y consulta la bitácora de su grupo.
- **Administrador.** Registra a los docentes, consulta la bitácora general y
  supervisa el estado del entorno Linux, desde donde puede reencolar el
  aprovisionamiento fallido y reconstruir las cuentas.

---

## Estructura del proyecto

```
LinuxLab/
├── backend/              API REST, gateway de la terminal y worker de aprovisionamiento
├── frontend/             Interfaz web y material escrito del temario
├── entorno/              Imagen del entorno Linux de los estudiantes
├── deploy/               Servicios de producción, proxy y scripts de despliegue
├── scripts/docker/       Generación de las claves SSH del backend
├── docs/                 Documentación de análisis y diseño
├── .github/workflows/    Flujo de despliegue continuo
└── docker-compose.yml    Servicios para desarrollo local
```

Las tablas siguientes enlazan los archivos y directorios de cada componente y
describen lo que contiene cada uno.

### Raíz

| Recurso | Contenido |
| ------- | --------- |
| [docker-compose.yml](docker-compose.yml) | Define los seis servicios con los que se levanta el laboratorio en una máquina de desarrollo. |
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | Flujo de despliegue continuo que se ejecuta al integrar un cambio en `main`. |
| [scripts/docker/init-env.sh](scripts/docker/init-env.sh) | Genera el par de claves RSA con el que el backend accede al entorno, si aún no existe. |
| [.gitignore](.gitignore) | Excluye del control de versiones los archivos de configuración con credenciales, los videos y los artefactos de compilación. |

### Backend

El backend está escrito en Node.js con Express y organizado en capas. Las rutas
declaran los endpoints, los controladores reciben la petición y delegan en los
servicios, y los servicios concentran la lógica de negocio y el acceso a los datos.

| Recurso | Contenido |
| ------- | --------- |
| [backend/src/index.js](backend/src/index.js) | Punto de entrada. Arranca el servidor HTTP, monta el gateway de la terminal e inicia el worker de aprovisionamiento. |
| [backend/src/app.js](backend/src/app.js) | Configuración de Express, con sus middleware globales y el registro de las rutas bajo `/api`. |
| [backend/src/routes/](backend/src/routes) | Endpoints de la API y cadena de middleware que protege cada uno. |
| [backend/src/controllers/](backend/src/controllers) | Recepción de las peticiones y delegación en los servicios. |
| [backend/src/services/](backend/src/services) | Lógica de negocio y acceso a los datos, incluidos el aprovisionamiento del entorno, la evaluación de actividades y los certificados. |
| [backend/src/gateway/](backend/src/gateway) | Canal WebSocket de la terminal, su autenticación y el latido que cierra las conexiones muertas. |
| [backend/src/middleware/](backend/src/middleware) | Sesión, roles, matrícula activa y manejo centralizado de errores. |
| [backend/src/dtos/](backend/src/dtos) | Validación de la entrada con esquemas de Zod y serialización de las respuestas. |
| [backend/src/lib/](backend/src/lib) | Errores, registro, transacciones, constantes y generación de los certificados en PDF. |
| [backend/src/utils/](backend/src/utils) | Utilidades puntuales, como la construcción de nombres de usuario Linux. |
| [backend/src/config/](backend/src/config) | Lectura de las variables de entorno y configuración de Firebase. |
| [backend/src/templates/](backend/src/templates) | Plantillas de los correos que envía la plataforma. |
| [backend/prisma/schema.prisma](backend/prisma/schema.prisma) | Modelo de datos de la plataforma. |
| [backend/prisma/migrations/](backend/prisma/migrations) | Migraciones versionadas del esquema. |
| [backend/prisma/seed.js](backend/prisma/seed.js) | Índice de semillas. Ejecuta en orden las que cargan el temario, las comprobaciones de las lecciones y las actividades. |
| [backend/prisma/seed-temario.js](backend/prisma/seed-temario.js) | Carga los temas y las lecciones del temario en la base de datos. |
| [backend/prisma/client.js](backend/prisma/client.js) | Instancia única del cliente de Prisma y su pool de conexiones. |
| [backend/Dockerfile](backend/Dockerfile) | Imagen del backend, construida sobre `node:22-alpine`. |
| [backend/migrate.sh](backend/migrate.sh) | Aplica las migraciones pendientes. Lo ejecuta el servicio `migrate` al arrancar el conjunto. |
| [backend/entrypoint.sh](backend/entrypoint.sh) | Arranque del contenedor del backend. En desarrollo carga además las semillas. |

### Entorno Linux

| Recurso | Contenido |
| ------- | --------- |
| [entorno/Dockerfile](entorno/Dockerfile) | Imagen del entorno, basada en Ubuntu 22.04, con las herramientas del curso, el servicio SSH y los scripts del laboratorio. |
| [entorno/scripts/entrypoint.sh](entorno/scripts/entrypoint.sh) | Arranque del entorno. Restaura las cuentas, aplica el aislamiento y los límites, y levanta el servicio SSH. |
| [entorno/scripts/checker.py](entorno/scripts/checker.py) | Evaluador de las aserciones de las actividades. Se ejecuta con la identidad del estudiante y solo lee. |
| [entorno/scripts/setup.py](entorno/scripts/setup.py) | Prepara el directorio de trabajo de cada actividad del temario. |
| [entorno/scripts/submitter.py](entorno/scripts/submitter.py) | Empaqueta las entregas manuales del estudiante para que el docente las califique. |
| [entorno/scripts/linuxlab-shell.sh](entorno/scripts/linuxlab-shell.sh) | Configuración de la shell interactiva del estudiante, con el prompt de la plataforma y el aviso del directorio actual. |
| [entorno/scripts/tree-acotado.sh](entorno/scripts/tree-acotado.sh) | Sustituto de `tree` que no sale del directorio personal de quien lo ejecuta. |

### Frontend

La interfaz está construida con Next.js. Cada rol tiene un módulo funcional propio
con sus componentes, su acceso a la API y sus tipos.

| Recurso | Contenido |
| ------- | --------- |
| [frontend/app/](frontend/app) | Rutas y páginas de la plataforma. Las que exigen sesión están agrupadas en `(protected)`. |
| [frontend/middleware.ts](frontend/middleware.ts) | Verifica la sesión antes de servir las páginas protegidas. |
| [frontend/lib/models/](frontend/lib/models) | Tipos de datos compartidos con la API. |
| [frontend/lib/api/](frontend/lib/api) | Solicitudes al backend y gestión de las consultas. |
| [frontend/lib/features/auth/](frontend/lib/features/auth) | Inicio de sesión con Google, registro y verificación de correo. |
| [frontend/lib/features/enrollment/](frontend/lib/features/enrollment) | Vinculación del estudiante a un grupo. |
| [frontend/lib/features/student/](frontend/lib/features/student) | Temario, terminal, actividades y progreso del estudiante. |
| [frontend/lib/features/teacher/](frontend/lib/features/teacher) | Grupos, actividades, calificaciones, certificados y bitácora del docente. |
| [frontend/lib/features/admin/](frontend/lib/features/admin) | Registro de docentes y supervisión del entorno. |
| [frontend/lib/features/terminal/](frontend/lib/features/terminal) | Preferencias y reinicio de la terminal. |
| [frontend/shared/](frontend/shared) | Componentes, hooks y utilidades que comparten todos los roles, entre ellos el emulador de terminal y los simuladores. |
| [frontend/content/temario/](frontend/content/temario) | Lecciones del temario en Markdown, una carpeta por tema. |
| [frontend/content/actividades/](frontend/content/actividades) | Enunciados de las actividades del temario. |
| [frontend/content/bienvenida/](frontend/content/bienvenida) | Lección de bienvenida a la plataforma. |
| [frontend/public/](frontend/public) | Imágenes, iconos e ilustraciones estáticas. |
| [frontend/Dockerfile](frontend/Dockerfile) | Imagen del frontend, construida en dos etapas sobre `node:22-alpine`. |
| [frontend/.env.example](frontend/.env.example) | Plantilla de las variables del frontend. |

### Documentación

| Recurso | Contenido |
| ------- | --------- |
| [docs/anteproyecto.md](docs/anteproyecto.md) | Anteproyecto del trabajo de grado, con la revisión de literatura. |
| [docs/analisis-diseno.md](docs/analisis-diseno.md) | Análisis y diseño de la plataforma. |
| [docs/annexes/cu-especificacion.md](docs/annexes/cu-especificacion.md) | Especificación detallada de los casos de uso. |
| [docs/SRS-actividades-evaluadas.md](docs/SRS-actividades-evaluadas.md) | Requisitos de las actividades evaluadas sobre el entorno. |
| [docs/SRS-refactor.md](docs/SRS-refactor.md) | Requisitos de la reorganización de la arquitectura. |
| [docs/operacion.md](docs/operacion.md) | Guía de operación del servidor ante incidentes. |

---

## Prerrequisitos

- [Git](https://git-scm.com/).
- [Docker](https://docs.docker.com/get-docker/) con el complemento Compose v2.
- [Node.js](https://nodejs.org/) 22, la misma versión de las imágenes, solo si se
  quiere ejecutar el frontend fuera de los contenedores.
- Un proyecto de [Firebase](https://console.firebase.google.com/) con el inicio de
  sesión de Google y de correo con contraseña habilitados, una aplicación web
  registrada y una cuenta de servicio. De ellos salen las variables
  `NEXT_PUBLIC_FIREBASE_*` del frontend y `FIREBASE_*` del backend.
- Una cuenta SMTP para el envío de correos. Sin ella la plataforma arranca, pero no
  envía las invitaciones de docentes, los avisos de matrícula ni los certificados.

---

## Despliegue

### Variables de entorno

La configuración del backend va en `backend/.env` y la del frontend en
`frontend/.env.local`, creados a partir de sus plantillas.

```bash
cp deploy/backend.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Con el `docker-compose.yml` de la raíz, los valores de conexión son los siguientes.

```env
# backend/.env
DATABASE_URL=postgresql://linuxlab:linuxlab@postgres:5432/linuxlab
CORS_ORIGIN=http://localhost:3001

# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

#### Backend

| Variable | Propósito |
| -------- | --------- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL, sin comillas. |
| `PORT` | Puerto del backend dentro del contenedor, normalmente `3000`. |
| `NODE_ENV` | `production` en el servidor. Activa la cookie de sesión `secure`. |
| `FRONTEND_URL` | URL pública del frontend, usada en los enlaces de los correos y certificados. |
| `CORS_ORIGIN` | Orígenes permitidos, separados por comas. |
| `JWT_SECRET` | Secreto con el que se firma la sesión. |
| `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_CLIENT_ID`, `FIREBASE_CLIENT_CERT_URL` | Credenciales de la cuenta de servicio de Firebase. |
| `FIREBASE_STORAGE_BUCKET` | Almacenamiento de Firebase donde se guardan las entregas. |
| `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | Remitente de los correos de la plataforma. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Servidor de correo saliente. |
| `LOG_LEVEL` | Nivel de detalle del registro. Es opcional. |

#### Frontend

| Variable | Propósito |
| -------- | --------- |
| `NEXT_PUBLIC_FIREBASE_*` | Configuración del SDK web de Firebase. |
| `NEXT_PUBLIC_BACKEND_URL` | URL del backend vista desde el navegador. |
| `BACKEND_URL` | URL del backend vista desde el servidor de Next.js. Es opcional. |
| `NEXT_PUBLIC_FRONTEND_URL` | URL pública del frontend. |
| `JWT_SECRET` | El mismo secreto del backend, con el que el frontend verifica la sesión. |
| `NEXT_PUBLIC_VIDEO_BASE_URL` | Dirección de los videos del temario. Es opcional. |

### Build y ejecución

```bash
# Levantar los servicios
docker compose up -d --build

# Crear el primer administrador
docker compose cp deploy/bootstrap-admin.js backend:/app/bootstrap-admin.js
docker compose exec backend node bootstrap-admin.js correo@ufps.edu.co "Nombre"

# Ver logs
docker compose logs -f

# Detener sin borrar los datos
docker compose down

# Frontend con recarga en caliente
docker compose stop frontend
cd frontend && npm install && npm run dev
```

La aplicación queda disponible en `http://localhost:3001` y la API en
`http://localhost:3000`.

### Cómo funciona

- **[docker-compose.yml](docker-compose.yml).** Define los seis servicios del
  laboratorio. En el primer arranque `init` genera las claves SSH, `migrate` aplica
  las migraciones de la base de datos y el backend carga las semillas del temario.
- **[deploy/compose.podman.yml](deploy/compose.podman.yml).** Define los mismos
  servicios para el servidor de la universidad, que los ejecuta con Podman, y agrega
  un proxy Caddy ([deploy/Caddyfile](deploy/Caddyfile)) que publica un único puerto y
  reparte el tráfico entre el frontend y el backend.
- **Dockerfiles.** El backend y el frontend parten de `node:22-alpine`, y el frontend
  se construye en dos etapas para que la imagen final lleve solo la aplicación
  compilada. El entorno parte de `ubuntu:22.04`.

### CI/CD con GitHub Actions

El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) despliega la
aplicación en el servidor de la universidad.

**Cuándo se ejecuta**

- En cada push a la rama `main`.
- Manualmente desde la pestaña Actions del repositorio.

**Qué hace**

1. Genera `frontend/.env.local` y la configuración del backend con los secrets del
   repositorio.
2. Instala la clave SSH de despliegue.
3. Ejecuta [deploy/update.sh](deploy/update.sh), que construye las tres imágenes,
   las empaqueta y las transfiere al servidor.
4. En el servidor, [deploy/update-server.sh](deploy/update-server.sh) carga las
   imágenes, recrea los contenedores conservando los volúmenes, espera a que el
   backend responda y carga las semillas.

**Secrets requeridos en el entorno `deploy`**

- `HOST`, `SSH_PORT`, `PORT_0`, `PORT_1` y `DEPLOY_SSH_KEY`
- `DB_PASSWORD`, `DATABASE_URL` y `JWT_SECRET`
- `FRONTEND_URL`, `FIREBASE_*`, `EMAIL_FROM_*` y `SMTP_*`
- `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_FIREBASE_*` y `NEXT_PUBLIC_VIDEO_BASE_URL`

---

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
   RED DE BASE DE DATOS (sin salida)        ▼    │
   ┌─────────────────────────────────────────────┼──────────────┐
   │  ┌──────────────┐      ┌────────────────────┼────────────┐ │
   │  │   postgres   │◄─────│      backend       │◄───────────┘ │
   │  │ PostgreSQL16 │Prisma│ Express + WS +     │              │
   │  └──────────────┘      │ worker aprovision. │              │
   │                        └─────────┬──────────┘              │
   └──────────────────────────────────┼─────────────────────────┘
                                      │  SSH interno (ssh2)
                                      │  clave RSA en volumen
   RED DEL LABORATORIO (sin salida)   │
   ┌──────────────────────────────────▼─────────────────────────┐
   │                        entorno                              │
   │  Ubuntu 22.04 · sshd · checker.py · setup.py                │
   │  /home (entorno_home) · /var/lib/linuxlab (etc)             │
   └─────────────────────────────────────────────────────────────┘
```

- **El backend es el puente.** Es el único cliente de `postgres` (Prisma) y el
  único cliente del `entorno` (SSH interno). Por eso vive en las tres redes, recibe
  al navegador por la externa y opera sobre la base y el entorno por cada red
  interna de su lado.
- **`entorno` y `postgres` viven en redes internas separadas** (`lab` e
  `internal`). El firewall entre redes de Docker y Podman bloquea el tráfico entre
  ellas, de modo que desde una terminal de estudiante no hay ruta ni resolución de
  nombre hacia la base de datos. Al ser internas, ninguna de las dos tiene salida a
  internet.
- **El entorno no expone su SSH.** El puerto 22 no se publica en el anfitrión. La
  única puerta es la conexión `ssh2` del backend por la red `lab`, autenticada con
  una clave RSA de 4096 bits que el servicio `init` genera en el volumen `ssh_keys`
  en el primer arranque.

En desarrollo los servicios son `frontend` (red externa, puerto 3001), `backend`
(las tres redes, puerto 3000), `entorno` (red `lab`), `postgres` (red `internal`),
`migrate`, que aplica las migraciones al arrancar, e `init`, que genera las claves
SSH. En producción se suma el `proxy` y solo él publica un puerto.

---

## Tecnologías

- **Frontend.** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui y
  Xterm.js.
- **Backend.** Node.js 22, Express 5, Prisma ORM, PostgreSQL 16, ssh2, ws y Zod.
- **Autenticación y almacenamiento.** Firebase Authentication y Firebase Storage.
- **Infraestructura.** Docker Compose en desarrollo, Podman sin privilegios con Caddy
  en producción, contenedor Ubuntu 22.04 y SSH interno con claves RSA.
- **Videos.** Motion Canvas.

---

## Documentación relacionada

| Documento | Contenido |
| --------- | --------- |
| [deploy/README.md](deploy/README.md) | Guía de despliegue y operación en el servidor. |
| [docs/operacion.md](docs/operacion.md) | Respuesta ante incidentes en producción. |
| [LinuxLab-MotionCanvas](https://github.com/LinuxLab-UFPS/LinuxLab-MotionCanvas) | Código de los videos del temario. |
