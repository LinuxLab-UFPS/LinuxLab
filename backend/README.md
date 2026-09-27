# LinuxLab UFPS, backend

API REST, gateway WebSocket de la terminal y worker de aprovisionamiento del
laboratorio. Está construido con Node.js 22, Express 5 y Prisma sobre PostgreSQL 16, y
se comunica con el entorno Linux de los estudiantes por SSH interno.

El backend no se ejecuta por separado, sino como uno de los servicios del conjunto que
se levanta con Docker Compose desde la raíz del repositorio. Los prerrequisitos, la
configuración, la ejecución local y el despliegue están descritos en el
[README principal](../README.md).

## Organización

| Recurso | Contenido |
| ------- | --------- |
| [src/index.js](src/index.js) | Punto de entrada. Arranca el servidor HTTP, el gateway y el worker. |
| [src/app.js](src/app.js) | Configuración de Express y registro de las rutas bajo `/api`. |
| [src/routes/](src/routes) | Endpoints y cadena de middleware. |
| [src/controllers/](src/controllers) | Recepción de las peticiones y delegación en los servicios. |
| [src/services/](src/services) | Lógica de negocio, acceso a datos y operaciones sobre el entorno. |
| [src/gateway/](src/gateway) | Canal WebSocket de la terminal. |
| [src/middleware/](src/middleware) | Sesión, roles, matrícula y manejo de errores. |
| [src/dtos/](src/dtos) | Validación de la entrada y serialización. |
| [src/lib/](src/lib), [src/utils/](src/utils) | Utilidades compartidas. |
| [src/config/](src/config) | Variables de entorno y Firebase. |
| [src/templates/](src/templates) | Plantillas de correo. |
| [prisma/](prisma) | Esquema, migraciones y semillas de la base de datos. |

## Comandos de Prisma

Se ejecutan dentro del contenedor del backend, que es el único con acceso a la base de
datos.

```bash
docker compose exec backend npx prisma migrate status   # estado de las migraciones
docker compose exec backend node prisma/seed.js         # volver a cargar las semillas
```

Las migraciones versionadas viven en [prisma/migrations/](prisma/migrations) y el
servicio `migrate` aplica las pendientes cada vez que arranca el conjunto, tanto en
desarrollo como en producción.
