## Ver los procesos

Un **proceso** es un programa en ejecución. No es lo mismo que el programa, que es un archivo quieto en el disco: el proceso es esa copia cargada en memoria y trabajando. Abrir tres terminales crea tres procesos a partir del mismo `bash`.

El Kernel lleva la cuenta de todos, y para distinguirlos le asigna a cada uno un número, el **PID** (*process ID*). Los reparte en orden ascendente y el primero, el que arranca el sistema entero, siempre lleva el `1` (Shotts, 2026).

Cada proceso guarda además el PID del que lo lanzó, su **PPID**. Escribir un comando en la terminal hace que `bash` cree un proceso hijo, así que todo lo que se ejecuta cuelga de algo. De ahí sale un árbol con un único origen.

## ps

`ps` (*process status*) lista procesos. Sin opciones muestra únicamente los de la terminal actual:

```bash
ps
```

```
    PID TTY          TIME CMD
  38729 pts/3    00:00:00 bash
  38730 pts/3    00:00:00 ps
```

Dos, y los dos tienen sentido. `bash` es el shell que está atendiendo la terminal, y `ps` es el propio comando, que existía mientras se ejecutaba.

| Columna | Qué es |
|---|---|
| `PID` | El número del proceso |
| `TTY` | La terminal a la que está atado |
| `TIME` | Tiempo de procesador que ha consumido |
| `CMD` | El comando que lo originó |

El `TIME` en cero no significa que no haya hecho nada. Mide tiempo de CPU, y un programa que espera a que alguien teclee no gasta procesador mientras espera.

### Ver más que la terminal actual

La opción `x` amplía la lista a todos los procesos propios, estén atados a una terminal o no:

```bash
ps x
```

Ahí aparecen muchos con un `?` en la columna `TTY`. Ese interrogante significa que el proceso no tiene terminal asociada. Son los servicios del sistema, que trabajan en segundo plano sin que nadie los mire, y tienen su propio tema al final.

La lista es larga, así que se combina con lo del tema de pipes:

```bash
ps x | wc -l
```

Con `aux` la lista añade la cuenta dueña de cada proceso y sus columnas de consumo:

```bash
ps aux
```

```
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
maurox1+     135  0.0  0.0   4372  3076 ?        S<s  14:08   0:00 bash
maurox1+     136  0.0  0.0   2800  1600 ?        S    14:08   0:00 sleep 300
maurox1+     138  0.0  0.0   7072  3036 ?        R<   14:08   0:00 ps aux
```

En un servidor corriente esa lista traería también los procesos de las demás cuentas, empezando por el `PID 1`. Aquí no: el laboratorio monta `/proc` de forma que cada cuenta solo ve lo suyo, así que `ps aux` devuelve lo mismo que `ps x` más las columnas de consumo. Es la misma barrera que impide leer los archivos de otro estudiante, aplicada a los procesos.

### El estado de un proceso

La columna `STAT` dice qué está haciendo cada uno en ese instante (DevOps Daily, 2025):

| Estado | Significado |
|---|---|
| `R` | Ejecutándose o listo para ejecutarse |
| `S` | Durmiendo, esperando algo, como una tecla o una respuesta de red |
| `D` | Durmiendo sin poder interrumpirse, normalmente esperando al disco |
| `T` | Detenido, pausado |
| `Z` | Zombi, terminado pero con su ficha aún sin recoger por el padre |

Lo normal es ver casi todo en `S`. Un sistema con decenas de procesos no tiene decenas de cosas ocupando el procesador a la vez, tiene decenas esperando.

### Elegir las columnas

`-o` deja pedir exactamente los datos que interesan, en el orden que se quiera:

```bash
ps -o pid,ppid,stat,etime,cmd
```

```
    PID    PPID STAT     ELAPSED CMD
  38729   38727 S<s+       00:00 bash
  38736   38729 S<+        00:00 sleep 60
```

Aquí se ve el parentesco: el `sleep` tiene como `PPID` el `PID` del `bash`, porque nació de él. `etime` es el tiempo transcurrido desde que arrancó, que no es lo mismo que el tiempo de procesador consumido.

Combinado con `--sort` y un pipe, sale la pregunta que más se hace en la práctica, qué se está comiendo la máquina:

```bash
ps -eo pid,cmd,%cpu,%mem --sort=-%cpu | head -5
```

El `-e` significa todos los procesos y el `-` de `--sort=-%cpu` invierte el orden, de mayor a menor.

## top

`ps` da una foto. `top` da la película, porque se refresca solo y ordena por consumo de procesador:

```bash
top
```

Arriba muestra un resumen del sistema y debajo la lista de procesos, encabezada por el que más CPU está gastando. Como es un programa interactivo, se maneja con teclas:

| Tecla | Efecto |
|---|---|
| `q` | Salir |
| `h` | Ayuda |
| `M` | Ordenar por memoria |
| `P` | Ordenar por procesador |
| `u` | Filtrar por cuenta de usuario |
| `k` | Terminar un proceso, pidiendo su PID |

La tecla que más falta hace es la primera. `top` toma la terminal entera y no se sale con <kbd>Ctrl</kbd> + <kbd>C</kbd> como otros comandos, se sale con `q`.

<!-- EJERCICIO: lista-de-procesos -->

## Resumen

| Comando | Efecto |
|---|---|
| `ps` | Los procesos de la terminal actual |
| `ps x` | Todos los procesos propios, con o sin terminal |
| `ps aux` | Los de todas las cuentas, con consumo de CPU y memoria |
| `ps -o pid,ppid,cmd` | Elige qué columnas mostrar |
| `ps -eo pid,cmd,%cpu --sort=-%cpu` | Ordena por consumo de procesador |
| `top` | Lista viva que se refresca sola, se sale con `q` |

---

**Fuentes**

- DevOps Daily. (2025). *Process management*. https://devops-daily.com/guides/introduction-to-linux/07-process-management
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
