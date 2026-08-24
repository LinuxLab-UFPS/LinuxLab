## Señales y kill

El nombre de `kill` engaña. El comando no mata procesos, **manda señales** (Shotts, 2026). Que el proceso muera al recibirlas es solo el caso más frecuente.

Una señal es un aviso corto que el sistema entrega a un programa. El programa la recibe y decide qué hacer, y eso es lo que permite que un editor guarde el trabajo pendiente antes de cerrarse en lugar de desaparecer sin más.

Dos señales ya se han usado sin nombrarlas. <kbd>Ctrl</kbd> + <kbd>C</kbd> manda `INT` y <kbd>Ctrl</kbd> + <kbd>Z</kbd> manda `TSTP`. La terminal las traduce y se las entrega al proceso que tenga en primer plano.

## Las señales que se usan

Las más habituales son estas (DevOps Daily, 2025):

| Número | Nombre | Qué pide |
|---|---|---|
| `1` | `HUP` | La terminal se cerró. Muchos servicios la usan para releer su configuración |
| `2` | `INT` | Interrumpir, lo mismo que <kbd>Ctrl</kbd> + <kbd>C</kbd> |
| `9` | `KILL` | Terminar de inmediato, sin negociación |
| `15` | `TERM` | Terminar ordenadamente. Es la que se manda por defecto |
| `18` | `CONT` | Continuar un proceso detenido |
| `19` | `STOP` | Detener el proceso |
| `20` | `TSTP` | Detener, lo mismo que <kbd>Ctrl</kbd> + <kbd>Z</kbd> |

La lista completa se consulta desde la propia terminal:

```bash
kill -l
```

## kill

Recibe el PID del proceso, que se averigua con `ps` del primer tema:

```bash
sleep 300 &
```

```
[1] 38731
```

```bash
kill 38731
```

```
[1]+  Terminated              sleep 300
```

Sin indicar señal, `kill` manda `TERM`. Eso es una petición de cierre ordenado: el programa se entera, cierra lo que tenga abierto y termina.

También acepta el número de trabajo del tema anterior, con el `%` delante:

```bash
kill %1
```

Es más cómodo cuando el proceso se lanzó desde esa misma terminal, porque evita ir a buscar el PID.

## Cuando TERM no basta

Un programa puede ignorar `TERM`. Si está colgado o bloqueado, la petición de cierre no le llega a ninguna parte y el proceso sigue ahí. Para eso está `KILL`, que se pide por su número:

```bash
kill -9 38731
```

`KILL` es distinta de todas las demás. **No se le entrega al programa**, el Kernel termina el proceso directamente. Por eso funciona siempre y por eso es el último recurso: el programa no tiene ocasión de guardar nada ni de cerrar los archivos que tuviera abiertos, y puede dejar datos a medio escribir.

El orden sensato es probar primero lo suave y subir solo si hace falta:

```bash
kill 38731        # TERM, cierre ordenado
kill -9 38731     # KILL, solo si lo anterior no funcionó
```

Cualquier señal se puede pedir por nombre en lugar de por número, que se lee mejor:

```bash
kill -TERM 38731
kill -HUP 38731
```

## Terminar por nombre

Buscar el PID de algo cuyo nombre ya se conoce es un rodeo. `pkill` manda la señal a los procesos que coincidan con un nombre:

```bash
pkill sleep
```

`killall` hace lo mismo, con la diferencia de que exige el nombre completo del comando mientras que `pkill` acepta una coincidencia parcial:

```bash
killall sleep
```

Los dos aceptan la señal igual que `kill`:

```bash
pkill -9 sleep
```

Conviene medir el alcance antes de ejecutarlos, porque actúan sobre **todo lo que coincida**. `pgrep` lo enseña sin mandar nada:

```bash
pgrep -a sleep
```

```
38731 sleep 300
38742 sleep 60
```

Esa lista es exactamente lo que `pkill` iba a alcanzar. Es la misma costumbre del tema de comodines, mirar antes de borrar.

## Solo sobre lo propio

Una cuenta normal solo puede mandar señales a sus propios procesos. Intentarlo con uno ajeno devuelve un error:

```bash
kill 1
```

```
bash: kill: (1) - Operation not permitted
```

Ese `1` es el proceso que arranca el sistema, y no pertenece a la cuenta del laboratorio. Es el mismo criterio de dueño y permisos del tema cinco, aplicado a procesos en lugar de a archivos.

<!-- ACTIVIDAD: foto-del-sistema -->

<!-- ACTIVIDAD: el-turno-de-noche -->

## Resumen

| Comando | Efecto |
|---|---|
| `kill PID` | Manda `TERM`, cierre ordenado |
| `kill %1` | Lo mismo, por número de trabajo |
| `kill -9 PID` | Manda `KILL`, terminación inmediata sin salvaguarda |
| `kill -HUP PID` | Manda una señal concreta por su nombre |
| `kill -l` | Lista todas las señales |
| `pgrep -a nombre` | Enseña qué procesos coinciden, sin tocarlos |
| `pkill nombre` | Manda la señal a los que coincidan |
| `killall nombre` | Igual, exigiendo el nombre exacto |

---

**Fuentes**

- DevOps Daily. (2025). *Process management*. https://devops-daily.com/guides/introduction-to-linux/07-process-management
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
