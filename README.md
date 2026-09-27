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

El uso de la plataforma desde cada rol se detalla en el
[manual de usuario](https://drive.google.com/file/d/1eDAuSpGBwE0FoKXJBkzziqTmnF2dKAJN/view).

---

## Versión estable

La versión estable es **`v1.0.0`**, publicada en la página de
[Releases](https://github.com/LinuxLab-UFPS/LinuxLab/releases) del repositorio. Es la
versión que acompaña la entrega final del trabajo de grado.

La rama `main` corresponde a la versión en producción. Ningún cambio se integra en
ella directamente, sino a través de un Pull Request, y cada integración se despliega
en el servidor de la universidad mediante el flujo descrito en
[Despliegue continuo](#despliegue-continuo). Las versiones posteriores se identifican
con una nueva etiqueta sobre `main`.

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

### Despliegue

| Recurso | Contenido |
| ------- | --------- |
| [deploy/compose.podman.yml](deploy/compose.podman.yml) | Servicios de producción tal como se ejecutan en el servidor con Podman. |
| [deploy/Caddyfile](deploy/Caddyfile) | Configuración del proxy, que reparte el tráfico entre el frontend y el backend y emite las cabeceras de seguridad. |
| [deploy/build-local.sh](deploy/build-local.sh) | Construye y empaqueta las imágenes en la máquina de desarrollo. |
| [deploy/deploy-server.sh](deploy/deploy-server.sh) | Instalación inicial en el servidor. |
| [deploy/update.sh](deploy/update.sh) | Actualización completa, lanzada desde la máquina de desarrollo o desde el flujo de despliegue continuo. |
| [deploy/update-server.sh](deploy/update-server.sh) | Parte de la actualización que se ejecuta en el servidor. |
| [deploy/bootstrap-admin.js](deploy/bootstrap-admin.js) | Crea o promueve la cuenta del primer administrador. |
| [deploy/backend.env.example](deploy/backend.env.example) | Plantilla de la configuración del backend. |
| [deploy/frontend.build.env.example](deploy/frontend.build.env.example) | Plantilla de la variable pública que se fija al construir el frontend. |
| [deploy/README.md](deploy/README.md) | Guía detallada del despliegue en el servidor. |
| [scripts/docker/init-env.sh](scripts/docker/init-env.sh) | Genera el par de claves RSA con el que el backend accede al entorno, si aún no existe. |

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

### Para desarrollo

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

### Para producción

- Un servidor Linux con [Podman](https://podman.io/) 4.9 en modo sin privilegios y
  podman-compose 1.0.6, con al menos 1 GB de memoria disponible para el laboratorio.
- Una URL pública con HTTPS, entregada por el proxy institucional, que permita el
  upgrade a WebSocket. La cookie de sesión es `secure` y no viaja por HTTP.
- Acceso SSH al servidor con una clave privada.
- Una máquina de construcción con Docker o Podman y memoria suficiente para compilar
  el frontend, porque el servidor no construye las imágenes.

---

## Ejecución local

El laboratorio se levanta completo con Docker Compose. El backend necesita el entorno
Linux para abrir las terminales, por lo que no se recomienda ejecutarlo fuera de los
contenedores.

1. Clonar el repositorio.

   ```bash
   git clone https://github.com/LinuxLab-UFPS/LinuxLab.git
   cd LinuxLab
   ```

2. Crear la configuración del backend a partir de la plantilla y completarla con los
   valores de la [tabla de variables](#variables-del-backend). En desarrollo la base
   de datos es la del propio compose, de modo que `DATABASE_URL` queda como
   `postgresql://linuxlab:linuxlab@postgres:5432/linuxlab` y `CORS_ORIGIN` como
   `http://localhost:3001`.

   ```bash
   cp deploy/backend.env.example backend/.env
   ```

3. Crear la configuración del frontend. `NEXT_PUBLIC_BACKEND_URL` queda como
   `http://localhost:3000` y `JWT_SECRET` debe tener el mismo valor que en el backend.

   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

4. Construir y levantar los servicios. En el primer arranque el servicio `init`
   genera las claves SSH, `migrate` crea el esquema de la base de datos y el backend
   carga las semillas del temario y de las actividades.

   ```bash
   docker compose up -d --build
   ```

5. Crear el primer administrador. El inicio de sesión exige que el correo ya exista
   en la base de datos, por lo que la primera cuenta se crea con este script.

   ```bash
   docker compose cp deploy/bootstrap-admin.js backend:/app/bootstrap-admin.js
   docker compose exec backend node bootstrap-admin.js correo@ufps.edu.co "Nombre"
   ```

6. Abrir `http://localhost:3001` e ingresar con la cuenta de Google de ese correo.

Para trabajar sobre la interfaz con recarga en caliente, se detiene el servicio
`frontend` y se ejecuta el servidor de desarrollo de Next.js, que usa el mismo
puerto.

```bash
docker compose stop frontend
cd frontend && npm install && npm run dev
```

---

## Configuración

Ninguna credencial se guarda en el repositorio. La configuración del backend se lee
de `backend/.env` al arrancar el contenedor, mientras que las variables públicas del
frontend se incrustan en el código al compilarlo, de modo que un cambio en ellas
obliga a reconstruir la imagen.

### Variables del backend

Plantilla en [deploy/backend.env.example](deploy/backend.env.example).

| Variable | Propósito |
| -------- | --------- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. Va sin comillas, porque Podman no las procesa. |
| `PORT` | Puerto del backend dentro del contenedor, normalmente `3000`. |
| `NODE_ENV` | `production` en el servidor. Activa la cookie de sesión `secure`. |
| `FRONTEND_URL` | URL pública del frontend, usada en los enlaces de los correos y certificados. |
| `CORS_ORIGIN` | Orígenes permitidos, separados por comas. No interviene cuando frontend y backend comparten la URL. |
| `JWT_SECRET` | Secreto con el que se firma la sesión. Debe mantenerse estable entre despliegues. |
| `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_CLIENT_ID`, `FIREBASE_CLIENT_CERT_URL` | Credenciales de la cuenta de servicio de Firebase, con las que se verifica el inicio de sesión. |
| `FIREBASE_STORAGE_BUCKET` | Almacenamiento de Firebase donde se guardan las entregas. |
| `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | Remitente de los correos de la plataforma. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Servidor de correo saliente. |
| `LOG_LEVEL` | Nivel de detalle del registro. Es opcional. |
| `SSH_HOST`, `SSH_USER`, `SSH_KEY_PATH` | Acceso al entorno Linux. Los inyecta el compose y no se escriben en el archivo. |

### Variables del frontend

Plantilla en [frontend/.env.example](frontend/.env.example).

| Variable | Propósito |
| -------- | --------- |
| `NEXT_PUBLIC_FIREBASE_*` | Configuración del SDK web de Firebase para el inicio de sesión con Google. |
| `NEXT_PUBLIC_BACKEND_URL` | URL del backend vista desde el navegador. En producción es la misma URL pública del frontend. |
| `BACKEND_URL` | URL del backend vista desde el servidor de Next.js. Es opcional. |
| `NEXT_PUBLIC_FRONTEND_URL` | URL pública del frontend. |
| `JWT_SECRET` | El mismo secreto del backend, con el que el frontend verifica la sesión. |
| `NEXT_PUBLIC_VIDEO_BASE_URL` | Dirección del almacenamiento de los videos del temario. Vacía en local, donde los videos se sirven desde `public/`. |

---

## Despliegue en producción

Hay dos configuraciones de contenedores con propósitos distintos. El
[docker-compose.yml](docker-compose.yml) de la raíz levanta el laboratorio con Docker
en la máquina de un desarrollador, mientras que
[deploy/compose.podman.yml](deploy/compose.podman.yml) define los servicios tal como
se ejecutan en el servidor de la universidad, con Podman sin privilegios y un proxy
Caddy que ofrece una sola URL pública.

El despliegue se organiza alrededor de la memoria del servidor. Compilar el frontend
y el backend exige más memoria de la que se asigna al laboratorio, así que el
servidor no construye imágenes en ningún momento. Las tres imágenes se construyen en
la máquina de desarrollo, se empaquetan en un único archivo comprimido, se
transfieren por SSH y se cargan en el servidor ya construidas.

### Scripts de despliegue

| Script | Se ejecuta en | Función | Opciones |
| ------ | ------------- | ------- | -------- |
| [build-local.sh](deploy/build-local.sh) | Máquina de desarrollo | Fija la dirección pública del backend, construye las tres imágenes, las empaqueta en `imagenes.tar.gz` y, si se indica, lo transfiere al servidor. | `--url`, `--host`, `--key`, `--path` |
| [deploy-server.sh](deploy/deploy-server.sh) | Servidor | Instalación inicial. Crea las redes internas, carga las imágenes, levanta los servicios, espera a que el backend responda, carga las semillas y crea el administrador. | `--admin-email`, `--admin-name`, `--skip-seeds`, `--image-file`, `--skip-load`, `--dry-run` |
| [update.sh](deploy/update.sh) | Máquina de desarrollo o flujo de despliegue continuo | Actualización de extremo a extremo. Construye y transfiere las imágenes, sincroniza la copia del repositorio en el servidor con `main` e invoca allí la parte remota. | `--host`, `--ssh-port`, `--key`, `--url`, `--db-password`, `--backend-env`, `--skip-pull`, `--push`, `--dry-run` |
| [update-server.sh](deploy/update-server.sh) | Servidor | Parte remota de la actualización. Valida la configuración, carga las imágenes, recrea los contenedores sin tocar los volúmenes, espera la salud del backend y carga las semillas. | `--image-file`, `--skip-load`, `--skip-seeds`, `--dry-run` |

Todos los scripts muestran su ayuda con `--help`, admiten `--dry-run` para enumerar
los pasos sin ejecutarlos y son idempotentes, de modo que volver a ejecutarlos sobre
un despliegue ya aplicado no duplica recursos ni altera el estado.

La instalación inicial y la actualización se separan porque difieren en lo que
pueden dar por supuesto. La primera crea recursos que todavía no existen y pide los
datos del administrador. La segunda parte de un laboratorio en funcionamiento y no
toca la configuración ni los datos almacenados.

### Instalación inicial

```bash
# En la máquina de desarrollo. La URL se fija antes de compilar.
bash deploy/build-local.sh --url https://dominio-del-laboratorio --host usuario@servidor

# En el servidor, dentro de la copia del repositorio.
export DB_PASSWORD=<clave de la base de datos>
bash deploy/deploy-server.sh --admin-email admin@ufps.edu.co
```

Antes de la instalación hay que crear `backend/.env` en el servidor a partir de
[deploy/backend.env.example](deploy/backend.env.example) y `frontend/.env.local` en
la máquina de desarrollo. `deploy-server.sh` genera el `JWT_SECRET` si falta.

### Actualización

Una vez instalado el laboratorio, cada cambio se aplica con un solo comando desde la
máquina de desarrollo. El script toma el servidor, los puertos y la clave de la base
de datos de `deploy/.deploy.env`, un archivo local excluido del control de versiones,
y cualquier opción los sobrescribe.

```bash
bash deploy/update.sh
```

### Despliegue continuo

El flujo [deploy.yml](.github/workflows/deploy.yml) se activa con cada integración en
`main` y también puede lanzarse a mano. No realiza un trabajo propio, sino que genera
`frontend/.env.local` y la configuración del backend a partir de los secretos del
repositorio, instala la clave SSH de despliegue y ejecuta `deploy/update.sh`. De esta
manera el proceso automatizado y el manual son equivalentes.

El flujo necesita los siguientes secretos en el entorno `deploy` del repositorio.

- **Servidor.** `HOST`, `SSH_PORT`, `PORT_0`, `PORT_1` y `DEPLOY_SSH_KEY`.
- **Base de datos y sesión.** `DB_PASSWORD`, `DATABASE_URL` y `JWT_SECRET`.
- **Backend.** Las credenciales `FIREBASE_*`, las de correo `SMTP_*` y
  `EMAIL_FROM_*`, y `FRONTEND_URL`.
- **Frontend.** `NEXT_PUBLIC_BACKEND_URL`, las variables `NEXT_PUBLIC_FIREBASE_*` y
  `NEXT_PUBLIC_VIDEO_BASE_URL`.

El detalle de la configuración del servidor, el presupuesto de memoria, la
coordinación con el administrador de la infraestructura y la solución de problemas
está en [deploy/README.md](deploy/README.md). La respuesta ante incidentes se
documenta en [docs/operacion.md](docs/operacion.md) y el procedimiento completo en el
[manual técnico](https://drive.google.com/file/d/15XFWrPdOIWl6ANmI5ULdcSstTr40Nb8d/view).

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

## El contenedor del entorno

La imagen ([entorno/Dockerfile](entorno/Dockerfile)) parte de **Ubuntu 22.04** e
incluye las herramientas del curso (bash, vim, nano, tar, gzip, bzip2, zip, grep,
find, procps, sudo, quota) y un `systemctl` simulado para el tema de servicios. Se le
retiran `wget` y `curl` para que desde una terminal no se pueda descargar software.

- **`checker.py`, `setup.py` y `submitter.py` van dentro de la imagen**
  (`/usr/local/lib/linuxlab/`), con permisos `755 root:root`. No viajan por red y el
  estudiante no puede reemplazarlos ni interceptarlos. El checker **solo lee** y el
  setup **escribe** el árbol de trabajo de las actividades del temario. Se separaron
  a propósito, para que un fallo del evaluador no pueda estropear lo que mide.
- **[entrypoint.sh](entorno/scripts/entrypoint.sh)** se aplica en cada arranque.
  - Restaura `/etc/passwd`, `/etc/group`, `/etc/shadow` y `/etc/gshadow` desde el
    volumen `entorno_etc` (`/var/lib/linuxlab`). En el primer arranque siembra los
    archivos base.
  - Configura la clave pública de `labadmin` y el aislamiento base, con `/home` en
    `711` y `hidepid=2` en `/proc`.
  - **Reescribe `/etc/sudoers.d/labadmin`.** Un cambio hecho solo en el Dockerfile no
    tiene efecto, por lo que los permisos de `labadmin` se modifican en el
    entrypoint.
  - Habilita cgroups v2 con un cgroup por usuario para el techo de CPU (10 %) y el
    techo de RAM (32 MB suave y 64 MB duro, de modo que el proceso que devora
    memoria muere dentro de su propio cgroup sin provocar el OOM del contenedor), y
    cuotas en `/home`. Si el anfitrión no delega esos controladores, el entorno
    sigue funcionando sin ellos.
  - Borra de `/tmp` los archivos con más de un día de antigüedad.

Los volúmenes son `entorno_home`, montado en `/home` con los archivos de estudiantes
y docentes, y `entorno_etc`, montado en `/var/lib/linuxlab` con la copia de las
cuentas. Ambos sobreviven a `stop`, `restart` y al reinicio del anfitrión.

---

## Jerarquía de roles y directorios

```
/home/                          → 711 root:root (no listable por otros)
├── labadmin/                   → 700 (cuenta operativa del backend)
└── <docente>/                  → 751 docente:docente
    ├── home/                   → 750 (home personal del docente)
    └── grupos/                 → 751
        └── <grp_dir>/          → 2751 docente:grp_xxx (setgid)
            └── <estudiante>/   → 2700 estudiante:grp_xxx (setgid)
```

| Rol            | Cómo se crea                                | Directorio                          | Permisos      |
| -------------- | ------------------------------------------- | ----------------------------------- | ------------- |
| **labadmin**   | Imagen y entrypoint (`authorized_keys`)     | `/home/labadmin/`                   | 700           |
| **docente**    | `provisionTeacherAccount` → `createTeacher` | `/home/<docente>/{home,grupos}`     | 751/750       |
| **grupo**      | `createGroup` (job con prioridad)           | `/home/<docente>/grupos/<grp_dir>/` | 2751 (setgid) |
| **estudiante** | `provisionStudentAccount` → `createStudent` | `.../grupos/<grp_dir>/<usuario>/`   | 2700 (setgid) |

- **Setgid (`2xxx`).** Los archivos creados dentro heredan el grupo del curso
  (`grp_xxx`) y no el grupo primario de quien los crea.
- **Aislamiento entre estudiantes.** Sus homes son `2700`, así que ni el grupo ni
  `other` entran. El estudiante sí es miembro del grupo Unix de su curso, porque lo
  exige el `chgrp` de las actividades, y por eso el acceso de grupo va a `0`. Sin
  esa restricción cualquier compañero del curso podría atravesar un home ajeno y
  leer sus archivos. `/home` en `711` impide listar los homes ajenos y `hidepid=2`
  oculta los procesos de otros.
- **El docente supervisa por la plataforma**, con los resultados del checker y las
  entregas, y no por el sistema de archivos. El home `2700` del estudiante no le da
  acceso directo a su trabajo. Al crear un grupo, el docente queda como miembro del
  grupo Unix y dueño del directorio del curso (`syncTeacherGroups`), con lo que
  gestiona su estructura. La calificación nunca depende de leer el home del
  estudiante.

---

## Cuentas y aprovisionamiento

El flujo respeta la jerarquía. **El administrador registra al docente** (job con
prioridad 10) y **el docente crea el grupo** con sus estudiantes (jobs de grupo con
prioridad 5 y de estudiante con prioridad 1). La prioridad vive en el dato y no en el
orden del código, porque `claimJobs` ordena por `priority DESC, created_at ASC`.

**El worker** ([provisioningWorkerService.js](backend/src/services/provisioningWorkerService.js))
consulta la cola cada 5 segundos. En cada ciclo atiende los tipos de job en un orden
fijo, reserva de cada uno un lote de hasta 5 con `FOR UPDATE SKIP LOCKED` y los
ejecuta de a 3 en paralelo. Un job fallido se reintenta hasta 3 veces.

1. **Grupos** → `createGroup` crea el grupo Unix y el directorio `2751`. No depende
   de que el docente exista, porque nace como `root:grp`. Al terminar,
   `syncTeacherGroups` hace al docente dueño de sus grupos y miembro del grupo Unix.
2. **Cuentas**, de docentes y estudiantes, ordenadas por prioridad.
   - `createTeacher` crea el usuario y `/home/<docente>/{home,grupos}`.
   - `createStudent` verifica el grupo Unix, crea el home y el usuario, aplica
     `chown estudiante:grp` y `chmod 2700`, la cuota de disco (20 MB) y el cgroup de
     CPU (10 %). Es idempotente, de modo que si un intento previo dejó el home roto,
     lo repara. Si el `chown` falla, borra el home vacío en lugar de dejar uno
     `root:root`. Antes de marcar la cuenta como aprovisionada,
     `provisionStudentAccount` verifica por uid que el home pertenezca al
     estudiante.
3. **Desmontajes**, al archivar un curso.
4. **Correos de certificados**, al finalizar un curso.

**La reconciliación** ([reconcileService.js](backend/src/services/reconcileService.js))
es el mecanismo de recuperación. Si el entorno pierde estado, por un volumen borrado
o un contenedor recreado, el administrador la ejecuta y reconstruye todo desde la
base de datos en el mismo orden jerárquico. Verifica la calidad de los homes y no
solo que el usuario exista, y repara la propiedad de los directorios de grupo
(`repairGroupOwnership`). No recupera los archivos que los usuarios hubieran creado.

**El archivado** está atado al borrado del entorno. El desmontaje elimina los
usuarios Linux de los matriculados, cuyos nombres salen de la base y nunca de listar
el directorio, el grupo Unix y la carpeta del curso. El histórico de la base se
conserva.

---

## Sesiones de terminal

- **Gateway** ([gateway/index.js](backend/src/gateway/index.js)). WebSocket en
  `/terminal`. El mensaje de `resize` que llega antes de abrir la PTY se guarda y se
  aplica al crearla, y la entrada que llega antes de que exista el stream se
  descarta.
- **Apertura de sesión** (`openPtySession`). Ejecuta
  `sudo sh -c '...; exec nice -n 10 su - <usuario>'`, así que la shell corre con
  prioridad baja (`nice 10`) y, si el cgroup del usuario existe, se mueve a él.
- **`MaxSessions 100`.** Cada terminal abierta ocupa un canal sobre la única conexión
  SSH que mantiene el backend, y 100 es el techo de terminales.
- **`TMOUT=900` de solo lectura** (en `/etc/bash.bashrc`). La sesión inactiva se
  cierra a los 15 minutos y libera su cupo.
- **`pkill -u` al cerrar la terminal.** Elimina los procesos huérfanos del
  estudiante.

---

## El checker y las actividades

**La decisión central es que el evaluador corre con la identidad del estudiante.**
`checker.py` se invoca con `sudo -u <estudiante>` y nunca como root. Si corriera como
root, "el archivo existe y se puede leer" sería cierto siempre y la comprobación no
mediría nada. Los parámetros viajan por **la entrada estándar como JSON** y nunca se
interpolan en la línea de comandos.

- **`resolve()`.** Cada `ruta` se resuelve contra el home real del estudiante. El
  token `$usuario` lo sustituye el propio checker a partir de su identidad de
  proceso, que no se puede falsear. El home simbólico `/home/<usuario>` se traduce
  al real, que cuelga del curso, `realpath` colapsa los `..` y sigue los enlaces
  simbólicos, y cualquier ruta que quede fuera del home se rechaza.
- **Catálogo de aserciones.** Son nueve tipos: `directorio_existe`,
  `archivo_existe`, `archivo_no_existe`, `permisos_son`, `propietario_es`,
  `archivo_contiene`, `minimo_lineas`, `archivo_es` y `ultima_linea_es`. Viven en el
  checker del entorno y en
  [checkCatalogService.js](backend/src/services/checkCatalogService.js), que los
  entrega a la interfaz del docente por `GET /api/activities/catalog`. Así existe una
  sola fuente de verdad.
- **Rutas relativas a la carpeta de trabajo.** Cada actividad de curso tiene un
  `workdir` generado a partir del título y el id. El docente escribe las rutas de
  sus aserciones relativas a esa carpeta (`informe.txt`) y el backend las resuelve a
  `actividades/<workdir>/<ruta>` al evaluar. Las comprobaciones del temario
  conservan rutas absolutas.
- **`setup.py`.** Construye el árbol de trabajo de las actividades del temario en
  `~/actividades/<slug>/`. El estudiante puede recargarlo sin perder lo suyo, y el
  botón de recarga envía `force`.
- **Tokens.** `$codigo` y `$correo` los sustituye el backend desde la base, porque el
  contenedor no los conoce, lo que permite rutas personales por estudiante.
- **Evaluación de curso.** `POST /api/group-activities/:id/check` valida que la
  matrícula en el grupo esté activa y que la actividad esté habilitada y no vencida.
  Registra cada intento numerado con su detalle por aserción y su puntaje, y deja
  rastro en la bitácora (`activity_audit_events`). La edición de una actividad
  publicada queda bloqueada tras el primer intento.

---

## Límites de recursos

| Límite                            | Valor                        | Qué evita                                        |
| --------------------------------- | ---------------------------- | ------------------------------------------------ |
| `mem_limit` del entorno           | 512 MB (dev) / 448 MB (prod) | Admite entre 44 y 48 sesiones simultáneas, medidas a unos 6 MB cada una |
| `cpus` del entorno                | 0.5 núcleos                  | Que un `while true` degrade al backend o al frontend |
| CPU por usuario (cgroup v2)       | 10 % de 1 CPU                | Que un estudiante acapare el laboratorio         |
| RAM por usuario (cgroup v2)       | 32 MB suave / 64 MB duro     | Que el OOM de un proceso abusivo mate sesiones ajenas |
| Cuota por estudiante (`setquota`) | 20 MB en bloques / 3000 inodos | Llenar el disco del curso o agotar los inodos con `touch` |
| `/tmp` (tmpfs en dev)             | 96 MB                        | Acumular archivos grandes en la capa del anfitrión |
| `MaxSessions` del sshd            | 100                          | Abrir terminales sin techo                       |
| `ulimit -u`                       | 16 procesos                  | Fork bombs y acaparamiento de CPU                |
| `ulimit -f`                       | 15 MB                        | Archivos individuales enormes                    |
| `ulimit -n`                       | 256 descriptores             | Bucles de descriptores que compitan con sshd     |
| `ulimit -v`                       | 256 MB                       | Un proceso que consuma toda la RAM               |
| `pids_limit` del contenedor       | 512 procesos                 | Fork bombs que eludan el ulimit del bashrc       |
| Limpieza de `/tmp`                | Al arrancar (más de 1 día)   | Residuos de entregas acumulados en disco         |
| `TMOUT`                           | 900 s, solo lectura          | Sesiones abiertas indefinidamente                |
| `pkill -u`                        | Al cerrar la terminal        | Procesos huérfanos                               |
| `restart: unless-stopped`         | Servicios permanentes        | Que el laboratorio no vuelva tras un reinicio    |

La CPU se reparte en tres capas. El `cpus` del contenedor aísla el laboratorio de
los demás servicios, el cgroup por usuario da a cada estudiante un techo propio, y
`nice 10` junto con `ulimit -u 16` funcionan como respaldo universal. La RAM sigue la
misma idea en dos capas. El `mem_limit` del contenedor aísla el laboratorio, y el
cgroup por usuario, medido con 40 sesiones reales de unos 6 MB, contiene al proceso
abusivo dentro de su propio límite. Si el anfitrión no delega cgroups ni cuotas, como
ocurre en el servidor con Podman sin privilegios, el entorno sigue operando con los
techos del contenedor y los ulimits, y lo que se pierde es el reparto fino por
usuario. [deploy/README.md](deploy/README.md) detalla qué garantías se conservan en
ese modo.

---

## Contenido del curso

- **Lecciones.** Cada tema tiene una carpeta en
  [frontend/content/temario/](frontend/content/temario) (`tema-01` a `tema-10`) con
  sus lecciones en Markdown y un `meta.json` que fija su orden y sus títulos. La
  misma estructura se registra en la base de datos mediante
  [seed-temario.js](backend/prisma/seed-temario.js), de modo que una lección nueva se
  agrega en ambos lugares.
- **Actividades del temario.** Los enunciados están en
  [frontend/content/actividades/](frontend/content/actividades). Sus aserciones y su
  árbol de trabajo se cargan con las semillas `seed-actividad-*.js` y
  `seed-comprobacion-*.js` de [backend/prisma/](backend/prisma), que se ejecutan en
  el orden que fija [seed.js](backend/prisma/seed.js).
- **Videos.** No se guardan en el repositorio. Se alojan en un almacenamiento externo
  indicado por `NEXT_PUBLIC_VIDEO_BASE_URL`, con la misma estructura
  `tema-NN/archivo.mp4`. Se produjeron con Motion Canvas y su código está en el
  repositorio
  [LinuxLab-UFPS/LinuxLab-MotionCanvas](https://github.com/LinuxLab-UFPS/LinuxLab-MotionCanvas).
- **Actividades de curso.** Las crea cada docente desde la plataforma, por lo que
  viven solo en la base de datos.

Las semillas son idempotentes y se ejecutan en cada despliegue, de modo que una
lección o actividad nueva llega a producción con la siguiente integración en `main`.

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
| [Manual técnico](https://drive.google.com/file/d/15XFWrPdOIWl6ANmI5ULdcSstTr40Nb8d/view) | Requisitos de la infraestructura, inventario de contenedores, puertos y volúmenes, variables de configuración e instalación. |
| [Manual de usuario](https://drive.google.com/file/d/1eDAuSpGBwE0FoKXJBkzziqTmnF2dKAJN/view) | Uso de la plataforma desde cada rol. |
| [deploy/README.md](deploy/README.md) | Guía de despliegue y operación en el servidor. |
| [docs/operacion.md](docs/operacion.md) | Respuesta ante incidentes en producción. |
| [LinuxLab-MotionCanvas](https://github.com/LinuxLab-UFPS/LinuxLab-MotionCanvas) | Código de los videos del temario. |
