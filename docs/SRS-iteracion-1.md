# SRS — Iteración 1: Acceso y gestión de usuarios

**Proyecto:** LinuxLab UFPS
**Fecha de ejecución:** 28 de junio – 12 de julio de 2026
**Módulo:** Acceso y control de roles / Gestión de docentes
**Versión desplegada al cierre:** v0.1 — plataforma accesible, con usuarios autenticados, roles separados y docentes administrados.

---

## 1. Análisis

### 1.1 Propósito y objetivo del ciclo

En la primera iteración se construyó el módulo de acceso del laboratorio, incluyendo el registro de estudiantes con verificación de correo, inicio de sesión mediante cuenta institucional de Google o con correo y contraseña, restablecimiento de contraseña y por parte del administrador, el registro, listado, activación e inactivación de docentes. El control de acceso por rol queda listo, de tal manera que toda ruta protegida primero resuelve la sesión y exige el rol correspondiente antes de ejecutar cualquier operación. Se prioriza este módulo por dependencia técnica, pues sin autenticación y sin roles separados, ningún caso de uso de los módulos posteriores puede probarse con los actores reales del sistema.

### 1.2 Backlog del ciclo

| CU | RF / RNF incluidos | Prioridad | Descripción |
|----|--------------------|-----------|-------------|
| CU01 | RF-01, RF-02 | Alta | Registro del estudiante por cuenta institucional de Google y por correo con contraseña, con envío automático del correo de verificación. |
| CU02 | RF-04, RF-05, RNF-04 | Alta | Inicio de sesión dual (Google OAuth o correo/contraseña) que exige correo verificado; control de acceso por rol en middleware; sesión sobre HTTPS en cookie protegida. |
| CU03 | RF-03 | Media | Restablecimiento de contraseña mediante correo con enlace de un solo uso. |
| CU04 | RF-06, RF-07 | Alta | Registro de docentes por el administrador con correo de activación automático. |

### 1.3 Criterios de aceptación

| CU | Criterios de aceptación |
|----|-------------------------|
| CU01 | 1. Un estudiante con cuenta institucional se registra por Google o con correo y contraseña. 2. Recibe su correo de verificación tras el registro. 3. Una cuenta con correo no verificado no puede iniciar sesión. |
| CU02 | 1. Con credenciales válidas y correo verificado el usuario accede a la plataforma. 2. Con correo sin verificar o cuenta inactiva el ingreso se rechaza. 3. Un rol no puede invocar rutas de otro rol: el servidor responde 403 y no expone datos. 4. La sesión se establece sobre HTTPS y viaja en cookie protegida (httpOnly, sameSite). |
| CU03 | 1. El usuario solicita el restablecimiento y recibe el enlace en su correo. 2. Con el enlace establece una nueva contraseña. 3. La respuesta no revela si el correo existe o no. |
| CU04 | 1. El administrador registra un docente con nombre, código y correo. 2. El docente recibe automáticamente el correo de activación. 3. Un correo de administrador no puede registrarse como docente. |

## 2. Diseño

### 2.1 Modelo de datos de la iteración

Entidades introducidas en este ciclo: `User`, `Student`, `Teacher`, `LinuxAccount` y `Job` (todas marcadas como nuevas). El modelo es acumulativo: en las siguientes iteraciones se conservan estas entidades y se añaden las demás (`Settings` en la iteración 2; `Group`, `Enrollment`, `TopicProgress` y `LessonView` en la iteración 3; el dominio de actividades en la iteración 4 y el de certificados y auditoría en la iteración 5).

```mermaid
erDiagram
    User ||--o| Student : "perfil de estudiante"
    User ||--o| Teacher : "perfil de docente"
    User ||--o| LinuxAccount : "cuenta del entorno"
    User ||--o{ Job : "trabajos encolados"

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
    Student {
        uuid user_id PK
        string code UK
        datetime created_at
        datetime updated_at
    }
    Teacher {
        uuid user_id PK
        string code UK
        datetime created_at
        datetime updated_at
    }
    LinuxAccount {
        uuid user_id PK
        string linux_username UK
        boolean linux_provisioned
        datetime created_at
        datetime updated_at
    }
    Job {
        uuid id PK
        string type
        string status
        int priority
        int retries
        uuid user_id FK
        uuid group_id FK
        json payload
        datetime created_at
        datetime updated_at
    }

    classDef nueva fill:#d4edda,stroke:#28a745,stroke-width:2px
    class User,Student,Teacher,LinuxAccount,Job nueva
```

Decisiones de forma del ciclo: el correo es la identidad en el login; el rol vive en `User` (no en tablas separadas de identidad); la inactivación de una cuenta (`active = false`) es un flag lógico que preserva el historial para la auditoría posterior; `LinuxAccount` y `Job` nacen ya en este ciclo porque el alta de estudiante y de docente deja encolado el aprovisionamiento de su cuenta del entorno, aunque la cuenta se materializa en la iteración 2. El `Job` es la pieza común de todas las tareas asíncronas del sistema (aprovisionamiento, teardown de grupos y envío de certificados) y se reutiliza en los ciclos siguientes.

### 2.2 Decisiones técnicas del ciclo

Para resolver la autenticación sin depender de un único método de acceso se optó por credenciales duales sobre Firebase Auth, por lo que se puede acceder al aplicativo por medio de Gmail y también por el flujo de correo y contraseña con verificación de correo obligatoria. Se prefirió este esquema antes que una contraseña propia gestionada por la plataforma, que obligaría a administrar credenciales adicionales, además que de ese mismo servicio se crean los tres correos automáticos de verificación de registro, restablecimiento de contraseña y activación de docente.

La sesión no se delega al navegador ni a una tabla de sesiones en base de datos, sino a un JWT firmado del lado del servidor con un JWT_SECRET y entregado en una cookie httpOnly. El rol viaja dentro del token firmado, de modo que no puede manipularse desde el cliente, y las peticiones protegidas por rol lo revalidan contra la base de datos.

El control de acceso se concentró en un middleware que compone la autenticación con la exigencia de rol y se aplica ruta por ruta en la API, complementado en el frontend por el middleware de Next y por validaciones de layout que separan los dominios de estudiante, docente y administrador. Se descartó comprobar el rol dentro de cada controlador por su riesgo de omisiones, por lo que la autorización queda así en dos capas, de manera que ninguna ruta protegida ni vista depende de un solo punto de verificación, y la denegación se responde con un 403 FORBIDDEN sin exponer datos.

## 3. Codificación

### 3.1 Vistas implementadas

| Vista | Ruta | Actor | Incremento del ciclo |
|-------|------|-------|----------------------|
| Iniciar sesión | `/login` | Todos | Login dual con redirección por rol y reclamo de cuenta no verificada. |
| Verificación de correo | `/auth/verificacion` | Estudiante | Confirma la dirección con el código. |
| Restablecer contraseña | `/auth/reset-password` | Todos | Establece la nueva credencial desde el enlace del correo. |
| Acción de correo | `/auth/accion` | Todos | Consolidador de acciones de Firebase (código `oobCode`). |
| Activar cuenta docente | `/auth/setup-account` | Docente | Establece la contraseña del docente registrado por el administrador. |
| Acceso no autorizado | `/unauthorized` | Todos | 403 con mensaje y salida al dominio propio. |
| Gestión de docentes | `(protected)/admin/docentes` | Administrador | Registro con formulario, listado con búsqueda y activación/inactivación. |

Registro visual de las vistas del ciclo (capturas tomadas sobre el entorno local con datos de demostración):

![Iniciar sesión](annex-images/it1/login.png)

![Verificación de correo](annex-images/it1/auth-verificacion.png)

![Restablecer contraseña](annex-images/it1/auth-reset-password.png)

![Acción de correo](annex-images/it1/auth-accion.png)

![Activar cuenta docente](annex-images/it1/auth-setup-account.png)

![Acceso no autorizado](annex-images/it1/unauthorized.png)

![Gestión de docentes](annex-images/it1/admin-docentes.png)

### 3.2 Endpoints implementados

| Método | Ruta | Actor | Descripción |
|--------|------|-------|-------------|
| POST | `/api/auth/firebase` | Cualquier usuario | Login dual: valida el token de Google, da de alta al estudiante la primera vez y entrega la cookie de sesión. |
| GET | `/api/auth/me` | Cualquier usuario autenticado | Devuelve el usuario de la sesión; si la sesión ya no es válida, limpia la cookie. |
| POST | `/api/auth/logout` | Cualquier usuario autenticado | Cierra la sesión, la registra en la bitácora y borra la cookie. |
| POST | `/api/auth/request-verification` | Público | Envía el correo de verificación; respuesta genérica si el correo no existe. |
| POST | `/api/auth/request-password-reset` | Público | Envía el correo de restablecimiento; respuesta genérica si el correo no existe. |
| POST | `/api/admin/docentes` | Administrador | Registro de docente (idempotente) con correo de activación y encolado de su cuenta Linux. |

## 4. Pruebas

### 4.1 Pruebas del ciclo

Pruebas unitarias de rutas HTTP con Jest + supertest: la base de datos se reemplaza por un mock de Prisma, la integración con Firebase/correo se mockea en la frontera, y la sesión es un JWT real firmado con el secreto de prueba, por lo que el middleware de autorización se ejercita de verdad. Comando: `npm run test:it1` desde `backend/`.

| CU / RF / RNF | Endpoint / pieza | Casos |
|---------------|------------------|-------|
| CU01, CU02 | `POST /api/auth/firebase` | Rechazo de petición sin token (400); alta de estudiante con cookie; rechazo de correo sin verificar (403); sin duplicar usuarios; bloqueo de cuenta inactiva (403). |
| CU01 | `POST /api/auth/request-verification` | Envío del correo con categoría verification; respuesta genérica para correo inexistente; DTO inválido (400). |
| CU03 | `POST /api/auth/request-password-reset` | DTO inválido (400); respuesta genérica para correo inexistente; error de Firebase (500). |
| CU02 | `GET /api/auth/me` | 401 sin sesión; 200 con sesión válida; 401 con firma falsa; 403 con cuenta desactivada y limpieza de cookie. |
| CU02 | `POST /api/auth/logout` | Cierre de sesión: confirmación, borrado de cookie y registro auth_logout en la bitácora. |
| CU02 (RF-05) | `GET /api/admin/docentes` | Sesión de estudiante → 403 sin consultar la base; sesión de docente → 403 sin consultar la base. |
| CU04 | `POST /api/admin/docentes` | Registro docente (201) con invitación por correo y encolado del aprovisionamiento de su cuenta Linux; correo de administrador no promovible (409); payload incompleto (400). |

Total de la iteración: 21 pruebas unitarias en verde (16 auth, 2 roles, 3 docentes).
