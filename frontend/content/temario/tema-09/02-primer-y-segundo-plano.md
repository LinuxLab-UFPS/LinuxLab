## Primer plano y segundo plano

Al escribir un comando, la terminal se queda esperando a que termine. Hasta que no acaba no vuelve el prompt y no se puede escribir nada más. Eso es ejecutar en **primer plano**, y es lo que ha pasado con todos los comandos vistos hasta ahora, que terminan tan rápido que la espera no se nota.

Con un programa que tarda, la espera sí estorba. Para eso está el **segundo plano**, donde el programa sigue trabajando y el prompt vuelve de inmediato (Shotts, 2026).

## Lanzar en segundo plano con &

Un `&` al final de la línea manda el comando directamente al segundo plano:

```bash
sleep 300 &
```

```
[1] 38731
```

`sleep 300` no hace nada durante trescientos segundos, que es justo lo que se necesita para practicar sin romper nada. El prompt volvió al instante, y la terminal quedó libre.

Esos dos números no son lo mismo:

| Número | Qué es |
|---|---|
| `[1]` | El **número de trabajo**, que cuenta el shell dentro de esta terminal |
| `38731` | El **PID**, que cuenta el Kernel para todo el sistema |

El número de trabajo es pequeño y empieza en uno en cada terminal. El PID es único en la máquina entera. Los dos sirven para referirse al proceso, pero el de trabajo solo lo entiende el shell que lo lanzó.

## jobs

El número de trabajo viene del control de trabajos, que es una función del propio shell (Free Software Foundation, 2025). `jobs` lista los trabajos lanzados desde esta terminal:

```bash
jobs
```

```
[1]+  Running                 sleep 300 &
```

Muestra el número de trabajo, el estado y el comando. El `+` marca el trabajo actual, el que se toma por defecto cuando no se indica ninguno.

`ps` también lo ve, pero de otra manera:

```bash
ps
```

```
    PID TTY          TIME CMD
  38729 pts/3    00:00:00 bash
  38731 pts/3    00:00:00 sleep
  38734 pts/3    00:00:00 ps
```

`jobs` es cosa del shell y solo conoce lo que se lanzó desde esa terminal. `ps` pregunta al sistema. Por eso `jobs` en una terminal recién abierta no devuelve nada aunque haya cientos de procesos corriendo.

## Detener un proceso con Ctrl+Z

Si el programa ya está corriendo en primer plano y no se puso el `&`, no hace falta terminarlo y volver a empezar. <kbd>Ctrl</kbd> + <kbd>Z</kbd> lo detiene y devuelve el prompt:

```bash
sleep 300
```

```
[1]+  Stopped                 sleep 300
```

**Detenido no es lo mismo que terminado.** El proceso sigue existiendo, con su PID y su memoria, pero congelado: no avanza ni consume procesador. `ps` lo muestra con el estado `T` del subtema anterior.

## bg y fg

Desde ahí hay dos salidas.

`bg` (*background*) lo suelta en segundo plano, de modo que continúa trabajando pero sin ocupar la terminal:

```bash
bg
```

```
[1]+ sleep 300 &
```

`fg` (*foreground*) hace lo contrario, lo trae al primer plano y la terminal vuelve a quedarse esperando:

```bash
fg
```

```
sleep 300
```

Con varios trabajos a la vez hay que decir cuál, y para eso se usa el número de trabajo precedido de `%`:

```bash
fg %2
bg %1
```

Sin ese `%2`, ambos comandos actúan sobre el trabajo marcado con `+` en `jobs`.

## Lo que no llega al segundo plano

Un proceso en segundo plano deja de escuchar el teclado de la terminal, y eso incluye <kbd>Ctrl</kbd> + <kbd>C</kbd>. Intentar interrumpirlo así no tiene ningún efecto.

Hay dos formas de resolverlo. Traerlo al primer plano con `fg` y entonces sí interrumpirlo, o terminarlo por su número desde donde esté, que es lo del subtema siguiente.

Lo que sí atraviesa el segundo plano es la salida. Un programa que escriba en pantalla lo seguirá haciendo aunque esté detrás, y sus líneas aparecerán mezcladas con lo que se esté escribiendo. Se evita redirigiendo la salida a un archivo con lo del módulo de manejo de archivos:

```bash
comando-largo > salida.txt 2>&1 &
```

## Resumen

| Comando | Efecto |
|---|---|
| `comando &` | Lo lanza directamente en segundo plano |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Detiene el proceso en primer plano |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> | Interrumpe el proceso en primer plano |
| `jobs` | Lista los trabajos de esta terminal |
| `bg` | Continúa en segundo plano el trabajo detenido |
| `fg` | Trae un trabajo al primer plano |
| `fg %2` | Elige el trabajo número 2 |

---

**Fuentes**

- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
