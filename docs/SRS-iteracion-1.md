# SRS — Iteración 1: Acceso y gestión de usuarios

**Proyecto:** LinuxLab UFPS
**Iteración:** 1 de 5 · Ciclo declarado: 28 de junio – 12 de julio de 2026
**Módulo:** Acceso y control de roles / Gestión de docentes
**Versión desplegada al cierre:** v0.1 — plataforma accesible, con usuarios autenticados, roles separados y docentes administrados.
**Estado:** Especificación del ciclo (documento de desarrollo)

---

## 1. Propósito y objetivo del ciclo

La primera iteración construye la capa de acceso del laboratorio: registro de estudiantes con verificación de correo, inicio de sesión mediante cuenta institucional de Google o con correo y contraseña, restablecimiento de contraseña, y la primera superficie del actor administrador: el registro, listado, activación e inactivación de docentes. El control de acceso por rol (RF-05) se establece desde este ciclo como regla transversal: toda ruta protegida resuelve la sesión y exige el rol correspondiente antes de ejecutar cualquier operación.

Se priorizó este conjunto en primer lugar por dependencia técnica, no por importancia funcional: sin autenticación y sin roles separados, ningún caso de uso de los módulos posteriores puede probarse con los actores reales del sistema. CU04 y CU05 (registrar y listar/gestionar docentes) acompañan al actor administrador como su dominio de prueba natural: sin un docente activo en la plataforma no existe usuario alguno que ejerza el resto de funcionalidades del aplicativo.

## 2. Backlog del ciclo

| ID | Ítem (CU/RF/RNF) | Prioridad | Descripción |
|----|------------------|-----------|-------------|
| B1-1 | CU01 — RF-01, RF-02 | Alta | Registro del estudiante por cuenta institucional de Google y por correo con contraseña, con envío automático del correo de verificación. |
| B1-2 | CU02 — RF-04 | Alta | Inicio de sesión dual (Google OAuth o correo/contraseña) que exige correo verificado y establece la sesión del usuario. |
| B1-3 | RF-05 (transversal) | Alta | Control de acceso por rol en middleware: administrador, docente y estudiante acceden únicamente a sus funciones. |
| B1-4 | CU03 — RF-03 | Media | Restablecimiento de contraseña mediante correo con enlace de un solo uso. |
| B1-5 | CU04 — RF-06, RF-07 | Alta | Registro de docentes por el administrador con correo de activación automático. |
| B1-6 | CU05 — RF-08, RF-09 | Alta | Listado de docentes registrados y gestión del estado de su cuenta (activación e inactivación). |
| B1-7 | RNF-04 | Alta | Comunicación íntegra sobre HTTPS y WSS, con la sesión en cookie protegida. |

## 3. Criterios de aceptación

| ID | Criterio de aceptación |
|----|------------------------|
| A-B1-1 | Un estudiante con cuenta institucional se registra por Google o con correo y contraseña, y recibe su correo de verificación; una cuenta no verificada no puede iniciar sesión. |
| A-B1-2 | Con credenciales válidas y correo verificado el usuario accede a la plataforma; con correo sin verificar el ingreso es rechazado con mensaje informativo. |
| A-B1-3 | Un rol no puede invocar rutas de otro rol: el servidor responde 403 y no expone datos. |
| A-B1-4 | El usuario restablece su contraseña desde el enlace del correo y luego inicia sesión con la nueva credencial. |
| A-B1-5 | El docente registrado activa su cuenta desde el correo de invitación y accede con rol docente. |
| A-B1-6 | El administrador lista los docentes y cambia su estado sin invalidar el usuario; un docente inactivo no puede iniciar sesión. |
| A-B1-7 | Todo el tráfico entre navegador y servidor circula cifrado (HTTPS/WSS) y la sesión viaja en cookie protegida. |

## 4. Alcance no funcional del ciclo

| RNF | Verificación en el ciclo |
|-----|--------------------------|
| RNF-04 Comunicación segura | HTTPS en el despliegue; cookie de sesión con banderas `httpOnly`, `sameSite: lax`, `secure` en producción y ruta `/`. Comprobado en producción y con pruebas unitarias de sesión (cookie presente en el login y limpiada al cerrarla / desactivar cuenta). |

## 5. Orden de implementación

El ciclo implementó la cadena modelo → servicio → endpoint → vista en este orden de dependencias:

| Paso | Pieza | Depende de |
|------|-------|------------|
| 1 | Modelo `User` (rol, estado de verificación, `google_id`, activación) | — |
| 2 | Servicio de autenticación: firma y verificación de sesión JWT | Modelo `User` |
| 3 | Integración Firebase Admin: verificación de token de Google y enlaces de verificación/restablecimiento | paso 1–2 |
| 4 | Middleware de sesión y de roles (`authMiddleware`, `requireRoles`) | paso 2 |
| 5 | Endpoints de `/api/auth` (login, verificación, reset, `/me`, logout) | pasos 2–4 |
| 6 | Endpoints de `/api/admin/docentes` (registro, listado, activación) | pasos 4–5 |
| 7 | Gráco: login, verificación, restablecimiento, activación de cuenta y administración de docentes (401/403) | pasos 5–6 |

## 6. Modelo de datos al cierre del ciclo

El repositorio aplica control de versiones al esquema de base de datos a partir del 24 de agosto de 2026 (migración inicial consolidada); en la fecha de corte de esta iteración el modelo existía como código sobre la base de datos, sin migraciones versionadas. El estado del modelo en el cierre del ciclo es el siguiente:

| Tabla | Contenido | Rol en el ciclo |
|-------|-----------|-----------------|
| `User` | Identidad del usuario: nombre, correo (único), rol (`admin`, `docente`, `estudiante`), estado activo, `google_id`, marca de correo verificado, último inicio de sesión. | Base de la autenticación y del control de roles (RF-05). |
| `Student` | Perfil de estudiante (código). | Permite la trazabilidad del actor estudiante desde el ciclo. |
| `Teacher` | Perfil de docente (código único). | CU04: alta de docentes. |
| `LinuxAccount` | Cuenta del entorno Linux (`linux_username`, `linux_provisioned`). | Reservada en el ciclo: se consulta en `User`, pero su aprovisionamiento se implementa en la iteración del entorno. |

Decisiones de forma del ciclo: el correo es la identidad en el login; el rol vive en `User` (no en tablas separadas de identidad); la inactivación de una cuenta (`active = false`) es un flag lógico que preserva el historial para la auditoría posterior.

## 7. Decisiones técnicas del ciclo

### 7.1 Credenciales duales: cuenta institucional de Google + correo/contrasena

**Contexto:** la universidad dispone de cuentas institucionals de Google, pero el registro del estudiante también requiere una contraseña (RF-01, RF-04) y el curso no garantiza que todos los estudiantes tengan la cuenta institucional lista.

**Alternativas.** (a) Solo correo/contraseña propia — obliga a gestionar credenciales nuevas y las olvido; (b) solo Google OAuth — más simple pero excluye a quien no puede entrar con su cuenta institucional.

**Decisión.** Modo dual sobre Firebase Auth: la plataforma valida el token emitido por Google (`verifyIdToken`) y lo casa con el usuario de la base; en paralelo admite el flujo correo/contraseña de Firebase con verificación obligatoria del correo. Se exige el dominio `@ufps.edu.co` antes de entrar en el intercambio de tokens, dándole papel institucional al correo.

**Consecuencia.** Tres correos automáticos constituyen la confianza del ciclo (verificación de registro, restablecimiento de contraseña y activación de docente) y la sesión se establece por la plataforma, no por el proveedor externo.

### 7.2 Sesión firmada del lado del servidor (JWT)

**Contexto.** El rol y el identificador del usuario circulan con cada request protegida.

**Alternativas.** (a) Sesión en el navegador — es manipulable; (b) sesión en base de datos con tabla de sesiones; (c) token firmado por el servidor.

**Decisión.** JWT firmado con `JWT_SECRET`, entregado en cookie `httpOnly` (cookie `token`) y verificado por el backend en cada request. El rol no es confiable desde el cliente: viene dentro del token firmado y puede revalidarse contra la base en las operaciones sensibles.

**Consecuencia.** La autorización y el logout no dependen de estado de sesión en BD; la invalidación de una cuenta inactiva se resuelve al leer el usuario en `/me` (se implica rechazo 401/403 y el borrado de la cookie).

### 7.3 Control de acceso en el borde: middleware + guardas de layout

**Contexto.** El rol debe respetarse en las rutas de la API y en la navegación del frontend.

**Alternativas.** (a) Comprobar el rol dentro de cada controlador: propenso a omisiones; (b) middleware centralizado por ruta más guardas de layout por dominio.

**Decisión.** Un middleware `requireRoles` compone autenticación + rol y se aplica por ruta en Express; en el frontend, el middleware de Next y las guardas de layout separan los dominios estudiante/docente, con páginas dedicadas para 401/403. La protección no descansa en un solo punto.

**Consecuencia.** La denegación de rol es consistente para HTTP (403 con `AuthorizationError`) y la capa visual; el mismo token resume la sesión para los dos canales (HTTP y WebSocket de la terminal, cuya sesión revalida con la misma clave en la iteración 2).

## 8. Vistas implementadas

Atribución por módulo (la obtención del snapshot por fecha de corte es acorde a lo definido en el plan; el módulo de acceso se estabiliza con el merge del flujo de login del 25 de agosto de 2026):

| Vista | Ruta | Actor | Incremento del ciclo |
|-------|------|-------|----------------------|
| Iniciar sesión | `/login` | Todos | Login dual con redirección por rol y reclamo de cuenta no verificada. |
| Verificación de correo | `/auth/verificacion` | Estudiante | Confirma la dirección con el código o la propia de Firebase. |
| Restablecer contraseña | `/auth/reset-password` | Todos | Establece la nueva credencial desde el enlace del correo. |
| Acción de correo (verificación/restablecimiento) | `/auth/accion` | Todos | Consolidador de acciones de Firebase (código `oobCode`). |
| Activar cuenta docente | `/auth/setup-account` | Docente | Establece la contraseña del docente registrado por el administrador. |
| Acceso no autorizado | `/unauthorized` | Todos | 403 con mensaje y salida a su dominio. |
| Gestión de docentes | `(protected)/admin/docentes` | Administrador | Registro con formulario, listado con búsqueda, activación/inactivación. |

## 9. Endpoints implementados

| Método | Ruta | Actor | Descripción | Depende de |
|--------|------|-------|-------------|------------|
| POST | `/api/auth/firebase` | Cualquier usuario | Login dual: valida el token de Google, alta del estudiante primera vez, entrega la cookie de sesión. | Modelo `User`, JWT, Firebase |
| GET | `/api/auth/me` | Cualquier usuario autenticado | Devuelve el usuario de la sesión con sus reglas activas y limpia la cookie si la sesión ya no es válida. | JWT |
| POST | `/api/auth/logout` | Cualquier usuario autenticado | Cierre de sesión con registro en bituácora; borra la cookie. | JWT |
| POST | `/api/auth/request-verification` | Público | Envía el correo de verificación; respuesta genérica si el correo no existe. | Firebase, correo |
| POST | `/api/auth/request-password-reset` | Público | Envía el correo de restablecimiento; respuesta genérica si el correo no existe. | Firebase, correo |
| GET | `/api/admin/docentes` | Administrador | Listado de docentes con búsqueda y filtro de estado. | `requireRoles("admin")` |
| POST | `/api/admin/docentes` | Administrador | Registro de docente (idempotente) con correo de activación y cola de su cuenta Linux. | `requireRoles("admin")`, correo |
| PATCH | `/api/admin/docentes/:id` | Administrador | Activación/inactivación de la cuenta docente. | `requireRoles("admin")` |

## 10. Pruebas del ciclo

Pruebas unitarias de rutas HTTP con Jest + supertest: la base de datos se reemplaza por un mock de Prisma, la integración con Firebase/correo se mockea en la frontera, y la sesión es un JWT real firmado con el secreto de prueba, por lo que el middleware de autorización se ejercita de verdad. Comando: `npx jest tests/auth tests/admin` desde `backend/`.

| Suite | Endpoint / pieza | Pruebas | CU/RF asociado |
|-------|------------------|---------|----------------|
| `tests/auth/authRoutes.test.js` | `POST /api/auth/firebase` | Rechazo de petición sin token (400); alta de estudiante con cookie; rechazo de correo sin verificar (403); sin duplicar usuarios; bloqueo de cuenta inactiva (403). | CU01, CU02, RF-01, RF-04 |
| `tests/auth/authRoutes.test.js` | `POST /api/auth/request-verification` | Envío del correo con categoría `verification`; respuesta genérica para correo inexistente; DTO inválido → 400. | CU01, RF-02 |
| `tests/auth/authRoutes.test.js` | `POST /api/auth/request-password-reset` | DTO inválido → 400; respuesta genérica para correo inexistente; error de Firebase → 500. | CU03, RF-03 |
| `tests/auth/authRoutes.test.js` | `GET /api/auth/me` | 401 sin sesión; 200 con sesión válida; 401 con firma falsa; 403 con cuenta desactivada y limpieza de cookie. | CU02, RF-04, RF-05 |
| `tests/auth/authRoutes.test.js` | `POST /api/auth/logout` | Cierre de sesión: respuesta de confirmación, borrado de la cookie y registro `auth_logout` en la bitácora. | CU02, RF-04, RF-05 |
| `tests/auth/roles.test.js` | `GET /api/admin/docentes` | Sesión de estudiante → 403 sin consultar la base; sesión de docente → 403 sin consultar la base. | RF-05 |
| `tests/admin/adminDocentes.test.js` | `POST /api/admin/docentes` | Registro docente 201 con invitación por correo (RF-07) y cola de aprovisionamiento de su cuenta Linux; correo de administrador no promovible → 409; payload incompleto → 400. | CU04, RF-06, RF-07 |
| `tests/admin/adminDocentes.test.js` | `GET /api/admin/docentes` | Listado con filtro de docentes (200). | CU05, RF-08 |
| `tests/admin/adminDocentes.test.js` | `PATCH /api/admin/docentes/:id` | Inactivación de docente con trazabilidad en auditoría; id sin perfil docente → 404. | CU05, RF-09 |

**Total del ciclo: 24 pruebas unitarias en verde** (16 auth, 2 roles, 6 docentes), ejecutadas sin base de datos ni contenedores.

## 11. Verificación del incremento

| Criterio | Evidencia |
|----------|-----------|
| A-B1-1, A-B1-2 | Suite auth: altas, verificación y login dual, con bloqueos de cuenta no verificada/inactiva. |
| A-B1-3 | Suite roles: 403 sin exponer datos para sesiones cruzadas. |
| A-B1-4 | Suite auth: solicitud de restablecimiento con respuesta de no-filtración (500 con error de Firebase, genérica en presencia de correo inexistente). |
| A-B1-5, A-B1-6 | Suite admin docentes: alta con invitación, 409 de correo protegido, toggles y 404. |
| A-B1-7 | El aplicativo desplegado bajo HTTPS; cookie de sesión con `httpOnly`/`sameSite`: verificado en el despliegue y por el ciclo de sesión de las pruebas. |

**Estado al cierre.** Desplegado y funcional: registro con verificación, login dual, restablecimiento de contraseña, gestión completa de docentes y separación de roles. Los eventos de auditoría ya se registran desde este ciclo (los tipos `auth_login`, `auth_logout`, `teacher_registered`, `teacher_toggled`), aunque su consulta (CU25/CU26) se incorpora en la iteración final. La cuenta Linux del usuario queda encolada (`user_provisioning`) para la iteración del entorno, que es la que sigue del módulo de práctica.
