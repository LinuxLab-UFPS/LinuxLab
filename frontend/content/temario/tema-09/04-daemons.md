## Los procesos que nadie ve

Al listar procesos con `ps x` aparecían muchos con un `?` en la columna `TTY`, y quedó pendiente decir qué eran. Son **daemons**, y forman la mayor parte de lo que corre en cualquier máquina Linux.

Un daemon es un proceso que corre en segundo plano y presta un servicio, ya sea vigilando el sistema o atendiendo a otros programas (systemd, 2026). No tiene ventana, no tiene menú y no espera a que nadie teclee nada. En la documentación de administración se les llama indistintamente daemons o **servicios** (Amoany, 2022).

De eso vive un sistema operativo. El programa que atiende las conexiones remotas, el que reparte los trabajos de impresión, el que anota los registros del sistema y el que sincroniza la hora son daemons. Ninguno tiene interfaz y los cuatro hacen falta.

## Por qué no tienen terminal

Un daemon arranca al encender la máquina, antes de que nadie inicie sesión, y sigue trabajando después de que todo el mundo cierre la suya. Una terminal sería una atadura que no puede permitirse, porque desaparecería en cuanto alguien cerrara la ventana.

Por eso `ps` los muestra con `?`. Ese interrogante no es un dato que falte, es la respuesta: **este proceso no depende de ninguna terminal**.

La diferencia con un trabajo en segundo plano de los del subtema anterior es justo esa. Un `comando &` sigue perteneciendo a la terminal donde se lanzó, y al cerrarla se va con ella:

```bash
sleep 300 &
```

Cerrando esa terminal y comprobando desde otra, el proceso ya no está. Un daemon no tiene ese problema porque nunca estuvo atado a ninguna.

Existe una forma de desatar un proceso propio, `nohup`, que lo hace inmune a la señal `HUP` que llega cuando la terminal se cierra:

```bash
nohup comando-largo > salida.txt 2>&1 &
```

Eso no lo convierte en un daemon, pero resuelve el caso práctico de dejar algo corriendo y marcharse.

## De quién descienden

Todos cuelgan del proceso `1`, que en la mayoría de distribuciones actuales es `systemd`. Es el primero que arranca el Kernel y el encargado de poner en marcha el resto de servicios (Shotts, 2026).

```bash
ps -eo pid,ppid,tty,comm | head -3
```

```
    PID    PPID TT       COMMAND
      1       0 ?        systemd
    838       1 ?        dockerd
```

`systemd` tiene `PPID 0` porque no nació de ningún proceso, lo creó el Kernel. Y `dockerd` tiene `PPID 1` porque lo arrancó él.

Esa adopción se puede provocar a mano. Un proceso cuyo padre muere no se queda huérfano, lo recoge el proceso `1`:

```bash
bash -c 'sleep 60 & echo $!'
```

```
50827
```

El `bash` que lo lanzó terminó de inmediato, así que el `sleep` se quedó sin padre. Mirándolo después:

```bash
ps -o pid,ppid,tty,comm -p 50827
```

```
    PID    PPID TT       COMMAND
  50827       1 ?        sleep
```

Cambió de padre al `1` y perdió su terminal. Ahí se ve, en un proceso corriente, la forma que tiene un daemon en `ps`.

## Cómo se llaman

La convención es terminar el nombre en `d`, de *daemon*. Se reconocen a simple vista:

| Nombre | Qué atiende |
|---|---|
| `systemd` | El arranque y el resto de servicios |
| `sshd` | Las conexiones remotas por SSH |
| `crond` | Las tareas programadas |
| `dockerd` | Los contenedores |

No es una regla obligatoria y hay daemons que no la siguen, pero cuando un nombre acaba en `d` casi siempre es uno.

## Mirarlos con systemctl

`ps` los muestra como procesos sueltos. `systemctl` los muestra como servicios, con su estado y su motivo:

```bash
systemctl status docker
```

```
● docker.service - Docker Application Container Engine
     Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; preset: disabled)
     Active: active (running) since Wed 2026-08-19 09:55:00 -04; 12h ago
   Main PID: 838 (dockerd)
```

Ahí está lo que `ps` no dice: si el servicio está activo, desde cuándo, si arranca solo al encender la máquina y qué PID le corresponde. El `enabled` de la segunda línea es lo que responde si el servicio volverá solo tras un reinicio.

La lista completa se pide así:

```bash
systemctl list-units --type=service --state=running
```

```
  UNIT                     LOAD   ACTIVE SUB     DESCRIPTION
  bluetooth.service        loaded active running Bluetooth service
  containerd.service       loaded active running containerd container runtime
  docker.service           loaded active running Docker Application Container Engine
  NetworkManager.service   loaded active running Network Manager
```

Consultar el estado no requiere privilegios. Arrancar, parar o habilitar un servicio sí, y por eso desde la cuenta del laboratorio se pueden mirar pero no tocar.

## Mandarles señales

Un daemon se termina como cualquier otro proceso, pero rara vez es lo que se quiere. Lo habitual es pedirle que relea su configuración sin cortar el servicio, y para eso está la señal `HUP` del subtema anterior:

```bash
sudo kill -HUP 838
```

Muchos daemons están escritos para responder a `HUP` recargándose en lugar de terminar, precisamente porque cortar un servicio para cambiarle una línea de configuración sería desproporcionado.

## Resumen

| Concepto | Qué es |
|---|---|
| Daemon | Proceso en segundo plano que presta un servicio, sin interfaz |
| `?` en `TTY` | El proceso no depende de ninguna terminal |
| `PID 1` | `systemd`, el primero que arranca y del que descienden los demás |
| Nombre acabado en `d` | Convención habitual para nombrarlos |
| `nohup comando &` | Desata un proceso propio de la terminal |
| `systemctl status servicio` | Estado, arranque automático y PID del servicio |
| `systemctl list-units --type=service` | Lista los servicios cargados |
| `kill -HUP PID` | Le pide que relea su configuración sin parar |

---

**Fuentes**

- Amoany, E. (2022, 31 de mayo). *Linux network services: How to start, stop, and check their status*. Red Hat. https://www.redhat.com/en/blog/manage-linux-network-services
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
- systemd. (2026). *daemon(7)* (versión 261). https://www.freedesktop.org/software/systemd/man/latest/daemon.html
