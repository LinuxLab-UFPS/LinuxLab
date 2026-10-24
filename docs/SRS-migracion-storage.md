# SRS — Migración de entregas manuales a almacenamiento propio

**Proyecto:** LinuxLab UFPS  
**Versión:** 0.1 · 2026-10-23  
**Estado:** borrador consolidado para aprobación  
**Alcance:** entregas de actividades evaluadas manualmente

## 1. Propósito

Este documento define el plan y los requisitos para sustituir Firebase Storage
como almacenamiento de las entregas manuales por un servicio propio basado en
MinIO y compatible con la API S3.

La migración debe conservar el comportamiento observable de LinuxLab: los
estudiantes siguen entregando de la misma forma, los docentes siguen viendo y
descargando las entregas, y los metadatos de las entregas permanecen en
PostgreSQL.

## 2. Alcance

### 2.1 Incluido

- Incorporar un contenedor MinIO al despliegue local y al despliegue con Podman.
- Crear y conservar un bucket privado para entregas manuales.
- Sustituir la integración directa con Firebase Storage por un adaptador S3.
- Mantener las rutas actuales de consulta, lectura y descarga de entregas.
- Empezar el almacenamiento de nuevas entregas directamente en MinIO.
- Mantener Firebase Authentication sin cambios.
- Mantener PostgreSQL como fuente de verdad de los metadatos de la entrega.
- Construir localmente las imágenes propias y transferirlas ya preparadas al servidor.

### 2.2 Excluido de esta versión

- Migración de Firebase Authentication.
- Almacenamiento de entregas automáticas u otros archivos de la aplicación.
- Subidas directas desde el navegador hacia MinIO.
- CDN, replicación geográfica o alta disponibilidad de MinIO.
- Procesamiento por streams o descarga por partes.
- Optimización para archivos grandes.
- Cambios de esquema Prisma obligatorios.
- Migración o conservación operativa de entregas de Firebase Storage: no existen
   entregas de producción que deban preservarse.

## 3. Contexto actual

El flujo vigente está implementado principalmente en
`backend/src/services/submissionService.js`:

1. El backend solicita al contenedor `entorno` el árbol de trabajo.
2. El backend solicita la creación de un ZIP temporal.
3. El ZIP se recupera mediante SSH y Base64.
4. El backend lo guarda en Firebase Storage; este paso será sustituido por MinIO.
5. PostgreSQL almacena la referencia en `manualDetail.evidence.storagePath`.
6. Las rutas de entrega descargan el ZIP o extraen archivos individuales.

La migración no modifica los pasos 1 a 3. Solo cambia el paso 4 y la lectura
posterior desde el almacenamiento.

## 4. Restricciones y supuestos

| ID | Restricción o supuesto |
|---|---|
| C-1 | Los archivos son ZIP ligeros y caben razonablemente en memoria del backend. |
| C-2 | La capacidad objetivo es de hasta 40 usuarios concurrentes. |
| C-3 | Las entregas son privadas y solo las pueden consultar sus propietarios o docentes autorizados. |
| C-4 | El backend y MinIO comparten la red interna de contenedores. |
| C-5 | El volumen local de MinIO es persistente y forma parte del plan de backup del servidor. |
| C-6 | `storagePath` seguirá siendo la clave del objeto para las nuevas entregas, sin migrar Prisma. |
| C-7 | El backend seguirá usando Firebase Admin para autenticación. |
| C-8 | El servidor no construye imágenes; las imágenes se construyen o preparan en el runner de GitHub Actions o en la máquina local y se cargan mediante un paquete. |

## 5. Decisiones de arquitectura

| ID | Decisión |
|---|---|
| D-1 | MinIO se utilizará mediante el SDK oficial de AWS para JavaScript y la API S3. |
| D-2 | El bucket será privado; no se permitirá acceso anónimo a los objetos. |
| D-3 | El backend será el único cliente de MinIO. El frontend continuará usando la API de LinuxLab. |
| D-4 | Las descargas pasarán por las rutas existentes del backend. No se expondrá inicialmente un endpoint S3 público. |
| D-5 | Se conservarán claves como `submissions/<groupId>/<submissionId>.zip`. |
| D-6 | La primera instalación será de un solo nodo con un volumen persistente. |
| D-7 | La evidencia existente conservará `storagePath`, `tree`, `files`, `totalBytes` y `submittedAt`. |
| D-8 | No se añadirá una tabla de archivos mientras una entrega tenga un único ZIP y la evidencia actual sea suficiente. |
| D-9 | El backend podrá cargar el ZIP completo en un `Buffer`, conforme al tamaño y concurrencia objetivos. |
| D-10 | El frontend no se comunicará directamente con MinIO en esta versión; todas las subidas, descargas y lecturas pasarán por el backend. |
| D-11 | Las imágenes `linuxlab-frontend`, `linuxlab-backend` y `linuxlab-entorno` se construirán en el runner de GitHub Actions o en la máquina local. La imagen oficial de MinIO se descargará allí y se incluirá en el paquete transferido al servidor. |
| D-12 | No se implementará migración, fallback ni dependencia de Firebase Storage para entregas, porque no hay datos de producción que conservar. |

## 6. Arquitectura objetivo

```text
Frontend
   |
   v
Backend LinuxLab ---- Firebase Auth
   |
   v
MinIO (red internal)
   |
   v
Volumen minio_data
```

Configuración mínima del backend:

```env
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=manual-submissions
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

El endpoint interno no debe aparecer en el frontend ni en URLs entregadas al
navegador. Esto evita que una URL firmada contenga un hostname que solo existe
dentro de la red de contenedores.

## 7. Requisitos funcionales

| ID | Requisito | Verificación |
|---|---|---|
| RF-ST-1 | El backend debe poder guardar un ZIP en MinIO con `Content-Type: application/zip`. | Entrega manual exitosa y objeto visible en el bucket |
| RF-ST-2 | La clave del objeto debe conservar el formato actual `submissions/<groupId>/<submissionId>.zip`. | Inspección del objeto y evidencia PostgreSQL |
| RF-ST-3 | El backend debe poder recuperar el ZIP completo desde MinIO. | Descarga de una entrega |
| RF-ST-4 | El backend debe poder leer un archivo individual extrayéndolo del ZIP. | Consulta de `GET /api/submissions/:id/files` |
| RF-ST-5 | Las rutas actuales de entregas deben conservar sus contratos HTTP y controles de autorización. | Smoke test como estudiante y docente |
| RF-ST-6 | Las nuevas entregas deben escribirse únicamente en MinIO después del corte. | Revisión de configuración y objeto creado |
| RF-ST-7 | La eliminación de una entrega anterior no debe eliminar un objeto perteneciente a otra entrega. | Prueba con dos entregas y claves distintas |
| RF-ST-8 | Los errores de MinIO deben convertirse en errores internos controlados sin exponer credenciales ni detalles del proveedor. | Prueba de servicio detenido |
| RF-ST-9 | El frontend debe continuar accediendo a las entregas exclusivamente mediante la API existente del backend. | Inspección de red y smoke test |
| RF-ST-10 | El despliegue debe cargar la imagen de MinIO desde el paquete preparado localmente, sin construirla en el servidor. | Ejecución de `deploy-server.sh` en un servidor sin herramientas de build |

## 8. Requisitos no funcionales

| ID | Requisito | Criterio |
|---|---|---|
| RNF-ST-1 | Capacidad | Soportar 40 usuarios concurrentes realizando consultas o entregas sin error funcional por el almacenamiento. |
| RNF-ST-2 | Persistencia | Los objetos deben sobrevivir al reinicio del contenedor MinIO. |
| RNF-ST-3 | Aislamiento | MinIO solo debe estar conectado a la red interna; no tendrá puertos públicos directos. |
| RNF-ST-4 | Seguridad | Las credenciales deben configurarse mediante variables o secretos fuera del código. |
| RNF-ST-5 | Compatibilidad | Firebase Auth seguirá funcionando independientemente del cambio de Storage. |
| RNF-ST-6 | Operación | El contenedor debe tener política de reinicio y healthcheck básico. |
| RNF-ST-7 | Observabilidad | El backend debe registrar éxito y fallo de operaciones de almacenamiento sin registrar credenciales ni contenido del ZIP. |
| RNF-ST-8 | Recuperación | Debe existir un procedimiento documentado para restaurar el volumen o recuperar una copia de los objetos. |
| RNF-ST-9 | Regresión | Las entregas existentes deben seguir siendo consultables después del corte. |

## 9. Cambios previstos

### 9.0 Flujo de despliegue

La migración conservará el flujo que ya utiliza el repositorio después de un
merge a `main`:

1. GitHub Actions ejecuta `deploy/update.sh` en un runner Ubuntu.
2. El runner construye las imágenes propias con Docker.
3. El runner descarga la imagen oficial de MinIO.
4. El runner empaqueta todas las imágenes en `imagenes.tar.gz` mediante `docker save`.
5. El paquete se transfiere por SSH al servidor.
6. `deploy/update-server.sh` ejecuta `podman load` y verifica que existan todas
   las imágenes requeridas.
7. El servidor recrea el stack con `podman-compose down/up`; no construye ni
   descarga imágenes.

Este flujo es equivalente al actual y debe seguir siendo automático para cada
merge a `main`. La diferencia es que el paquete pasará de contener tres
imágenes a contener también la imagen de MinIO.

### 9.1 Backend

- Añadir `@aws-sdk/client-s3`.
- Añadir un módulo de configuración S3 en `backend/src/config/`.
- Crear un adaptador de almacenamiento, separado de `submissionService`.
- Reemplazar la dependencia directa de `firebase-storage.js` en el servicio de entregas.
- Mantener la extracción de ZIP actual.
- Validar las variables S3 al iniciar el backend cuando el proveedor activo sea MinIO.

### 9.2 Despliegue

- Añadir MinIO y su volumen a `docker-compose.yml`.
- Añadir MinIO y su volumen a `deploy/compose.podman.yml`.
- Añadir variables a `deploy/backend.env.example`.
- Crear el bucket durante el bootstrap de despliegue mediante un cliente `mc`
  o una tarea de inicialización idempotente.
- Actualizar `build-local.sh` para preparar la imagen de MinIO junto con las
   imágenes propias y `deploy-server.sh` para cargarla y verificarla.
- Actualizar `deploy/update.sh` y `.github/workflows/deploy.yml` únicamente si
   resulta necesario para incluir MinIO en el paquete; se conserva el disparo
   automático tras un push a `main`.
- Actualizar scripts de despliegue y documentación operativa.

### 9.3 Base de datos

No se requiere una migración Prisma en la primera versión. La referencia
existente `manualDetail.evidence.storagePath` seguirá siendo válida.

Una futura versión podría añadir metadatos formales como bucket, proveedor,
checksum o versión del objeto, pero no son necesarios para completar esta
migración.

## 10. Plan de ejecución

### Fase M0 — Decisiones y preparación

- Confirmar nombre del bucket, política de retención y ubicación del volumen.
- Confirmar si el servidor tiene espacio suficiente para duplicar temporalmente
  los objetos durante la migración.
- Definir credenciales iniciales y procedimiento de rotación.
- Confirmar estrategia de backup.

**Salida:** decisiones aprobadas y variables documentadas.

### Fase M1 — Adaptador de almacenamiento

- Implementar el cliente S3 y sus operaciones de guardar, descargar y borrar.
- Mantener una interfaz de almacenamiento independiente del proveedor.
- Añadir pruebas manuales o smoke checks con un bucket local.

**Salida:** el backend puede operar contra MinIO sin cambiar todavía el flujo
de producción.

### Fase M2 — Contenedores y configuración

- Añadir MinIO a los dos Compose.
- Añadir volumen persistente y healthcheck.
- Crear el bucket de forma idempotente.
- Preparar en GitHub Actions o localmente y empaquetar las imágenes antes de
   transferirlas al servidor.
- Actualizar ejemplos de entorno y scripts de despliegue.

**Salida:** un entorno limpio puede iniciar backend, MinIO y bucket listo.

### Fase M3 — Integración de entregas

- Cambiar subida, descarga y lectura de archivos para usar el adaptador.
- Activar escritura en MinIO.
- Verificar autorización de estudiantes y docentes.

**Salida:** las nuevas entregas funcionan en MinIO sin depender de Firebase Storage.

### Fase M4 — Verificación y puesta en operación

- Ejecutar smoke tests de entrega, descarga y lectura de archivos.
- Ejecutar prueba de reinicio de MinIO y persistencia del volumen.
- Ejecutar prueba de concurrencia objetivo.
- Confirmar que el servidor levanta el stack usando únicamente imágenes cargadas.
- Retirar la configuración de Firebase Storage del flujo de entregas.

**Salida:** MinIO es el único almacenamiento de entregas manuales y el servidor
no compila imágenes.

## 11. Criterios de aceptación

La migración se considerará completada cuando:

1. Un estudiante pueda crear una entrega manual y el ZIP aparezca en MinIO.
2. Un estudiante solo pueda consultar sus propias entregas.
3. Un docente pueda consultar y descargar las entregas de sus cursos.
4. La vista de archivos individuales siga funcionando.
5. Una entrega sobreviva al reinicio del contenedor MinIO.
6. Una prueba de 40 usuarios concurrentes no produzca errores funcionales de almacenamiento.
7. El backend no exponga credenciales ni endpoints internos de MinIO.
8. El despliegue local y el despliegue Podman puedan iniciar el bucket automáticamente.
9. El servidor pueda desplegarse cargando un paquete de imágenes preparado fuera de él.
10. Exista un procedimiento probado de backup y restauración.

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Fallo del disco del servidor | Backup del volumen y procedimiento de restauración probado. |
| Exposición accidental del bucket | Bucket privado, red interna y credenciales solo en backend. |
| Cambio accidental de claves | Reutilizar exactamente `storagePath` como object key. |
| Credenciales iniciales no rotadas | Documentar rotación y evitar valores por defecto en producción. |
| Incompatibilidad entre entornos | Probar tanto `docker-compose.yml` como `deploy/compose.podman.yml`. |
| Construcción de imágenes en el servidor | Construir o preparar todas las imágenes en la máquina local y transferir un paquete verificable. |

## 13. Decisiones pendientes de aprobación operativa

Estas decisiones no bloquean el diseño técnico, pero deben cerrarse antes del
despliegue productivo:

- ¿Dónde se almacenará el backup de MinIO?
- ¿Cuál será la política de eliminación de entregas antiguas?
- ¿Qué mecanismo se utilizará para verificar el paquete de imágenes transferido?