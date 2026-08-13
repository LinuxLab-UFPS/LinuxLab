# SRS — Actividades evaluadas en el entorno real

**Proyecto:** LinuxLab UFPS
**Versión:** 2.0 · 2026-08-04
**Estado:** línea base implementada y especificación de ampliación del objetivo 4

---

## 1. Propósito

Hasta ahora la plataforma enseñaba y daba una terminal, pero no comprobaba nada:
el estudiante podía terminar el curso entero sin haber escrito un solo comando.
Este documento describe el mecanismo que cierra ese hueco — el estudiante hace
algo en su terminal, pulsa un botón, y el sistema revisa su entorno Linux real y
le dice qué cumplió y qué no.

El mecanismo se diseñó para que la misma maquinaria sirva a los dos casos:

- las prácticas que vienen escritas en el temario, y
- las actividades que un docente arme para su curso desde la interfaz.

No hay dos caminos. El temario invoca una actividad de la base igual que lo hará
el docente.

## 2. Alcance

Cubierto en la línea base implementada:

- Catálogo de cinco aserciones atómicas.
- Evaluación bajo demanda contra el entorno real del estudiante.
- Registro de intentos con puntaje.
- Dos prácticas en el temario (temas 3 y 4), invocadas desde el markdown.
- La página de catálogo en `/activities`.

Pendiente en la línea base implementada:

- La interfaz del docente para armar actividades.
- La aserción `comando_imprime`.
- Calificaciones y bitácora.
- Los límites de recursos del contenedor (ver §9, es lo más urgente).

La versión 2.0 conserva el vertical implementado y especifica la ampliación
necesaria para completar el objetivo 4 del anteproyecto: creación, configuración,
publicación, resolución, evaluación y seguimiento de actividades dentro de un
grupo de laboratorio.

La ampliación incluye:

- banco de actividades administrado exclusivamente por el administrador;
- actividades propias creadas por docentes dentro de sus grupos;
- asignación de actividades a grupos;
- actividades de tipo taller y quiz;
- modalidades de evaluación automática y manual;
- límite de intentos configurable por actividad;
- política configurable de calificación por mejor o último intento;
- calificación automática y calificación manual;
- retroalimentación automática y escrita por el docente;
- seguimiento de intentos, entregas y calificaciones;
- bitácora de eventos asociados a las actividades.

Quedan fuera del alcance:

- ejecución arbitraria de comandos escritos por docentes;
- contenedores independientes por estudiante o actividad;
- integración con Moodle u otro LMS externo;
- trabajo colaborativo entre estudiantes;
- generación automática de actividades;
- evaluación avanzada de programas C o scripts completos;
- observación y calificación de cada comando en tiempo real.

## 3. Definiciones

| Término | Significado |
|---|---|
| **Aserción atómica** | Una comprobación única y verificable sobre el sistema de archivos: "existe este directorio", "este archivo tiene estos permisos". No evalúa comandos ni salidas, evalúa estado. |
| **Actividad** | Un conjunto ordenado de aserciones con un puntaje repartido entre ellas. |
| **Intento** | Una evaluación completa de una actividad por un estudiante, con su resultado y su puntaje. |
| **Checker** | El programa que ejecuta las aserciones dentro del contenedor. |

## 4. Arquitectura

```
Navegador                Backend                  Contenedor entorno
─────────                ───────                  ──────────────────
ExerciseCheck
  │
  │ POST /api/activities/:slug/check
  ▼
                    activityService.evaluate()
                      · valida sesión
                      · valida matrícula activa
                      · valida cuenta Linux
                      · arma el JSON de aserciones
                         │
                         │ SSH (labadmin)
                         │ sudo -u <estudiante> checker.py
                         │ params por STDIN
                         ▼
                                            checker.py
                                              corre CON LA IDENTIDAD
                                              del estudiante
                                                 │
                         ◄───── JSON de resultados ┘
                      · calcula puntaje
                      · guarda ActivityAttempt
  ◄──── {passed, score, results} ─┘
```

### 4.1 La decisión central: el checker corre como el estudiante

`checker.py` se invoca con `sudo -u <estudiante>`, **nunca como root**. Esto no
es un detalle de implementación, es lo que hace que la aserción signifique algo.
Si corriera como root, "el archivo existe y se puede leer" sería cierto siempre,
y la comprobación no mediría nada. Corriendo como el estudiante, lo que se mide
es exactamente lo que el estudiante puede ver y hacer.

### 4.2 Los parámetros del docente son datos, no comandos

El JSON con las aserciones viaja por **stdin**, no en la línea de comandos. Lo
único que se construye como texto es el nombre de la cuenta, y se valida contra
`/^[a-z_][a-z0-9_-]{0,31}$/` antes de usarlo. Un docente no puede escribir una
ruta que se convierta en un comando.

### 4.3 Toda ruta se ancla al home del estudiante

`resolve()` en `checker.py`:

1. Reemplaza el token `$usuario` por el nombre real de la cuenta.
2. Traduce el home simbólico `/home/<usuario>` al home real, que en realidad
   cuelga del curso: `/home/<docente>/grupos/<grp_curso>/<estudiante>`. El
   docente escribe la ruta fácil, el sistema resuelve la verdadera.
3. Resuelve con `os.path.realpath()` — esto colapsa los `..` y **sigue los
   enlaces simbólicos**.
4. Rechaza el resultado si no cae dentro del home real del estudiante.

El orden importa: se resuelve *antes* de comparar. Un enlace simbólico que
apunte a la carpeta de un compañero se resuelve al destino real y se rechaza ahí.

Casos verificados contra el contenedor:

| Caso | Resultado |
|---|---|
| Directorio propio existente | pasa |
| Enlace simbólico al trabajo de un compañero | "La ruta queda fuera de tu carpeta personal" |
| Ruta con `..` que sale del home | "La ruta queda fuera de tu carpeta personal" |
| Ruta absoluta a otra cuenta | "La ruta queda fuera de tu carpeta personal" |
| Directorio inexistente | "No existe" |
| Directorio existente pero de otro dueño | "Existe, pero no es tuyo" |

### 4.4 Aislamiento de fondo

El checker se apoya en el aislamiento que ya tenía el entorno, no lo reemplaza:
homes en `2750 estudiante:grp_curso`, `/home` en `711`, `hidepid=2`, y un
sudoers acotado para `labadmin`. La entrada del checker en sudoers es una sola
línea y sólo permite ese binario:

```
labadmin ALL=(ALL) NOPASSWD: /usr/local/lib/linuxlab/checker.py
```

> **Nota para quien toque el entorno:** `entrypoint.sh` **reescribe**
> `/etc/sudoers.d/labadmin` en cada arranque. Un cambio hecho sólo en el
> Dockerfile no tiene ningún efecto. Hay que tocar el entrypoint y reconstruir.

### 4.5 Contención

- `TIMEOUT_SECONDS = 10` dentro del checker (`SIGALRM`), por si una aserción se
  cuelga en un bucle de enlaces.
- `EVAL_TIMEOUT_MS = 20000` en el backend, por si el contenedor no responde.
- `MAX_FILE_BYTES = 2 MB` al leer contenido de archivos.

## 5. El catálogo de aserciones

El docente no escribe código: escoge un tipo del catálogo y llena sus campos.

| Tipo | Parámetros | Comprueba |
|---|---|---|
| `directorio_existe` | `ruta` | Existe, es directorio, y es del estudiante |
| `archivo_existe` | `ruta` | Existe, es archivo, y es del estudiante |
| `archivo_no_existe` | `ruta` | Ya no existe en esa ruta |
| `permisos_son` | `ruta`, `modo` | El modo octal coincide |
| `propietario_es` | `ruta`, `usuario` | El dueño coincide |
| `archivo_contiene` | `ruta`, `patron` | Alguna línea contiene el patrón |
| `minimo_lineas` | `ruta`, `cantidad` | Tiene al menos esa cantidad de líneas |
| `archivo_es` | `ruta`, `valor` | El contenido completo coincide |
| `ultima_linea_es` | `ruta`, `valor` | La última línea coincide |

Todas comparten `resolve()`, así que todas heredan las mismas garantías. Añadir
un tipo nuevo es añadir una función al diccionario `CHECKS` del checker y su
entrada en `checkCatalog.js` (backend): la interfaz del docente lo muestra
automáticamente vía `GET /api/activities/catalog`, que sirve los tipos, etiquetas
y campos de la misma fuente que valida la creación.

**Rutas relativas a la carpeta de trabajo.** Cada actividad publicada tiene una
carpeta de trabajo autogenerada (`~/actividades/<workdir>/`, con `workdir`
derivado del título y del id). Las aserciones del docente escriben la `ruta`
**relativa a esa carpeta** (p. ej. `informe.txt`, `carpeta/logo.txt`); el backend
la resuelve contra la carpeta al evaluar. En la creación se rechazan las rutas
absolutas y las que contengan `..`. Las comprobaciones del temario conservan sus
rutas absolutas y se evalúan por slug, sin pasar por esta regla.

**Todas evalúan estado, no comandos.** Es deliberado: al estudiante no le
importa si llegó con `mkdir -p` o con dos `mkdir`, le importa que la estructura
quede bien. Y evaluar estado no requiere ejecutar nada que venga del docente.

## 6. Modelo de datos

```
Activity ──< ActivityCheck
    │
    └──< ActivityAttempt >── User
```

- **`Activity`** — `slug` (único, opcional), `title`, `instructions`,
  `topic_number`, `group_id`, `max_score`. Una actividad con `slug` viene del
  temario; una con `group_id` la creó un docente para su curso.
- **`ActivityCheck`** — `type`, `params` (Json), `points`, `position`.
- **`ActivityAttempt`** — `passed`, `score`, `results` (Json con el detalle de
  cada aserción), `created_at`. Se guarda un registro por cada intento.

Migración: `20260805120000_activities_and_atomic_checks`.

> **Nota:** la tabla de usuarios se llama literalmente `"User"`, con mayúscula —
> es el único modelo sin `@@map`. Cualquier FK hacia ella tiene que escribirse
> así o la migración falla.

## 7. Cómo se invoca desde el temario

En el markdown de la lección:

```markdown
<!-- EJERCICIO: crear-directorio-practicas -->
```

El parser (`lesson-blocks.ts`) lo convierte en un bloque `exercise`, y
`lesson-body.tsx` lo renderiza como `<ExerciseCheck slug="..." />`. El
componente pide la actividad, muestra la lista de lo que se va a revisar, y el
botón dispara la evaluación. Cada aserción se muestra con su resultado y su
detalle, para que el estudiante sepa qué le falta y no tenga que adivinar.

La tarjeta va en ámbar mientras la actividad esté pendiente y pasa a verde al
aprobarla.

### 7.1 Actividades sembradas

`seed-actividad-directorios.js` — slug `crear-directorio-practicas`, tema 3,
100 puntos en 2 aserciones:

- `directorio_existe` en `/home/$usuario/practicas` — 50 pts
- `directorio_existe` en `/home/$usuario/practicas/tema-03` — 50 pts

`seed-actividad-universidad.js` — slug `universidad-facultades`, tema 4,
100 puntos en 7 aserciones. El estudiante arma un árbol de tres facultades con
el pensum de cada una, o sea que combina `mkdir` y `touch`:

- `directorio_existe` en `/home/$usuario/universidad` — 16 pts
- `directorio_existe` en cada facultad (ingenieria, enfermeria, arquitectura) — 14 pts c/u
- `archivo_existe` en el `pensum.txt` de cada facultad — 14 pts c/u

El puntaje se reparte parejo y el sobrante queda en la raíz, que es de la que
cuelga todo lo demás.

### 7.2 La página de actividades

`/activities` lista el catálogo con el mismo patrón que `/simulators`, en ámbar.
El registro de presentación (título, descripción, tema, número de
comprobaciones) vive en `lib/features/shared/activities.ts`, igual que el de
simuladores; lo que cada actividad comprueba sigue viviendo en la base, keyed
por el mismo `slug`. La tarjeta lleva al subtema que contiene el ejercicio.

## 8. Estado de la línea base implementada

Esta sección describe las diferencias entre el vertical funcional existente y la
especificación objetivo de la versión 2.0. El plan de implementación de los
pendientes se deriva de las secciones 11 a 21.

Por orden de dependencia:

1. **Interfaz del docente.** Armar la actividad paso a paso escogiendo del
   catálogo, con el puntaje repartido. El backend ya soporta actividades por
   grupo (`Activity.group_id`); falta el CRUD y la pantalla.
2. **Calificaciones.** Hoy se guarda cada intento, y la lección abre mostrando
   el **último**. En la versión objetivo, el docente configura si la nota final
   usa el mejor intento o el último intento válido. Como está, un estudiante que
   aprobó y vuelve a comprobar después de que se limpie el entorno ve su tarjeta
   en rojo aunque el intento bueno siga registrado.
3. **Bitácora.** Que el docente vea intentos por estudiante y por actividad.
4. **`comando_imprime`.** Se dejó para el final a propósito: es la única
   aserción que ejecuta texto escrito por el docente, así que necesita su propio
   análisis de seguridad. No se implemente sin discutirlo antes.

### 8.1 Sobre la persistencia

Los homes viven en el volumen `entorno_home` y las cuentas en `entorno_etc`.
Sobreviven a `down`, `stop`, `restart` y al reinicio del host. Sólo `down -v`
los borra, y en ese caso el reconciliador recrea las *cuentas* desde la base
pero **los archivos del estudiante no vuelven** — nada en la base los guarda.

Los directorios de un curso se borran cuando el curso se archiva
(`teardownGroup`: `userdel` de cada matriculado, `groupdel`, `rm -rf` de la
carpeta). Los usernames salen de la base, nunca de listar el directorio.

Decisión tomada: **el borrado se queda atado al archivado, sin temporizadores.**
Archivar es una decisión explícita del docente; un cron que borre "cursos
viejos" es el tipo de cosa que un día se lleva un semestre que alguien
necesitaba. Pendiente: guardar un `tar` de los homes antes del `rm -rf`, porque
hoy un reclamo de calificación no tiene nada que mirar.

## 9. Límites de recursos

El servidor de despliegue concede al proyecto **completo**, no a cada estudiante:
1 GB de RAM, 512 procesos, 50% de CPU con prioridad baja y entre 3 y 5 GB de
almacenamiento. Todo lo de esta sección se reparte dentro de ese presupuesto.

Medido en el contenedor: **28 MB en reposo**, **3,3 MB** por sesión de bash y
**6,3 MB** más con vim abierto. Un estudiante trabajando cuesta unos 10 MB y
3 procesos.

**Los límites vigentes:**

| Límite | Valor | Frena |
|---|---|---|
| `mem_limit` del entorno | 512 MB | ~48 estudiantes simultáneos |
| `cpus` del entorno | 0.5 núcleos | un `while true` no degrada al backend/frontend |
| CPU por estudiante (cgroup v2) | 10% de 1 CPU | un estudiante no acapara el laboratorio (fallback: `nice 10`) |
| Cuota de disco por estudiante | 20 MB (`setquota`, host-dependiente) | llenar el disco del curso |
| `MaxSessions` del sshd | 100 | el techo de terminales abiertas |
| `ulimit -u` | 16 procesos | fork bombs y acaparamiento de CPU |
| `ulimit -f` | 15 MB | archivos individuales enormes |
| `ulimit -v` | 256 MB | un proceso que se coma la RAM |
| `TMOUT` | 900 s, readonly | sesiones abiertas para siempre |
| `pkill -u` | al cerrar la terminal | procesos huérfanos |
| `restart: unless-stopped` | backend, entorno, frontend | el laboratorio vuelve solo tras reinicio |

Tres de esos valores tienen una historia que conviene no perder:

- **`ulimit -u` bajó de 512 a 32 y luego a 16.** Los 512 del servidor son del
  proyecto entero, así que con 512 por estudiante uno solo podía agotarlos y
  tumbar también el backend y el frontend. Con 16 sobra para trabajar (bash +
  vim + una tubería o dos) y el fork bomb se queda en su propia sesión con
  menos capacidad de monopolizar la CPU.
- **`MaxSessions` subió de 10 a 100.** Es el valor por defecto de OpenSSH y cada
  terminal abierta ocupa un canal sobre la única conexión SSH del backend. Con
  10, el estudiante once no abría terminal por mucha memoria que sobrara.
- **`mem_limit` del entorno subió de 256 a 512 MB.** Es el único contenedor que
  crece con la gente conectada; los demás consumen lo mismo con uno o con cien.

`TMOUT` es lo que hace que el cupo rinda: quien deja la terminal abierta y se va
libera su sitio a los quince minutos sin tener que cerrar nada.

**La CPU se reparte en tres capas:**

1. **`cpus: 0.5`** capa el contenedor del laboratorio a medio núcleo: el backend
   y el frontend nunca compiten con un estudiante por CPU.
2. **Cgroup v2 por usuario** (10% de 1 CPU cada uno): dentro del laboratorio,
   cada estudiante tiene un techo propio; cinco trabajando a tope usan el 0.5
   completo sin que ninguno le quite al otro. Se activa remontando
   `/sys/fs/cgroup` como rw en el entrypoint (requiere `CAP_SYS_ADMIN`, ya
   presente); si el host no lo permite, se cae grácilmente al Nivel 1.
3. **Nivel 1 (fallback):** `nice -n 10` en cada sesión + `ulimit -u 16`: los
   estudiantes corren a prioridad baja y con pocos procesos, de modo que un
   `while true` degrada solo su propia sesión.

**La cuota de disco** (20 MB por estudiante) la aplica `createStudent` con
`setquota`; el entrypoint intenta habilitar quotas en `/home`. Depende de que
el filesystem del host soporte quotas (`usrquota`); si no, se sigue sin límite
pero el sistema no se rompe.

**Lo que sigue pendiente:**

1. **Los `ulimit` viven en `/etc/bash.bashrc`.** Aplican porque el único camino de
   entrada es bash interactivo, y está verificado. Pero el sitio correcto es
   `/etc/security/limits.conf`, donde los aplica el kernel al hacer login sin
   depender de qué shell arranque.

## 10. Archivos

| Archivo | Qué es |
|---|---|
| `entorno/scripts/checker.py` | El evaluador |
| `entorno/scripts/entrypoint.sh` | Sudoers (autoritativo en runtime) |
| `entorno/Dockerfile` | Instala python3 y copia el checker |
| `backend/prisma/schema.prisma` | Los tres modelos |
| `backend/src/services/activityService.js` | Validaciones y evaluación |
| `backend/src/controllers/activityController.js` | Handlers |
| `backend/src/routes/activities.js` | `GET /:slug`, `POST /:slug/check` |
| `backend/src/services/sshClient.js` | Soporte de stdin |
| `frontend/lib/features/shared/lesson-blocks.ts` | La directiva `EJERCICIO` |
| `frontend/components/shared/lesson-body.tsx` | Renderiza el bloque |
| `frontend/components/student/exercise-check.tsx` | La tarjeta y el botón |
| `frontend/content/temario/tema-03/04-practica-directorios.md` | Práctica del tema 3 |
| `frontend/content/temario/tema-04/02-practica-universidad.md` | Práctica del tema 4 |
| `frontend/lib/features/shared/activities.ts` | Registro del catálogo |
| `frontend/components/student/activity-card.tsx` | La tarjeta ámbar |
| `frontend/app/(protected)/activities/page.tsx` | La página del catálogo |

---

## 11. Especificación objetivo del componente interactivo

Esta sección define el estado objetivo del componente requerido por el objetivo 4.
La implementación actual de las actividades sembradas constituye la línea base
desde la cual se desarrollará esta ampliación.

### 11.1 Actores y responsabilidades

| Actor | Responsabilidades |
|---|---|
| Administrador | Gestionar el banco de actividades, el catálogo de aserciones y la bitácora global. |
| Docente | Gestionar actividades de sus grupos, asignar actividades del banco, crear actividades propias, configurar evaluación y revisar entregas manuales. |
| Estudiante | Consultar actividades asignadas, trabajar en su terminal, solicitar validaciones, realizar entregas y consultar resultados. |

El administrador es el único actor autorizado para crear, editar, activar,
desactivar o eliminar definiciones del banco. Un docente puede utilizar una
actividad del banco sin modificar su definición original y puede crear actividades
propias únicamente dentro de los grupos que administra.

### 11.2 Tipos y modalidades

El sistema debe distinguir dos dimensiones independientes:

| Dimensión | Valores | Significado |
|---|---|---|
| Tipo de actividad | `workshop`, `quiz` | Clasificación pedagógica de la actividad. |
| Modalidad de evaluación | `automatic`, `manual` | Forma en que se obtiene la calificación. |

Un taller o un quiz puede utilizar evaluación automática o manual. El tipo no
determina por sí mismo el número de intentos ni la política de calificación.

### 11.3 Configuración de intentos y calificación

Cada actividad publicada en un grupo debe permitir configurar:

| Configuración | Valores |
|---|---|
| `attempt_limit` | `null` para intentos ilimitados o un entero positivo para un límite definido. |
| `grading_policy` | `best_score` o `latest_score`. |

`best_score` conserva como calificación final la puntuación más alta obtenida en
los intentos válidos. `latest_score` utiliza la calificación del último intento
válido evaluado o calificado.

La configuración se aplica tanto a actividades automáticas como manuales. Debe
quedar bloqueada después del primer intento o entrega para evitar cambios
retroactivos en las condiciones de evaluación. Cualquier modificación excepcional
debe quedar registrada en la bitácora y producir una nueva versión de la actividad.

Todas las calificaciones utilizan una escala de 0 a 100, independientemente de
la modalidad de evaluación.

## 12. Modelo conceptual ampliado

La definición reutilizable de una actividad debe separarse de su publicación en
un grupo. Esta separación evita que modificar una actividad del banco altere las
condiciones o resultados históricos de un grupo.

```text
ActivityDefinition
    └── ActivityCheck[]

ActivityDefinition
    └── GroupActivity[]
             ├── Group
             ├── ActivityAttempt[]
             └── ActivitySubmission[]

User
    ├── ActivityAttempt[]
    └── ActivitySubmission[]
```

### 12.1 ActivityDefinition

Representa la definición de una actividad del banco o una definición propia del
docente antes de ser publicada.

Campos mínimos:

- `id`;
- `slug`, opcional y único para actividades invocadas desde el temario;
- `title`;
- `instructions`;
- `topic_number`;
- `difficulty`, opcional;
- `activity_type`;
- `evaluation_type`;
- `max_score`;
- `source`, con valores `bank` o `teacher`;
- `created_by`, opcional para actividades sembradas;
- `active`;
- `created_at`;
- `updated_at`.

### 12.2 ActivityCheck

Representa una aserción atómica configurada para una definición de actividad.

Campos mínimos:

- `id`;
- `activity_definition_id`;
- `type`;
- `params`;
- `points`;
- `position`.

El total de los puntos de las aserciones debe coincidir con `max_score`. Los
parámetros deben validarse en el backend según el tipo de aserción y nunca deben
interpretarse como comandos ejecutables.

### 12.3 GroupActivity

Representa la instancia de una actividad publicada o configurada para un grupo.

No hay estado borrador: crear una actividad es publicarla. `enabled` la habilita
o deshabilita y `due_at` la cierra.

Campos mínimos:

- `id`;
- `group_id`;
- `activity_definition_id`, cuando proviene del banco o de una definición base;
- `title`;
- `instructions`;
- `activity_type`;
- `evaluation_type`;
- `max_score`;
- `attempt_limit`;
- `grading_policy`;
- `required`;
- `enabled`;
- `due_at`, opcional;
- `workdir`, autogenerado al crear: nombre de la carpeta de trabajo
  (`~/actividades/<workdir>/`) sobre el que se resuelven las rutas relativas de
  las aserciones;
- `created_at`;
- `updated_at`.

La instancia debe conservar la configuración publicada. Si la definición del banco
cambia posteriormente, las actividades ya publicadas no deben cambiar de forma
retroactiva.

### 12.4 ActivityAttempt

Representa cada solicitud de evaluación automática realizada por un estudiante.

Campos mínimos:

- `id`;
- `group_activity_id`;
- `student_id`;
- `attempt_number`;
- `passed`;
- `score`;
- `results`;
- `created_at`.

Todos los intentos deben conservarse. La calificación final se obtiene aplicando
la política configurada en `GroupActivity`.

### 12.5 ActivitySubmission

Representa una entrega de una actividad con evaluación manual.

Campos mínimos:

- `id`;
- `group_activity_id`;
- `student_id`;
- `attempt_number`;
- `status`;
- `content` o referencia a la evidencia entregada;
- `score`, opcional hasta la calificación;
- `feedback`, opcional;
- `graded_by`, opcional;
- `submitted_at`;
- `graded_at`, opcional.

La entrega debe registrar la evidencia disponible en el momento del envío. El
sistema no debe considerar como evidencia histórica el estado mutable posterior
del home del estudiante.

### 12.6 ActivityAuditEvent

Representa un evento auditable relacionado con una actividad.

Campos mínimos:

- `id`;
- `activity_id` o `group_activity_id`;
- `group_id`, opcional;
- `user_id`;
- `event_type`;
- `metadata`;
- `created_at`.

## 13. Estados y reglas de negocio

### 13.1 Estados de una actividad

Crear una actividad es publicarla: no existe estado borrador. Sobre lo
publicado solo se puede habilitar o deshabilitar, y el cierre vence la
actividad:

```text
enabled <-> disabled
      |
      v
    closed   (derivado de due_at)
```

Una actividad en estado `disabled`, `closed` o archivada no acepta nuevos
intentos ni entregas. La consulta histórica debe continuar disponible para los
usuarios autorizados.

### 13.2 Estados de una entrega manual

```text
submitted -> under_review -> graded
                          |
                          v
                       returned
```

### 13.3 Reglas generales

- El estudiante debe tener una matrícula activa en el grupo.
- El docente debe ser propietario del grupo o tener rol de administrador.
- Una actividad vencida no acepta nuevos intentos ni entregas.
- Un límite de intentos se valida en una operación transaccional.
- Un intento fallido también consume un intento cuando existe límite.
- La nota final no elimina ni sobrescribe el historial.
- La política `best_score` selecciona la mayor calificación válida.
- La política `latest_score` selecciona la última calificación válida.
- La política de calificación no puede cambiarse después del primer intento sin generar una nueva versión.
- La nota final se expresa siempre entre 0 y 100.
- Las aserciones desconocidas producen un resultado fallido y no un error ejecutable.
- El estudiante no puede enviar como parámetro su propio `student_id`.
- La identidad del estudiante se obtiene de la sesión autenticada.

## 14. Requerimientos funcionales ampliados

### 14.1 Banco de actividades

| Código | Requerimiento |
|---|---|
| RF-ACT-01 | El sistema debe permitir al administrador crear actividades del banco. |
| RF-ACT-02 | El sistema debe permitir al administrador editar, activar, desactivar y eliminar actividades del banco cuando no existan dependencias históricas que lo impidan. |
| RF-ACT-03 | El sistema debe permitir asociar una actividad del banco con un tema del temario. |
| RF-ACT-04 | El sistema debe permitir configurar las aserciones, posiciones y puntajes de una actividad. |
| RF-ACT-05 | El sistema debe impedir que un docente modifique directamente una actividad del banco. |

### 14.2 Actividades de grupo

| Código | Requerimiento |
|---|---|
| RF-GRP-01 | El sistema debe permitir al docente consultar las actividades disponibles del banco. |
| RF-GRP-02 | El sistema debe permitir al docente asignar una actividad del banco a uno de sus grupos. |
| RF-GRP-03 | El sistema debe permitir al docente crear una actividad propia dentro de uno de sus grupos. |
| RF-GRP-04 | El sistema debe permitir configurar el tipo como taller o quiz. |
| RF-GRP-05 | El sistema debe permitir configurar la modalidad automática o manual. |
| RF-GRP-06 | El sistema debe permitir definir intentos ilimitados o un número máximo de intentos. |
| RF-GRP-07 | El sistema debe permitir seleccionar la política de mejor calificación o último intento. |
| RF-GRP-08 | El sistema debe permitir definir si la actividad es obligatoria. |
| RF-GRP-09 | El sistema debe permitir definir una fecha de cierre. |
| RF-GRP-10 | El sistema debe permitir publicar, habilitar y deshabilitar una actividad. |
| RF-GRP-11 | El sistema debe conservar la configuración publicada aunque cambie la definición del banco. |

### 14.3 Evaluación automática

| Código | Requerimiento |
|---|---|
| RF-AUTO-01 | El sistema debe mostrar al estudiante las instrucciones y criterios de la actividad. |
| RF-AUTO-02 | El sistema debe permitir solicitar una evaluación contra el entorno Linux propio del estudiante. |
| RF-AUTO-03 | El sistema debe ejecutar el checker con la identidad del estudiante y no como root. |
| RF-AUTO-04 | El sistema debe mostrar el resultado individual de cada aserción. |
| RF-AUTO-05 | El sistema debe calcular la calificación sobre 100 puntos. |
| RF-AUTO-06 | El sistema debe registrar cada intento y su resultado completo. |
| RF-AUTO-07 | El sistema debe impedir intentos que superen el límite configurado. |
| RF-AUTO-08 | El sistema debe calcular la nota final según la política configurada. |

### 14.4 Evaluación manual

| Código | Requerimiento |
|---|---|
| RF-MAN-01 | El sistema debe permitir al estudiante enviar una actividad manual. |
| RF-MAN-02 | El sistema debe registrar la evidencia disponible al momento de la entrega. |
| RF-MAN-03 | El sistema debe permitir al docente consultar las entregas pendientes de sus grupos. |
| RF-MAN-04 | El sistema debe permitir al docente asignar una calificación de 0 a 100. |
| RF-MAN-05 | El sistema debe permitir al docente escribir retroalimentación. |
| RF-MAN-06 | El sistema debe permitir consultar entregas y calificaciones históricas. |
| RF-MAN-07 | El sistema debe calcular la nota final según la política de mejor o último intento. |

### 14.5 Consulta y seguimiento

| Código | Requerimiento |
|---|---|
| RF-TRK-01 | El estudiante debe poder consultar el estado de cada actividad. |
| RF-TRK-02 | El estudiante debe poder consultar sus intentos, entregas y calificación final. |
| RF-TRK-03 | El docente debe poder consultar el progreso por estudiante y actividad. |
| RF-TRK-04 | El docente debe poder consultar promedios y actividades pendientes del grupo. |
| RF-TRK-05 | El administrador y el docente autorizado deben poder consultar eventos de actividad según su ámbito. |
| RF-TRK-06 | El sistema debe permitir exportar resultados de actividades según los permisos del usuario. |

## 15. Requerimientos no funcionales ampliados

| Código | Requerimiento |
|---|---|
| RNF-ACT-01 | Todas las operaciones de actividad deben validar autenticación y autorización en el backend. |
| RNF-ACT-02 | Un estudiante no debe poder consultar ni evaluar actividades de grupos en los que no esté matriculado. |
| RNF-ACT-03 | Un docente no debe poder administrar actividades de grupos ajenos. |
| RNF-ACT-04 | Los intentos, entregas y calificaciones históricas deben conservar integridad transaccional. |
| RNF-ACT-05 | Los parámetros de aserciones deben validarse por tipo antes de almacenarse y evaluarse. |
| RNF-ACT-06 | El sistema no debe ejecutar texto arbitrario suministrado por un docente como comando del sistema. |
| RNF-ACT-07 | Una evaluación automática debe finalizar dentro del tiempo máximo configurado para evitar bloquear recursos del entorno. |
| RNF-ACT-08 | Los resultados deben persistir aunque el estudiante cierre la sesión o se desconecte. |
| RNF-ACT-09 | Las acciones de publicación, evaluación, entrega y calificación deben ser auditables. |
| RNF-ACT-10 | La interfaz debe distinguir claramente entre actividad pendiente, en evaluación, enviada, calificada y cerrada. |

## 16. Casos de uso ampliados

| Código | Caso de uso | Actor principal |
|---|---|---|
| CU14 | Administrar banco de actividades | Administrador |
| CU15 | Configurar aserciones de una actividad | Administrador, Docente |
| CU16 | Asignar actividad del banco a un grupo | Docente |
| CU17 | Crear actividad propia del grupo | Docente |
| CU18 | Publicar y configurar actividad | Docente |
| CU19 | Resolver actividad automática | Estudiante |
| CU20 | Enviar actividad manual | Estudiante |
| CU21 | Consultar intentos y calificación | Estudiante |
| CU22 | Revisar y calificar entrega manual | Docente |
| CU23 | Consultar seguimiento del grupo | Docente |
| CU24 | Consultar bitácora de actividades | Administrador, Docente |

## 17. Contratos de API objetivo

### 17.1 Banco

```text
GET    /api/activities/bank
POST   /api/activities/bank
GET    /api/activities/bank/:id
PATCH  /api/activities/bank/:id
DELETE /api/activities/bank/:id
```

Estas rutas deben estar protegidas para el administrador. Las actividades del
temario sembradas deben exponerse como definiciones del banco o como definiciones
del sistema que no puedan ser eliminadas accidentalmente.

### 17.2 Actividades de grupo

```text
GET    /api/groups/:groupId/activities
POST   /api/groups/:groupId/activities
GET    /api/groups/:groupId/activities/:id
PATCH  /api/groups/:groupId/activities/:id
POST   /api/groups/:groupId/activities/:id/publish
POST   /api/groups/:groupId/activities/:id/disable
```

### 17.3 Interacción del estudiante

```text
GET    /api/group-activities/:id
POST   /api/group-activities/:id/check
POST   /api/group-activities/:id/submit
GET    /api/group-activities/:id/attempts
GET    /api/group-activities/:id/submissions
```

### 17.4 Seguimiento y calificación

```text
GET   /api/groups/:groupId/progress
GET   /api/groups/:groupId/activities/:id/submissions
PATCH /api/submissions/:id/grade
GET   /api/groups/:groupId/activity-events
```

Los identificadores de grupo y estudiante deben derivarse y validarse contra la
sesión autenticada. No deben aceptarse como mecanismo de autorización valores
enviados libremente por el cliente.

## 18. Integración con el temario

La directiva actual:

```markdown
<!-- EJERCICIO: slug-de-la-actividad -->
```

identifica una `ActivityDefinition`. Para evaluar correctamente dentro de un
grupo, el frontend debe resolver el `GroupActivity` correspondiente al grupo
activo del estudiante.

La resolución debe cumplir estas reglas:

- el `slug` identifica la definición del temario;
- la actividad debe estar asignada al grupo activo;
- el estudiante debe estar matriculado en ese grupo;
- la evaluación debe ejecutarse sobre el `GroupActivity`;
- un estudiante con varios grupos debe mantener explícito el contexto del grupo.

Mientras el contexto de grupo no esté disponible en la lección, el endpoint actual
por `slug` puede mantenerse únicamente como mecanismo transitorio para las
actividades sembradas.

## 19. Criterios de aceptación

El objetivo 4 se considerará funcionalmente cubierto cuando se verifiquen estos
escenarios:

1. El administrador crea una actividad del banco.
2. El administrador configura sus aserciones y puntajes.
3. El docente consulta el banco sin poder modificarlo.
4. El docente asigna una actividad a su grupo.
5. El docente crea una actividad propia para su grupo.
6. El docente define tipo, modalidad, fecha, obligatoriedad e intentos.
7. El docente selecciona `best_score` o `latest_score`.
8. El estudiante visualiza únicamente actividades de sus grupos.
9. El estudiante solicita una evaluación automática desde su terminal real.
10. El sistema muestra el resultado de cada aserción.
11. El sistema bloquea intentos posteriores al límite configurado.
12. El sistema conserva todos los intentos y calcula la nota final correctamente.
13. El estudiante envía una actividad manual.
14. El docente consulta, califica y retroalimenta la entrega.
15. El estudiante consulta su calificación y retroalimentación.
16. El docente consulta el progreso de su grupo.
17. El sistema registra las acciones relevantes en la bitácora.
18. Un usuario no autorizado no puede consultar, modificar ni evaluar actividades ajenas.

## 20. Trazabilidad del objetivo 4

La implementación debe mantener una relación verificable entre cada requisito y
los artefactos que lo satisfacen:

```text
Requisito
  -> Caso de uso
  -> Modelo de datos
  -> Endpoint
  -> Pantalla
  -> Prueba de aceptación
```

Como mínimo, la matriz de trazabilidad debe cubrir:

| Área | Modelo | Backend | Frontend | Prueba |
|---|---|---|---|---|
| Banco | `ActivityDefinition`, `ActivityCheck` | CRUD administrativo | Página del banco | Crear, editar y desactivar |
| Publicación | `GroupActivity` | Rutas de grupo | Formulario docente | Asignar y publicar |
| Automática | `ActivityAttempt` | Endpoint `check` | Componente de evaluación | Validar y limitar intentos |
| Manual | `ActivitySubmission` | Entrega y calificación | Vista de estudiante y docente | Enviar, calificar y retroalimentar |
| Seguimiento | Intentos y entregas | Rutas de progreso | Panel docente | Consultar resultados |
| Auditoría | `ActivityAuditEvent` | Registro de eventos | Bitácora | Verificar trazabilidad |

## 21. Estado de implementación

| Componente | Estado actual | Estado objetivo |
|---|---|---|
| Modelo de datos | Migrado: `ActivityDefinition` + `GroupActivity` (snapshot de aserciones al publicar) + `ActivitySubmission` + `ActivityAuditEvent`. Intentos con `group_activity_id` (nullable) y `attempt_number`; seeds en `upsert`; FKs `RESTRICT` | Mantener; el borrado de historial solo manual y con confirmación |
| Checker seguro | Implementado | Mantener y ampliar solo con aserciones revisadas |
| Catálogo de aserciones | Servido por `GET /api/activities/catalog` (teacher/admin); una sola fuente en `checkCatalog.js`; la interfaz del docente lo consume | Mantener; cada tipo nuevo = checker + catálogo |
| Actividades sembradas | Implementado, migradas al modelo de definiciones | Publicación por grupo y contexto de grupo en la lección |
| Evaluación automática | Implementación inicial | Integrar grupos, límites y políticas de calificación |
| Banco de actividades | Decisión: predefinido de la plataforma (sin gestión admin/docente). Vista de consulta y endpoint retirados | Mantener como catálogo interno sembrado (seeds) |
| Actividades docentes | Creación, edición (PATCH, bloqueada tras el primer intento) y detalle implementadas. Carpeta de trabajo autogenerada con rutas relativas | Habilitar/deshabilitar, asignar del banco y manual (entregas) |
| Actividades en el catálogo del estudiante | El catálogo `/activities` solo lista las del temario; las de curso viven en la vista `Mi Grupo` (`/mi-grupo`, con nombre, descripción, docente y listado con estado) | — |
| Resolución del estudiante | `GET /api/group-activities/:id` (criterios ocultos) y `POST /:id/check` (checker con rutas resueltas contra la carpeta de trabajo, intentos registrados); panel junto a la terminal con auto-cd | Límites de intentos y modalidad manual |
| Intentos | Registro inicial (numerados) | Límites, mejor/último resultado y seguimiento |
| Evaluación manual | Pendiente | Entregas, calificación y retroalimentación |
| Seguimiento | Interfaz parcial | Datos reales de intentos y entregas |
| Bitácora de actividades | Pendiente | Eventos y consulta autorizada |
| Pruebas | Pendiente | Checker, autorización, flujo completo y regresión |
