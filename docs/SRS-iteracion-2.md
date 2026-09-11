# SRS — Iteración 2: Contenido académico y entorno Linux

**Proyecto:** LinuxLab UFPS
**Fecha de ejecución:** 13 de julio – 26 de julio de 2026
**Módulo:** Contenido académico y entorno Linux / Temario, simuladores y terminal
**Versión desplegada al cierre:** v0.2 — temario navegable con recursos hipermediales y un entorno Linux integrado, con sesiones persistentes, aisladas y con límites de seguridad y recursos.

---

## 1. Análisis

### 1.1 Propósito y objetivo del ciclo

En la segunda iteración se construyó el contenido académico y el entorno de práctica del laboratorio, tomando como base la identidad y los roles ya resueltos en la iteración anterior. El estudiante navega el temario fijo del curso con sus recursos hipermediales (texto y simuladores), y dispone de una terminal Linux real accesible desde el navegador, conectada a su cuenta y a su directorio `/home` personales dentro de un contenedor compartido. El ciclo cierra cuando el entorno queda materializado: la cuenta Linux que en la iteración 1 solo se encolaba ahora existe en el sistema, la sesión de terminal se abre sobre una PTY real, la cuenta queda aislada y limitada en recursos, y el servidor impide el uso de privilegios de superusuario. Se prioriza este módulo por dependencia técnica, pues sin temario y sin entorno no puede resolverse ninguna de las actividades prácticas de los ciclos posteriores.

### 1.2 Backlog del ciclo

| CU | RF / RNF incluidos | Prioridad | Descripción |
|----|--------------------|-----------|-------------|
| CU11 | RF-15 (RNF-01) | Alta | Navegación del temario fijo por el estudiante, con recursos hipermediales asociados y registro del avance de lectura por lección. |
| CU12 | RF-16 | Media | Uso de los simuladores interactivos publicados como recursos del temario. |
| CU14 | RF-18, RF-19 (RNF-02, RNF-03, RNF-07) | Alta | Terminal Linux real en el navegador sobre la cuenta y el directorio personal del estudiante, con sesión persistente, aislada y restringida en privilegios y recursos. |
| CU14 | RNF-06, RNF-08 | Alta | Despliegue on-premise del entorno y cierre automático de la sesión de terminal por inactividad. |
| CU14 | Settings | Media | Preferencias del entorno del usuario (tema visual, tamaño y familia tipográfica de la terminal), persistidas por cuenta. |

### 1.3 Criterios de aceptación

| CU | Criterios de aceptación |
|----|-------------------------|
| CU11 | 1. El estudiante navega el temario y consulta los recursos hipermediales de cada tema. 2. Al abrir una lección queda registrada su lectura. 3. El progreso del tema se actualiza cuando todos sus subtemas están leídos. 4. Un estudiante sin matrícula activa no acumula avance y el servidor lo rechaza con 409. |
| CU12 | 1. El estudiante abre los simuladores asociados al temario y estos operan sin depender de estado en el servidor. |
| CU14 | 1. El usuario autenticado con cuenta provisionada abre una terminal real conectada a su entorno. 2. La conexión se rechaza sin sesión válida, con la cuenta sin provisionar o si el estudiante no tiene matrícula activa. 3. El shell corre como el usuario del sistema asignado, sin privilegios de superusuario. 4. Cada cuenta opera aislada con límites de CPU, memoria, inodos y disco. 5. Tras cerrar y reabrir, el directorio personal conserva archivos y configuraciones. 6. La sesión inactiva se cierra y libera la PTY. |

## 2. Diseño

### 2.1 Modelo de datos de la iteración

Entidad introducida en este ciclo: `Settings` (marcada como nueva). Se conservan las entidades de la iteración anterior (`User`, `Student`, `Teacher` y `LinuxAccount`) y se materializa la cuenta Linux, que pasa de `linux_provisioned = false` a `true` cuando el worker termina de crearla en el entorno.

```mermaid
erDiagram
    User ||--o| Student : "perfil de estudiante"
    User ||--o| Teacher : "perfil de docente"
    User ||--o| LinuxAccount : "cuenta del entorno"
    User ||--o| Settings : "preferencias"

    User {
        uuid id PK
        string email UK
        string name
        string role "admin, docente, estudiante"
        string google_id UK
        boolean active
        datetime last_login
        datetime created_at
        datetime updated_at
    }
    LinuxAccount {
        uuid user_id PK
        string linux_username UK
        boolean linux_provisioned "se materializa en este ciclo"
        datetime created_at
        datetime updated_at
    }
    Settings {
        uuid user_id PK
        int terminal_font_size "12 a 24 px"
        string terminal_font_family
        string theme "system, light, dark"
        datetime created_at
        datetime updated_at
    }

    classDef nueva fill:#d4edda,stroke:#28a745,stroke-width:2px
    class Settings nueva
```

Decisión de forma del ciclo: las preferencias del entorno viven en `Settings`, una extensión uno a uno de `User`, en lugar de columnas nuevas en `User` o de almacenamiento en el navegador, de modo que viajan con la cuenta del usuario y se comparten entre dispositivos. El progreso académico del temario no se modela aquí: reutiliza las entidades de avance (`LessonView`, `TopicProgress`, ligadas a `Enrollment`) que la iteración de grupos hereda y que se pueblan por matrícula, no por usuario.

### 2.2 Decisiones técnicas del ciclo

El contenido del temario se mantiene como archivos versionados en el repositorio en lugar de datos administrables en base de datos: es un temario fijo, igual para todos los grupos, y su autoría se resuelve por control de versiones. Lo que sí se persiste es el avance de lectura, que se registra por matrícula y se anota en **todas** las matrículas activas del estudiante para que leer una lección cuente de igual manera en cada curso en el que esté inscrito.

La terminal se resolvió con una PTY real sobre SSH al contenedor, en lugar de un emulador en el navegador, porque la asignatura exige comandos reales del sistema operativo. El canal es un WebSocket en la ruta `/terminal` que reutiliza la misma cookie httpOnly de la sesión HTTP para autenticarse, de manera que no se abre un segundo mecanismo de credenciales ni se expone el token al cliente. Antes de abrir la PTY, el gateway verifica que el usuario exista, que su cuenta Linux esté provisionada y que el estudiante conserve una matrícula activa; cualquier fallo cierra el socket con un código de la familia 4001 sin filtrar el detalle interno.

El aislamiento y los límites se aplican en el sistema operativo y no en la aplicación: cada estudiante opera bajo su propia cuenta de usuario del sistema, con `cgroups` (CPU al 10 % y techos de memoria por proceso) y cuotas de disco e inodos. La sesión arranca con `nice -n 10 su - <usuario>`, es decir, con el shell del estudiante sin privilegios de superusuario, y los comandos administrativos del provisionamiento corren del lado del servidor como `labadmin`, nunca desde la sesión del estudiante. El home es persistente entre sesiones y solo se destruye cuando el curso se finaliza o se archiva, momento en que se eliminan la cuenta, el grupo Unix y el directorio del curso.

El aprovisionamiento de la cuenta se mantiene desacoplado del alta con una cola de trabajos y un worker que procesa lotes cada 5 segundos: la matrícula encola el `Job` y la terminal espera a que `linux_provisioned` sea verdadero. El cierre por inactividad se resuelve con un heartbeat de ping/pong cada 30 segundos que termina los sockets que no responden, liberando la PTY y los procesos asociados sin afectar la persistencia de los archivos.

## 3. Codificación

### 3.1 Vistas implementadas

| Vista | Ruta | Actor | Incremento del ciclo |
|-------|------|-------|----------------------|
| Temario | `/inicio` (redirige desde `/contenidos`) | Estudiante | Navegación del temario por temas y subtemas, con recursos hipermediales y registro de lectura por lección. |
| Simuladores | `/simuladores`, `/simuladores/[id]` | Estudiante | Simuladores interactivos asociados a los temas, operados en el cliente. |
| Terminal Linux | `/terminal` | Estudiante, docente, administrador | Terminal real en el navegador sobre la PTY del entorno, con panel de preferencias de tipografía y tema. |

### 3.2 Endpoints implementados

| Método | Ruta | Actor | Descripción |
|--------|------|-------|-------------|
| GET | `/api/progress` | Estudiante autenticado | Avance del temario (temas completados, lecciones leídas) y actividades del grupo. |
| POST | `/api/lessons/:topicSlug/:subtopicId/view` | Estudiante matriculado | Registra la lectura de un subtema en todas las matrículas activas; 409 sin matrícula. |
| WS | `/terminal` | Usuario autenticado con cuenta provisionada | Abre la PTY del entorno; reenvía `input` y `resize` y atiende `reset`. |
| POST | `/api/terminal/reset` | Estudiante matriculado | Mata los procesos del usuario para reiniciar la sesión de terminal. |
| PUT | `/api/preferences` | Usuario autenticado | Actualiza las preferencias del entorno (tema, tamaño y familia tipográfica). |

## 4. Pruebas

### 4.1 Pruebas del ciclo

Pruebas unitarias y de integración con Jest: las rutas HTTP se ejercitan con supertest sobre un mock del cliente Prisma, la sesión es un JWT real firmado con el secreto de prueba (por lo que la autenticación se prueba de verdad), y el entorno se sustituye en la frontera por un mock de SSH. La terminal WebSocket se prueba levantando un servidor HTTP efímero con un cliente `ws` real, mockeando la apertura de la PTY y la base de datos. Comando: `npx jest tests/temario tests/preferences tests/terminal` desde `backend/`.

| CU / RF / RNF | Endpoint / pieza | Casos |
|---------------|------------------|-------|
| CU11, RF-15 | `POST /api/lessons/:topicSlug/:subtopicId/view` | 401 sin sesión; 404 subtema inexistente; 404 subtema de otro tema; 409 sin matrícula activa; 204 registrando la lectura en todas las matrículas activas. |
| CU11, RF-15 | `GET /api/progress` | 401 sin sesión; estado vacío sin matrícula; temas, lecturas, grupo y actividades con matrícula. |
| CU14, RF-18 | `WS /terminal` | Cierre 4001 sin cookie, sin cuenta Linux, con cuenta sin provisionar y con estudiante sin matrícula; apertura de PTY y reenvío de `input`/`resize`; `reset` que mata procesos y recrea la PTY; cierre 1008 por inundación; cierre 1009 por payload sobredimensionado. |
| CU14, RF-18 | `wsAuth` | Rechazo sin cookie; rechazo con firma inválida; aceptación con cookie válida; hallazgo de la cookie entre otras. |
| CU14, RF-18 | `POST /api/terminal/reset` | 401 sin sesión; 403 estudiante sin matrícula; 400 sin cuenta Linux; 200 con cuenta válida. |
| CU14, RF-19 / RNF-03, RNF-07 | `containerService` | Alta del usuario con home `2700` y membresía al grupo Unix; cuota de disco e inodos y techos de cgroup; aborto si el grupo Unix no existe; PTY con `nice` y `su` sin sudo; marcado de `linux_provisioned` solo tras verificar home y membresía; fallo si el home es ajeno. |
| CU14, RNF-07 | `containerService.resetTerminal` | Mata los procesos del usuario; rechaza un nombre de cuenta con caracteres inyectables. |
| RNF-08 | `heartbeat` | Termina a los clientes que no responden al ping; termina en el siguiente ciclo al que dejó de responder; `stopHeartbeat` detiene el latido. |
| CU14, Settings | `PUT /api/preferences` | 401 sin sesión; 400 por tamaño de letra fuera de rango (11 y 25); 400 por tema inválido; 400 por familia tipográfica inválida; 200 aplicando solo los campos enviados; 200 sin campos en el cuerpo. |

Total de la iteración: 42 pruebas en verde, repartidas en 7 suites (8 temario, 7 preferencias, 4 terminal HTTP, 8 terminal-entorno, 3 heartbeat, 4 wsAuth, 8 gateway WebSocket). La suite completa del proyecto queda en 66 pruebas verdes, sumando las 24 de la iteración 1.
