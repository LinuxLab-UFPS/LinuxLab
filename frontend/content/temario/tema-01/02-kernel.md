<!-- VIDEO: video-arquitectura-linux | Arquitectura de Linux: qué pasa cuando ejecutas un comando -->

## ¿Qué es el kernel?

El kernel es el núcleo del sistema operativo: el software que se ejecuta directamente sobre el hardware y actúa como intermediario entre las aplicaciones y los recursos físicos del computador — procesador, memoria RAM, discos, interfaces de red y periféricos. Cuando ejecutas un comando, abres un archivo o te conectas a internet, es el kernel quien realiza esa operación a nivel de hardware. Las aplicaciones nunca tocan los componentes físicos: siempre pasan por él.

## Funciones principales del kernel

El kernel tiene cinco responsabilidades. Todo lo demás que hace se desprende de estas:

| # | Función | De qué se encarga | Lo ves con |
|---|---|---|---|
| 1 | Gestión de procesos | Crear, planificar y terminar los programas en ejecución | `ps`, `top` |
| 2 | Gestión de memoria | Repartir la RAM entre los procesos y usar swap cuando falta | `free` |
| 3 | Sistema de archivos | Almacenar, organizar y recuperar los datos del disco | `df`, `lsblk` |
| 4 | Gestión de dispositivos | Hablar con el hardware a través de controladores | `lsmod`, `lspci` |
| 5 | Comunicación de red | Implementar TCP/IP y administrar las conexiones | `ip` |

### 1. Gestión de procesos

Un proceso es una instancia de un programa en ejecución, y en un sistema Linux típico hay cientos corriendo a la vez. El kernel decide cuál usa la CPU, cuánto tiempo y en qué orden. Como casi siempre hay más procesos que núcleos disponibles, los alterna en turnos tan rápidos que parecen simultáneos: eso es la **multitarea**, y es lo que ocurre cuando tienes abiertos el navegador, la terminal y el reproductor de música. Cuando dos procesos piden el mismo recurso, el kernel decide quién lo obtiene; si la memoria se agota, puede terminar uno para que el sistema no colapse.

```bash
ps -e --no-headers | wc -l
```

```
243
```

Ese número son los procesos activos en este instante. Con `top` los ves en tiempo real, ordenados por consumo de CPU.

### 2. Gestión de memoria

El kernel asigna bloques de RAM a los procesos que la solicitan y los libera cuando dejan de usarse. Desde dentro, cada proceso cree tener un bloque grande y continuo solo para él; esa ilusión la sostiene el kernel, que reparte bloques físicos más pequeños, comparte memoria entre procesos cuando puede y manda al disco — al espacio de intercambio o **swap** — lo que lleva tiempo sin usarse. El proceso no se entera de nada de eso: solo ve memoria disponible.

```bash
free -h
```

```
               total        used        free      shared  buff/cache   available
Mem:           7,7Gi       2,1Gi       3,4Gi       312Mi       2,2Gi       5,1Gi
Swap:          2,0Gi          0B       2,0Gi
```

### 3. Sistema de archivos

Para el kernel todo es un archivo: los documentos, los directorios, los dispositivos de hardware e incluso los procesos en ejecución se representan dentro de una misma jerarquía. Linux soporta varios sistemas de archivos — ext4 (el más común), XFS, Btrfs, NTFS para compatibilidad con Windows — y expone la misma interfaz para todos. Cuando una aplicación lee un archivo no sabe si está en un SSD, en un disco mecánico o en un recurso compartido de red, ni le hace falta saberlo: el kernel se encarga de las diferencias por debajo, y por eso el mismo programa funciona igual sin importar dónde estén los datos.

```bash
df -h /
```

```
S.ficheros     Tamaño Usados  Disp Uso% Montado en
/dev/sda2         48G    12G   34G  27% /
```

### 4. Gestión de dispositivos

El kernel se comunica con el hardware a través de **controladores** (drivers): cada dispositivo conectado necesita uno que le indique al kernel cómo interactuar con él. Linux incluye controladores para una enorme cantidad de hardware dentro del propio kernel, y por eso la mayoría de dispositivos funcionan sin instalar software adicional.

```bash
lsmod | head -n 4
```

```
Module                  Size  Used by
xhci_pci               24576  0
snd_hda_intel          57344  3
i915                 3403776  9
```

### 5. Comunicación de red

El kernel implementa los protocolos de red — TCP/IP, UDP, ICMP — que permiten al sistema comunicarse con otros computadores, y administra las interfaces, las tablas de enrutamiento, los sockets y las conexiones activas.

```bash
ip -brief address
```

```
lo         UNKNOWN    127.0.0.1/8
enp3s0     UP         192.168.1.42/24
```

## Espacio de kernel vs. espacio de usuario

Linux divide la memoria en dos zonas claramente separadas:

**Espacio de kernel (kernel space):** donde se ejecuta el kernel, con acceso total al hardware y privilegios completos sobre el sistema.

**Espacio de usuario (user space):** donde se ejecutan las aplicaciones. No pueden acceder al hardware por su cuenta: para cualquier operación deben pedírsela al kernel mediante **llamadas al sistema** (system calls).

```
+-------------------------------------+
|           ESPACIO DE USUARIO        |
|        Aplicaciones del usuario     |
|     (bash, firefox, ls, grep...)    |
+-------------------------------------+
|          Llamadas al sistema        |
|     (open, read, write, fork...)    |
+-------------------------------------+
|           ESPACIO DE KERNEL         |
|  Gestión de procesos | Memoria      |
|  Sistema de archivos | Drivers      |
|  Red | Seguridad                    |
+-------------------------------------+
|              HARDWARE               |
|   CPU | RAM | Disco | Red | USB     |
+-------------------------------------+
```

Esa separación es la que mantiene el sistema estable y seguro: si una aplicación falla, no puede corromper el kernel ni arrastrar consigo a los demás procesos.

## Versión del kernel

Para saber qué versión del kernel ejecuta tu sistema:

```bash
uname -r
```

```
6.1.0-18-amd64
```

Cada parte de ese número significa algo:

- `6` — versión principal (major)
- `1` — versión secundaria (minor)
- `0` — revisión (patch)
- `18` — revisión específica de la distribución
- `amd64` — arquitectura del procesador

---

**Fuentes**

- Silberschatz, A., Galvin, P. & Gagne, G. *Operating System Concepts*, 10th Ed. Wiley, 2021.
- Tanenbaum, A. & Bos, H. *Modern Operating Systems*, 5th Ed. Pearson, 2023.
- NDG Linux Essentials. Cisco Networking Academy, 2024.
- The Linux Foundation. *Linux Kernel Development Report*, 2024.
- Linux kernel documentation. kernel.org/doc/html/latest
