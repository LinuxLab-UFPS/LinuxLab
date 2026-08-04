# SRS — Actividades evaluadas en el entorno real

**Proyecto:** LinuxLab UFPS
**Versión:** 1.0 · 2026-08-04
**Estado:** implementado y funcionando en el subtema "Práctica: crea tu estructura" (tema 3)

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

Cubierto en esta versión:

- Catálogo de cinco aserciones atómicas.
- Evaluación bajo demanda contra el entorno real del estudiante.
- Registro de intentos con puntaje.
- Una práctica de ejemplo en el tema 3, invocada desde el markdown.

Fuera de esta versión (ver §8):

- La interfaz del docente para armar actividades.
- La aserción `comando_imprime`.
- Calificaciones y bitácora.
- Los límites de recursos del contenedor (ver §9, es lo más urgente).

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
| `permisos_son` | `ruta`, `modo` | El modo octal coincide |
| `propietario_es` | `ruta`, `usuario` | El dueño coincide |
| `archivo_contiene` | `ruta`, `patron` | Alguna línea contiene el patrón |

Todas comparten `resolve()`, así que todas heredan las mismas garantías. Añadir
un tipo nuevo es añadir una función al diccionario `CHECKS`.

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

### 7.1 Ejemplo sembrado

`backend/prisma/seed-actividad-directorios.js` crea:

- slug `crear-directorio-practicas`, "Crea tu primer directorio", 100 puntos
- `directorio_existe` en `/home/$usuario/practicas` — 50 pts
- `directorio_existe` en `/home/$usuario/practicas/tema-03` — 50 pts

## 8. Lo que falta

Por orden de dependencia:

1. **Interfaz del docente.** Armar la actividad paso a paso escogiendo del
   catálogo, con el puntaje repartido. El backend ya soporta actividades por
   grupo (`Activity.group_id`); falta el CRUD y la pantalla.
2. **Calificaciones.** Hoy se guarda cada intento, y la lección abre mostrando
   el **último**. Decisión tomada: **la nota debe ser el mejor intento, y la
   tarjeta debe abrir en el mejor.** Como está, un estudiante que aprobó y
   vuelve a comprobar después de que se limpie el entorno ve su tarjeta en rojo
   aunque el intento bueno siga registrado.
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

## 9. Límites de recursos — lo urgente

Esto no es parte de las actividades, pero es lo que puede tumbar el laboratorio.
Estado verificado sobre el camino real de entrada (`sudo su - <usuario>` con
pty):

**Lo que ya funciona:**

| Límite | Valor | Frena |
|---|---|---|
| `ulimit -u` | 512 procesos | fork bombs |
| `ulimit -f` | 15 MB | archivos individuales enormes |
| `ulimit -v` | 256 MB | un proceso que se coma la RAM |
| `TMOUT` | 900 s, readonly | sesiones abiertas para siempre |
| `mem_limit` | 256 MB | el contenedor completo |
| `pkill -u` | al cerrar la terminal | procesos huérfanos |

**Los huecos, en orden de gravedad:**

1. **No hay cuota de disco. Este es el grave.** `ulimit -f` limita el tamaño de
   *un* archivo, no el total. Nada impide crear medio millón de archivos de 1 KB
   y llenar `entorno_home`. Cuando ese volumen se llena no se cae sólo ese
   estudiante: se cae el aprovisionamiento, se caen los homes de todos, y el
   checker empieza a fallar. La imagen ni siquiera trae herramientas de cuota.
   Los otros dos huecos son degradación; éste es caída total.

2. **No hay techo de CPU.** `cpu_shares` sólo reparte cuando hay contención. Un
   `while true` de un estudiante degrada a todo el curso. Falta `cpus:` en el
   compose.

3. **Los `ulimit` viven en `/etc/bash.bashrc`.** Hoy aplican porque el único
   camino de entrada es bash interactivo — está verificado. Pero es frágil: el
   sitio correcto es `/etc/security/limits.conf`, donde los aplica el kernel al
   hacer login sin depender de qué shell arranque. Ahora mismo está vacío.

4. **No hay política `restart:` en ningún servicio del compose.** Si el servidor
   se reinicia, el laboratorio no vuelve solo. `restart: unless-stopped` en
   `backend`, `entorno` y `frontend`.

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
| `frontend/content/temario/tema-03/03-practica-directorios.md` | La práctica |
