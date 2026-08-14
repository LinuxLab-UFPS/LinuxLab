# SRS — Refactor arquitectónico de LinuxLab

**Proyecto:** LinuxLab UFPS
**Versión:** 1.0 · 2026-08-14
**Estado:** especificación aprobada, pendiente de ejecución (fases B0–B7 backend, F1–F6 frontend)

---

## 1. Propósito

Este documento especifica los requisitos funcionales y no funcionales del
refactor arquitectónico de LinuxLab. El refactor **no agrega funcionalidad de
negocio**: reorganiza el backend por capas y dominios, corrige fallas de
seguridad detectadas, establece una capa DTO explícita en cada lado del
contrato, elimina deuda técnica y prepara el frontend con una capa de datos
moderna.

El documento es el contrato de aceptación de las fases de ejecución: cada
subfase se da por completa cuando cumple los requisitos que le corresponden
(sección 7).

## 2. Alcance

### 2.1 Incluido

- **Backend** (Node.js + Express 5 + Prisma 7): fases B0–B7 — seguridad crítica,
  capa `dtos/` con validación zod, separación por capas (`routes` → `controllers`
  → `services` → `dtos`), deduplicación de lógica, transacciones y concurrencia,
  endurecimiento del WebSocket, ciclo de vida y hardening operativo.
- **Frontend** (Next.js 16 + React 19 + Tailwind v4): fases F1–F6 — capa
  `lib/models/` propia por dominio, TanStack Query, eliminación de código
  muerto, composición de componentes y limpieza de UI.

### 2.2 Excluido

- Nuevos endpoints de negocio: `audit-log`, `groups/:id/progress`,
  `groups/:id/students/:studentId`, `submissions/*` **no se crean**; los stubs
  de `lib/features/teacher/data.ts` permanecen intactos.
- Tests automatizados (decisión del dueño del proyecto).
- Rediseño visual o estético de pantallas.
- Migraciones de esquema de base de datos (las fases no introdujeron ninguna;
  la eliminación del modelo muerto `ProvisioningJob` se ejecutó con aprobación
  explícita: migración `20260814205122_drop_unused_provisioning_job`, tabla
  vacía, sin pérdida de datos).
- Cambios en `docker-compose.yml` y `deploy/`.
- Contratos compartidos entre frontend y backend: **no existe paquete `shared/`**.
  Cada capa define y mantiene sus propios DTOs (ver §4.3).

### 2.3 Decisiones de arquitectura acordadas

| # | Decisión |
|---|---|
| D-1 | Backend organizado **por capas** (`routes/`, `controllers/`, `services/`, `dtos/`, `utils/`, `lib/`, `config/`, `middleware/`, `gateway/`); dentro de cada capa los archivos llevan sufijo de dominio (`authController.js`, `authService.js`, `authDtos.js`). |
| D-2 | Capa DTO del backend en `src/dtos/`, un archivo por dominio, con schemas zod (validación de entrada) y serializadores (forma de salida). |
| D-3 | Capa DTO del frontend en `lib/models/<dominio>.ts`, propia y sin imports del backend. Los contratos se sincronizan manualmente: si cambia el contrato en el backend, se actualiza `dtos/<dominio>Dtos.js` y `lib/models/<dominio>.ts` en el mismo cambio. |
| D-4 | El reset de terminal (`POST /api/terminal/reset`) es una operación del entorno: vive en `containerService.js`, no en un servicio de preferencias. |
| D-5 | `app.js` ensambla Express; `index.js` queda solo bootstrap (config → app → gateway → worker → señales). |
| D-6 | Backend permanece en CommonJS/JavaScript (sin migración a TypeScript). |
| D-7 | Sin tests automatizados: cada fase se valida con smoke checks manuales y, en frontend, con `lint` + `typecheck` + `build`. |
| D-8 | Nombres de identificadores en inglés; mensajes de error y UI en español. |
| D-9 | Frontend organizado con `shared/` a nivel raíz (components, pages, hooks, lib) para lo reutilizable entre roles; `lib/models/` aparte como capa contrato; `lib/features/<rol>/` autocontenidos con sus componentes. |

## 3. Definiciones

| Término | Significado |
|---|---|
| **DTO** | Forma de los datos al cruzar la frontera (request/response). Cada capa define los suyos. |
| **Zod schema** | Esquema de validación de entrada usado por los servicios del backend. |
| **IDOR** | Insecure Direct Object Reference: acceso a recursos ajenos sin control de autorización. |
| **TOCTOU** | Time-of-check to time-of-use: condición de carrera entre verificación y uso. |
| **PTY** | Pseudo-terminal: sesión shell del estudiante. |
| **WS** | WebSocket, gateway `/terminal`. |
| **Envelope de error** | Forma JSON uniforme `{ error, code }` para todas las respuestas de error. |
| **Stub** | Función del frontend que devuelve datos de ejemplo (sin backend real). |
| **Job** | Trabajo de aprovisionamiento (usuario/grupo/teardown) procesado por el worker. |
| **Shared (frontend)** | Carpeta `frontend/shared/` con lo reutilizable entre roles: components (UI), pages (páginas/bloques estandarizados), hooks y lib (contenido neutral). No contiene DTOs. |

## 4. Arquitectura objetivo

### 4.1 Backend

```
backend/src/
├── index.js                          # bootstrap: env validado, app, gateway, worker, señales
├── app.js                            # ensambla express (middleware + routers)
├── config/
│   ├── env.js                        # NUEVO: lectura + validación central al boot
│   └── firebase-admin.js
├── lib/                              # transversal, sin lógica de negocio
│   ├── errors.js                     # AppError, ValidationError, AuthorizationError...
│   ├── logger.js                     # pino
│   ├── transaction.js                # runInTransaction
│   └── constants.js                  # NUEVO: EMAIL_REGEX, PRIORITIES (10/5/1)
├── utils/
│   ├── asyncHandler.js
│   ├── sanitizeUsername.js
│   ├── linuxUsername.js
│   └── groupName.js                  # NUEVO: derivación `grp_*` (única implementación)
├── middleware/
│   ├── errorHandler.js               # + log de 4xx, request ID, envelope {error, code}
│   ├── requireRoles.js
│   └── authMiddleware.js             # usa authService.verifyToken
├── gateway/
│   ├── index.js                      # heartbeat, límites, logging, boundaries
│   ├── wsAuthMiddleware.js           # verificación única desde authService
│   └── heartbeat.js                  # NUEVO: ping/pong + cierre de sesiones muertas
├── dtos/
│   ├── authDtos.js                   # idTokenSchema · serializeSession · sessionDto
│   ├── userDtos.js                   # registerTeacherSchema · serializeTeacher
│   ├── groupDtos.js                  # createGroupSchema · registerStudentSchema · serializers
│   ├── activityDtos.js               # activityInputSchema · checkSchema · activityDto
│   ├── provisioningDtos.js           # job serializers (admin + docente, un solo shape)
│   └── preferenceDtos.js             # preferencesSchema
├── services/
│   ├── authService.js                # Firebase → JWT → cookie, /me, logout, verifyToken
│   ├── userService.js                # docentes CRUD + primitivas de usuario compartidas
│   ├── groupService.js               # CRUD de cursos, archive, delete
│   ├── enrollmentService.js          # flujo único: single + bulk + CSV + list
│   ├── accessService.js              # getGroupAccess/ensureGroupAccess fusionados
│   ├── lessonEvaluatorService.js     # evaluación de lecciones del temario
│   ├── groupActivityService.js       # CRUD docente de actividades (transaccional)
│   ├── studentActivityService.js     # vistas del estudiante + checks
│   ├── checkCatalogService.js        # catálogo de aserciones
│   ├── attemptService.js             # NUEVO: asignación atómica de attempt_number
│   ├── auditService.js               # bitácora de eventos
│   ├── provisioningWorkerService.js  # poller de jobs
│   ├── jobService.js                 # NUEVO: claim/retries/serialización de jobs
│   ├── sshService.js                 # cliente SSH (llave con try/catch)
│   ├── containerService.js           # operaciones del contenedor + resetTerminal
│   ├── linuxAccountService.js        # NUEVO: cuentaDelEstudiante + readiness
│   ├── reconcileService.js           # reconstrucción del entorno desde la BD
│   ├── environmentService.js         # snapshot/requeue/ensureOwnAccount
│   └── preferenceService.js          # upsert de preferencias
├── controllers/
│   ├── authController.js
│   ├── groupController.js            # sin queries Prisma directas
│   ├── activityController.js
│   ├── adminController.js            # compone userService + provisioning
│   └── preferenceController.js       # preferencias + reset de terminal
└── routes/
    ├── authRoutes.js                 # /api/auth
    ├── adminRoutes.js                # /api/admin
    ├── groupRoutes.js                # /api/groups
    ├── activityRoutes.js             # /api/activities
    ├── groupActivityRoutes.js        # /api/group-activities
    ├── preferenceRoutes.js           # /api/preferences
    └── terminalRoutes.js             # /api/terminal
```

### 4.2 Frontend

```
frontend/
├── app/                              # rutas SOLO montan páginas; lógica mínima
│   ├── not-found.tsx                 # → shared/pages/not-found.tsx
│   ├── unauthorized/page.tsx         # → shared/pages/unauthorized.tsx
│   ├── page.tsx                      # landing
│   └── (protected)/
│       ├── layout.tsx                # → shared/pages/shell.tsx (rol parametrizado)
│       ├── terminal/page.tsx         # → shared/pages/terminal.tsx
│       └── home/ groups/ activities/ mi-grupo/ contents/ admin/ ...   # propias de rol
│
├── shared/                           # ★ todo lo reutilizable entre roles
│   ├── components/                   # UI genérica (from components/shared/ + components/ui/)
│   │   ├── ui/                       # shadcn (from components/ui)
│   │   ├── data-table.tsx · terminal-emulator.tsx · stat-tabs.tsx
│   │   ├── role-guard.tsx · action-button.tsx · ...
│   ├── pages/                        # ★ páginas estandarizadas y reutilizables
│   │   ├── not-found.tsx · unauthorized.tsx    # estandarizadas (tokens, español)
│   │   ├── terminal.tsx              # la terminal (usada en varias vistas)
│   │   ├── shell.tsx                 # layout único parametrizado por rol
│   │   └── ...
│   ├── hooks/                        # use-terminal-preferences.ts · ...
│   └── lib/                          # contenido y utilidades neutrales de dominio
│       ├── content/                  # lessons · temario · simulators · snippets · prose
│       ├── rules.ts                  # tabla central de rutas
│       └── csv.ts · utils.ts
│
├── lib/                              # ★ lógica específica (por rol)
│   ├── api/
│   │   ├── client.ts                 # apiFetch (tipado contra lib/models, sin `as T`)
│   │   └── queries.ts                # NUEVO: wrappers TanStack Query por dominio
│   ├── config/
│   │   └── env.ts                    # única fuente de configuración
│   ├── models/                       # ★ capa DTO propia del frontend, por dominio
│   │   ├── auth.ts                   # SessionUser, Role
│   │   ├── users.ts                  # TeacherDto
│   │   ├── groups.ts                 # Group, Enrollment, EnrollmentStudent, GroupProgressSummary
│   │   ├── activities.ts             # UNA Activity, Difficulty, CheckResult, CatalogEntry
│   │   ├── provisioning.ts           # ProvisioningJobSummary
│   │   ├── preferences.ts            # UserPreferences
│   │   └── index.ts                  # re-exports
│   └── features/                     # autocontenidos por rol
│       ├── auth/                     # context · firebase · session
│       ├── student/                  # components/ · hooks/ · api/ · commands · progress
│       ├── teacher/                  # api · data (stubs INTACTOS) · components/
│       └── admin/                    # api · data · hooks · components/
│
└── middleware.ts                     # usa lib/config/env.ts + shared/lib/rules.ts
```

Reglas del frontend:

- `components/` raíz desaparece: lo genérico → `shared/components/`, lo por rol →
  `lib/features/<rol>/components/`.
- `lib/features/shared/` desaparece: contenido → `shared/lib/content/`, reglas →
  `shared/lib/rules.ts`, tipos → `lib/models/`, muertos (`stub.ts`,
  `topic-icons.ts`) se eliminan.
- `lib/models/` es la capa contrato (no parte de shared); `shared/` es solo
  código neutral reutilizable.
- `app/` monta páginas; `shared/pages/` contiene las páginas estandarizadas
  (404, no autorizado, terminal) y bloques de página reutilizables (shell,
  headers).

### 4.3 El contrato entre capas

- **No existe código compartido** entre frontend y backend.
- El backend define sus DTOs en `src/dtos/` (zod para validar entradas,
  serializadores para las salidas).
- El frontend define los suyos en `lib/models/` (tipos de request y response).
- Cuando un contrato cambia en el backend, se actualizan ambas capas en el
  mismo cambio. Es un proceso normal de la app, no un acoplamiento.

## 5. Requisitos funcionales

### 5.1 Dominio auth — RF-AUTH

| ID | Requisito | Verificación |
|---|---|---|
| RF-AUTH-1 | `POST /api/auth/firebase` valida `idToken` con schema zod (string requerido) antes de verificar en Firebase. | 400 ante payload inválido |
| RF-AUTH-2 | La verificación Firebase, el upsert de usuario, la firma JWT y la cookie se mueven a `authService`; la ruta queda fina (< 30 líneas). | Código |
| RF-AUTH-3 | `GET /api/auth/me` y `POST /api/auth/logout` preservan el contrato exacto actual. | Smoke test |
| RF-AUTH-4 | Los errores de Firebase no exponen `error.message` al cliente (hoy sí, `routes/auth.js:121`). | Respuesta sin detalles internos |
| RF-AUTH-5 | `authMiddleware` delega en `next(new AuthorizationError())`; todas las respuestas de error usan envelope `{error, code}`. | Smoke test 401 |
| RF-AUTH-6 | Verificación JWT única en `authService.verifyToken`, usada por HTTP y WS (hoy 3 implementaciones). | Un solo módulo |

### 5.2 Dominio users — RF-USER

| ID | Requisito | Verificación |
|---|---|---|
| RF-USER-1 | CRUD de docentes (listar, registrar, toggle) preserva contrato y queda en `userService`. | Smoke test `/api/admin/docentes` |
| RF-USER-2 | Registro de docente valida name/email con zod (reemplaza validación manual). | 400/409 correctos |
| RF-USER-3 | Primitivas compartidas de usuario (upsert por email, creación de LinuxAccount, sanitize) extraídas para uso de users y groups. | Sin duplicación (grep) |
| RF-USER-4 | Serialización de docentes consistente (`linuxUsername`/`linuxProvisioned` camelCase). | Smoke test |

### 5.3 Dominio groups — RF-GRP

| ID | Requisito | Verificación |
|---|---|---|
| RF-GRP-1 | **Fix IDOR**: `GET /api/groups/:id/provisioning-jobs` exige `ensureGroupAccess`; la query pasa del controller a un servicio. | Docente A recibe 403 contra un grupo de B |
| RF-GRP-2 | `registerStudent` valida `code` (≤ 20 chars) y `email` con zod; errores 400 en vez de 500. | Smoke test con código largo |
| RF-GRP-3 | Control de acceso único: `getGroupAccess`/`ensureGroupAccess` fusionados en `accessService`. | Un solo export; todos los llamadores actualizados |
| RF-GRP-4 | Matriculación unificada: flujos bulk (`enrollStudentsInGroup`) y single (`registerStudent`) sobre una implementación común. | Smoke test ambos caminos |
| RF-GRP-5 | CRUD/archive/delete/reconcile de grupos preservan contrato. | Smoke test |
| RF-GRP-6 | `createGroup` valida payload con zod (name, students shape). | 400 ante payload inválido |
| RF-GRP-7 | Importación CSV preserva el formato de respuesta (total/registered/skipped/errors). | Smoke test CSV |

### 5.4 Dominio activities — RF-ACT

| ID | Requisito | Verificación |
|---|---|---|
| RF-ACT-1 | `activityService.js` (852 líneas) se divide en `lessonEvaluatorService`, `groupActivityService`, `studentActivityService`, `checkCatalogService`, `attemptService`, `auditService`. | Ningún archivo > ~300 líneas; exports migrados sin pérdida |
| RF-ACT-2 | Todos los endpoints (`/api/activities/*`, `/api/group-activities/*`) preservan contrato. | Smoke test completo |
| RF-ACT-3 | `cuentaDelEstudiante` (readiness de cuenta Linux) pasa a `linuxAccountService` y se reutiliza en `checkForStudent` (hoy copiado). | Sin duplicación |
| RF-ACT-4 | `hasEnrollmentInGroup` pasa a `accessService`/`enrollmentService` y se reutiliza. | Sin duplicación |
| RF-ACT-5 | `createGroupActivity`/`updateGroupActivity` atómicos vía `runInTransaction` (hoy writes sin transacción). | Código dentro de tx; smoke CRUD |
| RF-ACT-6 | **Fix race `attempt_number`**: asignación de intentos sin TOCTOU (contador atómico o tx con bloqueo). | Dos checks concurrentes → intentos distintos |
| RF-ACT-7 | Validación de inputs de actividad (`buildChecks`) migra a zod sin perder reglas ni mensajes. | Mismos códigos de error |
| RF-ACT-8 | Logging de auditoría extraído a `auditService`. | Sin regresión en respuestas |

### 5.5 Dominio provisioning — RF-PROV

| ID | Requisito | Verificación |
|---|---|---|
| RF-PROV-1 | Worker, SSH, container, reconcile y environment en `services/*` del dominio. | Estructura; smoke del worker |
| RF-PROV-2 | `$queryRawUnsafe` → `Prisma.sql` parametrizado (misma semántica de claim con SKIP LOCKED). | Revisión + smoke de jobs |
| RF-PROV-3 | Prioridades 10/5/1 y derivación `grp_*` centralizadas en `lib/constants.js` y `utils/groupName.js`. | Sin magic numbers duplicados (grep) |
| RF-PROV-4 | Serialización de jobs única (compartida admin/docente). | Un solo serializer |
| RF-PROV-5 | `sshService` no crashea al boot si falta la llave: error descriptivo. | Boot sin llave |
| RF-PROV-6 | `stopWorker()` se invoca en shutdown (hoy existe y nunca se llama). | SIGTERM detiene el poller |

### 5.6 Dominio preferences — RF-PREF

| ID | Requisito | Verificación |
|---|---|---|
| RF-PREF-1 | `PUT /api/preferences` valida con zod: `terminalFontSize` numérico acotado, `theme` y `terminalFontFamily` en sets conocidos. | 400 ante valores inválidos (hoy acepta negativo/NaN) |
| RF-PREF-2 | Lógica en `preferenceService` + controller. | Ruta fina |
| RF-PREF-3 | `POST /api/terminal/reset` delega en `containerService.resetTerminal` (hoy prisma + pkill inline en la ruta). | Smoke test |

### 5.7 Dominio admin — RF-ADM

| ID | Requisito | Verificación |
|---|---|---|
| RF-ADM-1 | `listTeacherProvisioningJobs` sin queries Prisma directas en el controller (compone servicios). | Código |
| RF-ADM-2 | Endpoints admin existentes preservan contrato. | Smoke test |

### 5.8 WebSocket — RF-WS

| ID | Requisito | Verificación |
|---|---|---|
| RF-WS-1 | Todo await del handler de conexión dentro de try/catch; un rechazo async no tumba el proceso. | Simulación: error DB no mata el server |
| RF-WS-2 | Listener de `error` en socket y en stream. | Revisión |
| RF-WS-3 | Heartbeat ping/pong con timeout; sesiones muertas se cierran y liberan PTY. | Revisión + prueba de cierre |
| RF-WS-4 | Límite de tamaño por mensaje y de frecuencia; backpressure (`bufferedAmount`). | Revisión |
| RF-WS-5 | Códigos de cierre sin `err.message` interno. | Revisión |
| RF-WS-6 | El gateway loguea conexiones y errores con pino (hoy no loguea nada). | Revisión |

### 5.9 Capa DTO — RF-DTO

| ID | Requisito | Verificación |
|---|---|---|
| RF-DTO-1 | `src/dtos/` con un archivo por dominio (auth, user, group, activity, provisioning, preference) conteniendo schemas zod de entrada y serializadores de salida. | Estructura |
| RF-DTO-2 | Los serializadores actualmente dispersos (serializeTeacher, serializeUser en `routes/auth.js`, serializeGroupActivity, jobs en controllers) se consolidan en su DTO de dominio. | Grep: un solo export por shape |
| RF-DTO-3 | Los services importan de `dtos/`; los controllers no validan a mano. | Código |
| RF-DTO-4 | La capa del frontend (`lib/models/`) no importa nada del backend. | `tsc --noEmit` |
| RF-DTO-5 | Cuando cambia un contrato en el backend, `dtos/<dominio>Dtos.js` y `lib/models/<dominio>.ts` se actualizan en el mismo cambio. | Revisión de diffs |

### 5.10 API y errores — RF-API

| ID | Requisito | Verificación |
|---|---|---|
| RF-API-1 | Toda respuesta de error usa `{error, code}`; `code` en un conjunto conocido (VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, CONFLICT, INTERNAL_ERROR). | Grep + smoke |
| RF-API-2 | `errorHandler` loguea 4xx y 5xx (hoy solo 5xx) con request ID. | Revisión |
| RF-API-3 | Rutas sin match → 404 JSON (hoy HTML de Express). | Smoke |
| RF-API-4 | `requireRoles` inalterado y único; `admin`/`teacher` dejan de ser archivos de una línea. | Revisión |

### 5.11 Frontend — RF-FE (fases F1–F6)

| ID | Requisito | Fase |
|---|---|---|
| RF-FE-1 | TanStack Query reemplaza el polling manual (2 pollers de 5 s) y el fetch disperso (`useEffect` + `setInterval`). | F1 |
| RF-FE-2 | `lib/models/` consolida tipos duplicados: una sola `Activity`, `Difficulty`, `CheckResult`, `EMPTY_PROGRESS`; `RouteRule.roles` tipado como `Role[]`. | F1 |
| RF-FE-3 | Dead code eliminado: proxy route, navbar, sistema toast, sidebar + satélites, ~40 componentes ui sin uso, deps npm sin uso. | F2 |
| RF-FE-4 | `env.ts` única fuente de config; `JWT_SECRET` en un solo lugar; tabla central de rutas en `shared/lib/rules.ts` (regla muerta `/bank` corregida, `/mi-grupo` cubierta). | F3 |
| RF-FE-5 | Reorganización estructural: `shared/` a nivel raíz (components, pages, hooks, lib); `components/` raíz disuelta (genérico → shared, por rol → `lib/features/<rol>/components/`); `lib/features/shared/` migrado a `shared/` y `lib/models/`. | F4 |
| RF-FE-6 | Composición: 3 sistemas de botones → 1; `shell.tsx` único parametrizado (hoy 3 shells duplicados); `useTerminalPreferences`; `LessonProgressProvider` montado una sola vez. | F4 |
| RF-FE-7 | Páginas estandarizadas en `shared/pages/`: `not-found`, `unauthorized`, `terminal` (tokens semánticos y español; hoy tienen colores hardcodeados e inglés). | F5 |
| RF-FE-8 | UI: filtro muerto de tracking eliminado, selects crudos → shadcn, colores hardcodeados → tokens semánticos. | F5 |
| RF-FE-9 | `teacher/data.ts` (stubs) intacto en comportamiento. | — |

## 6. Requisitos no funcionales

### 6.1 Seguridad — RNF-SEC

| ID | Requisito |
|---|---|
| RNF-SEC-1 | Ningún recurso por grupo accesible sin `ensureGroupAccess` (IDOR eliminado). |
| RNF-SEC-2 | `JWT_SECRET` sin default en código; requerido en boot con error claro si falta. |
| RNF-SEC-3 | Errores internos (DB/SSH/Firebase) nunca llegan al cliente. |
| RNF-SEC-4 | helmet activo; límites de body explícitos en `express.json`/`express.text`. |
| RNF-SEC-5 | Rate limit en endpoints que ejecutan SSH por request (`/check`, `/reset`). |
| RNF-SEC-6 | WS: límite de mensajes/tamaño y cierre de sesiones inactivas. |

### 6.2 Rendimiento — RNF-PERF

| ID | Requisito |
|---|---|
| RNF-PERF-1 | Sin regresiones medibles en los caminos calientes (evaluación ≤ 20 s actual). |
| RNF-PERF-2 | `environmentService.snapshot` sin N+1 de SSH por curso (paralelo o batch). |
| RNF-PERF-3 | Import CSV sin transacción por fila (lotes). |

### 6.3 Mantenibilidad — RNF-MNT

| ID | Requisito |
|---|---|
| RNF-MNT-1 | Estructura por capas con archivos por dominio (D-1). |
| RNF-MNT-2 | Cero duplicación de: EMAIL_REGEX, prioridades, `grp_*`, access checks, verify JWT, serialización de jobs, flujo de matrícula. |
| RNF-MNT-3 | Ningún archivo de servicio nuevo > ~300 líneas; `activityService.js` descompuesto. |
| RNF-MNT-4 | Identificadores en inglés; mensajes en español. |
| RNF-MNT-5 | Código muerto eliminado (`createShellStream`, `closePtySession`) y modelo `ProvisioningJob` removido con migración aprobada (tabla vacía). |
| RNF-MNT-6 | Scripts de prisma (seeds/respaldo) movidos a `scripts/` con nombres en inglés. |

### 6.4 Compatibilidad — RNF-COMP

| ID | Requisito |
|---|---|
| RNF-COMP-1 | Contrato REST y WS idéntico al actual (sin breaking changes). |
| RNF-COMP-2 | Sin migraciones de base de datos. |
| RNF-COMP-3 | Sin cambios en `docker-compose.yml` ni `deploy/`. |

### 6.5 Confiabilidad — RNF-REL

| ID | Requisito |
|---|---|
| RNF-REL-1 | Handler global de `unhandledRejection`/`uncaughtException` (log + shutdown ordenado). |
| RNF-REL-2 | `SIGTERM` y `SIGINT` cierran server HTTP, WebSocketServer y `stopWorker()`. |
| RNF-REL-3 | Sin cambios de comportamiento observable: una regresión funcional es falla de fase. |

### 6.6 Calidad de código — RNF-QC

| ID | Requisito |
|---|---|
| RNF-QC-1 | Frontend: `npm run lint` y `npm run typecheck` limpios; `next build` OK. |
| RNF-QC-2 | Backend: arranque sin warnings y con `.env` de ejemplo. |
| RNF-QC-3 | Un commit por fase, mensajes en español consistentes con el historial del repo. |

## 7. Matriz de trazabilidad

| Fase | Subfases | Requisitos |
|---|---|---|
| **B0** Seguridad y cimientos | B0.1 fix IDOR · B0.2 config central · B0.3 error handling | RF-GRP-1, RF-AUTH-4/5, RF-API-1/2, RNF-SEC-1/2/3, RNF-MNT-4 |
| **B1** Capa dtos + zod | B1.1 crear `src/dtos/` · B1.2 schemas de auth/preferences/groups · B1.3 inputs de actividad | RF-DTO-1/2/3, RF-AUTH-1, RF-GRP-2/6, RF-PREF-1, RF-ACT-7 |
| **B2** Separación por capas | B2.1 mover archivos (solo imports) · B2.2 dividir activityService · B2.3 extraer auth de la ruta · B2.4 extraer preferences/terminal · B2.5 adminController fino · B2.6 app.js | RF-AUTH-2, RF-USER-1/3, RF-GRP-5, RF-ACT-1/3/4/8, RF-PREF-2/3, RF-ADM-1, D-5, RNF-MNT-1/3 |
| **B3** Dedupe y consistencia | B3.1 constants/utils · B3.2 access único · B3.3 matrícula unificada · B3.4 JWT único · B3.5 serialización jobs · B3.6 ES→EN | RF-USER-2/4, RF-GRP-3/4, RF-AUTH-6, RF-PROV-3/4, RF-DTO-4/5, RNF-MNT-2/4 |
| **B4** Transacciones y concurrencia | B4.1 tx de actividades · B4.2 deleteGroup · B4.3 race attempt_number | RF-ACT-5/6, RNF-PERF-3 |
| **B5** WebSocket | B5.1 boundaries · B5.2 heartbeat · B5.3 límites · B5.4 higiene/logging | RF-WS-1..6, RNF-SEC-6 |
| **B6** Operativo | B6.1 ciclo de vida · B6.2 helmet/body/404/rate limit · B6.3 raw SQL · B6.4 dead code y scripts | RNF-SEC-4/5, RF-API-3, RF-PROV-2/5/6, RNF-REL-1/2, RNF-PERF-2, RNF-MNT-5/6 |
| **B7** Verificación | B7.1 smoke completo · B7.2 verificación IDOR | Todos los RF/RNF del backend |
| **F1** Modelos + datos | `lib/models/` + TanStack Query | RF-FE-1/2/9, RF-DTO-4/5, RNF-QC-1 |
| **F2** Dead code | limpieza de componentes y deps | RF-FE-3 |
| **F3** Config y auth | env único, rutas centrales en `shared/lib/rules.ts` | RF-FE-4 |
| **F4** Reestructura y composición | `shared/` a nivel raíz, `components/` disuelta, `lib/features/shared/` migrado, botones/shell/hooks | RF-FE-5/6, D-9, RNF-MNT-1 |
| **F5** UI, páginas y tokens | `shared/pages/` (not-found/unauthorized/terminal), filtro muerto, selects, colores | RF-FE-7/8 |
| **F6** Verificación frontend | lint + typecheck + build | RNF-QC-1 |

## 8. Criterios de aceptación por fase

| Fase | Criterio |
|---|---|
| B0 | Smoke: 401/403 con envelope `{error, code}`; docente A no lee jobs de B; boot falla claro sin `JWT_SECRET` |
| B1 | Rechazos 400 de zod en auth/preferences/groups; `dtos/` compila y es consumida por los services |
| B2 | Estructura por capas estable; smoke completo de los 7 routers; ningún export perdido |
| B3 | Grep sin duplicados de: EMAIL_REGEX, prioridades, `groupNameOf`, verify JWT, serializers; smoke matrícula single + bulk |
| B4 | CRUD de actividades atómico; dos checks concurrentes generan intentos distintos |
| B5 | Simulación de caída de DB no tumba el proceso; heartbeat cierra sesiones muertas |
| B6 | SIGTERM ordenado; helmet + rate limit activos; 404 JSON; worker sin raw SQL |
| B7 | **Smoke final completo**: boot → login Firebase → grupos → CSV → actividad → check → terminal WS → worker → admin. Verificación explícita del IDOR. Sin identificadores ES→EN pendientes |
| F1–F6 | lint + typecheck + build limpios; pantallas clave sin regresión; `teacher/data.ts` intacto; `shared/` en su lugar final |

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Regresión funcional en el split de `activityService.js` | B2 mueve primero sin cambiar lógica (solo imports); smoke por router |
| Pérdida de exports en la reorganización | B7 incluye verificación de exports por módulo |
| Eliminación de componentes ui "muertos" que tengan uso indirecto | Verificación de uso real por archivo antes de borrar |
| Convivencia de patrones viejos y TanStack Query durante F1 | Migración incremental pantalla por pantalla |
| Drift silencioso entre DTOs de backend y frontend | Sincronización en el mismo cambio (RF-DTO-5) + smoke en B7 |
