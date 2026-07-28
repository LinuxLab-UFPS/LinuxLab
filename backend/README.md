# linux-lab-backend

Backend API con Express y Prisma ORM (PostgreSQL).

## Requisitos

- Node.js >= 18
- PostgreSQL (o base de datos remota como Neon)
- Docker (para el entorno Linux de estudiantes)

## Variables de entorno

Crear un archivo `.env` en la raíz:

```env
PORT=3000
DATABASE_URL="postgresql://usuario:password@host:5432/linux_lab"
JWT_SECRET=linuxlab-jwt-secret-2026
FRONTEND_URL=http://localhost:3001
CONTAINER_NAME=linux-lab
```

## Instalación

```bash
npm install
npx prisma generate
```

## Desarrollo

```bash
npm run dev
```

## Entorno Linux (Docker)

El laboratorio provee a cada estudiante un entorno Linux aislado dentro de un
contenedor Docker compartido. El backend se conecta al contenedor vía
WebSocket + `dockerode` para exponer una terminal real en el navegador.

### Construir la imagen

```bash
docker build -f Dockerfile.entorno -t linuxlab/entorno .
```

### Iniciar el contenedor

```bash
docker run -d --name linux-lab linuxlab/entorno
```

### Verificar que está corriendo

```bash
docker ps --filter name=linux-lab
```

### Configurar nombre del contenedor

Por defecto el backend busca un contenedor llamado `linux-lab`. Para usar
otro nombre, definir la variable `CONTAINER_NAME` en `.env`:

```env
CONTAINER_NAME=mi-contenedor
```

### Detener y limpiar

```bash
docker stop linux-lab
docker rm linux-lab
```

## Terminal WebSocket

La terminal del estudiante se sirve a través de un gateway WebSocket montado
sobre el mismo servidor Express:

```
Navegador (xterm.js) ←WebSocket→ Express + ws ←dockerode→ linux-lab (bash)
```

- **Ruta WebSocket:** `ws://<host>:<port>/terminal`
- **Autenticación:** vía cookie `token` (JWT httpOnly, same-origin)
- **Protocolo:** mensajes JSON bidireccionales

### Mensajes Cliente → Servidor

```json
{ "type": "input", "data": "ls -la\n" }
{ "type": "resize", "cols": 120, "rows": 30 }
```

### Mensajes Servidor → Cliente

```json
{ "type": "output", "data": "total 12\ndrwxr-xr-x ..." }
{ "type": "exit", "code": 0 }
```

## Prisma

- `npx prisma migrate dev --name <nombre>` — Crear migración tras agregar modelos
- `npx prisma db push` — Sincronizar schema sin migración
- `npx prisma studio` — UI para ver datos

## Estructura

```
├── Dockerfile.entorno      # Imagen del entorno Linux para estudiantes
├── prisma/
│   ├── schema.prisma       # Modelos de datos
│   └── client.js           # Singleton de PrismaClient
├── src/
│   ├── index.js            # Servidor Express + gateway WebSocket
│   ├── gateway.js          # WebSocket ↔ dockerode ↔ bash
│   ├── middleware/
│   │   ├── auth.js         # JWT para HTTP
│   │   ├── admin.js        # Verificación de rol admin
│   │   └── wsAuth.js       # JWT para WebSocket (vía cookie)
│   ├── services/
│   │   ├── containerClient.js  # dockerode: exec interactivo y simple
│   │   └── teacherService.js   # CRUD de docentes
│   ├── controllers/
│   │   └── adminController.js
│   └── routes/
│       ├── auth.js
│       └── admin.js
├── .env                    # Variables de entorno
└── package.json
```
