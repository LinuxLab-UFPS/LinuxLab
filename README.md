# LinuxLab UFPS

Laboratorio virtual de Linux para la asignatura de Sistemas Operativos de la
Universidad Francisco de Paula Santander. La plataforma reúne en un mismo lugar el
material teórico del temario, una terminal Linux accesible desde el navegador y
actividades prácticas con evaluación automática.

## Estructura del proyecto

```
LinuxLab/
├── backend/                  # API REST (Express + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── controllers/      # Handlers de rutas
│   │   ├── middleware/        # Auth, roles (admin, teacher)
│   │   ├── routes/           # auth, admin, groups
│   │   ├── services/         # Lógica de negocio (groups, enrollment, ssh)
│   │   ├── gateway.js        # WebSocket gateway (terminal Xterm.js)
│   │   └── index.js          # Punto de entrada
│   ├── prisma/               # Schema + migraciones
│   ├── Dockerfile.backend
│   └── Dockerfile.entorno    # Contenedor Linux para estudiantes
├── frontend/                 # Interfaz (Next.js 16 + shadcn/ui)
│   ├── app/                  # App Router
│   ├── components/           # Componentes React
│   ├── lib/                  # Lógica de frontend
│   │   ├── api/              # Cliente HTTP (apiFetch)
│   │   ├── features/         # Módulos por dominio (auth, teacher, student, admin)
│   │   └── config/           # Variables de entorno
│   ├── content/temario/      # Lecciones en Markdown
│   └── Dockerfile.frontend
├── scripts/docker/           # Scripts de infraestructura
├── docker-compose.yml        # 5 servicios
└── .gitignore
```

## Requisitos

- Docker + Docker Compose v2
- Node.js 22+ (para desarrollo local sin Docker)
- Bun o npm

## Desarrollo local

### Con Docker (todo incluido)

```bash
docker compose up -d
```

| Servicio | Puerto | Acceso |
|----------|--------|--------|
| Frontend | 3001 | http://localhost:3001 |
| Backend  | 3000 | http://localhost:3000 |
| RabbitMQ | 15672 | — (futuro) |

### Sin Docker (solo frontend)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3001
```

## Arquitectura

```
Navegador (Xterm.js)
    ↕ WebSocket :3000/terminal
Gateway (Express + ws)
    ↕ SSH (red Docker interna)
Contenedor Entorno (Ubuntu 22.04 + OpenSSH)
    ↕ bash por estudiante
```

La comunicación entre backend y el contenedor del entorno Linux se hace vía
**SSH interno** (librería `ssh2`), sin exponer el socket de Docker. Las claves
se generan automáticamente con un sidecar al hacer `docker compose up`.

## Funcionalidades implementadas

- Autenticación con Google Firebase + JWT (httpOnly cookie)
- Roles: admin, teacher, student
- CRUD de grupos (docente)
- Registro de estudiantes individual y por CSV
- Terminal Linux interactiva en el navegador (Xterm.js + SSH)
- Dashboard de docente con seguimiento

## Temario y contenido

El temario son 14 temas fijos definidos en `frontend/lib/features/shared/temario.ts`.
El contenido de cada tema vive como archivos Markdown dentro de
`frontend/content/temario/tema-NN/`, descritos por un `meta.json`.

## Scripts

```bash
# Frontend
cd frontend
npm run dev        # Desarrollo
npm run build      # Producción
npm run typecheck  # TypeScript check

# Backend
cd backend
npm run dev        # Desarrollo (nodemon)
```

## Tecnologías

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Express 5, Prisma ORM, PostgreSQL, ssh2, ws
- **Infra:** Docker Compose, 5 contenedores, SSH interno
