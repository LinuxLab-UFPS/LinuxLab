<!-- VIDEO: video-arquitectura-linux | Arquitectura de Linux: qué pasa cuando ejecutas un comando -->

## ¿Qué es el kernel?

El kernel es el núcleo del sistema operativo: el software que se ejecuta directamente sobre el hardware y actúa como intermediario entre las aplicaciones y los recursos físicos del computador: procesador, memoria RAM, discos, interfaces de red y periféricos. Cuando ejecutas un comando, abres un archivo o te conectas a internet, es el kernel quien realiza esa operación a nivel de hardware. Las aplicaciones nunca tocan los componentes físicos: siempre pasan por él.

## Funciones principales del kernel

El kernel tiene cinco responsabilidades. Todo lo demás que hace se desprende de estas:

| # | Función | De qué se encarga |
|---|---|---|
| 1 | Gestión de procesos | Crear, planificar y terminar los programas en ejecución |
| 2 | Gestión de memoria | Repartir la RAM entre los procesos y usar el disco cuando falta |
| 3 | Sistema de archivos | Almacenar, organizar y recuperar los datos del disco |
| 4 | Gestión de dispositivos | Hablar con el hardware a través de controladores |
| 5 | Comunicación de red | Implementar TCP/IP y administrar las conexiones |

### 1. Gestión de procesos

Un proceso es una instancia de un programa en ejecución, y en un sistema Linux típico hay cientos corriendo a la vez. El kernel decide cuál usa la CPU, cuánto tiempo y en qué orden. Como casi siempre hay más procesos que núcleos disponibles, los alterna en turnos tan rápidos que parecen simultáneos: eso es la **multitarea**, y es lo que ocurre cuando tienes abiertos el navegador, la terminal y el reproductor de música. Cuando dos procesos piden el mismo recurso, el kernel decide quién lo obtiene; si la memoria se agota, puede terminar uno para que el sistema no colapse.

<!-- ILLUSTRATION: kernel-procesos -->

Cada aplicación abierta consume CPU a ratos: sube cuando trabaja y baja cuando espera. El kernel es quien reparte esos turnos, y más adelante en el curso vas a poder ver esta misma lista desde la terminal, con el consumo real de tu equipo.

### 2. Gestión de memoria

El kernel asigna bloques de RAM a los procesos que la solicitan y los libera cuando dejan de usarse. Desde dentro, cada proceso cree tener un bloque grande y continuo solo para él; esa ilusión la sostiene el kernel, que reparte bloques físicos más pequeños, comparte memoria entre procesos cuando puede y manda al espacio de intercambio o **swap** lo que lleva tiempo sin usarse. El proceso no se entera de nada de eso: solo ve memoria disponible.

<!-- ILLUSTRATION: kernel-memoria -->

### 3. Sistema de archivos

Para el kernel todo es un archivo: los documentos, los directorios, los dispositivos de hardware e incluso los procesos en ejecución se representan dentro de una misma jerarquía. Linux soporta varios sistemas de archivos, entre ellos ext4 (el más común), XFS, Btrfs y NTFS para compatibilidad con Windows, y expone la misma interfaz para todos. Cuando una aplicación lee un archivo no sabe si está en un SSD, en un disco mecánico o en un recurso compartido de red, ni le hace falta saberlo: el kernel se encarga de las diferencias por debajo, y por eso el mismo programa funciona igual sin importar dónde estén los datos.

<!-- ILLUSTRATION: kernel-archivos -->

### 4. Gestión de dispositivos

El kernel se comunica con el hardware a través de **controladores** (drivers): cada dispositivo conectado necesita uno que le indique al kernel cómo interactuar con él. Linux incluye controladores para una enorme cantidad de hardware dentro del propio kernel, y por eso la mayoría de dispositivos funcionan sin instalar software adicional.

<!-- ILLUSTRATION: kernel-dispositivos -->

### 5. Comunicación de red

El kernel implementa los protocolos de red (TCP/IP, UDP, ICMP) que permiten al sistema comunicarse con otros computadores, y administra las interfaces, las tablas de enrutamiento, los sockets y las conexiones activas.

<!-- ILLUSTRATION: kernel-red -->

## Espacio de kernel vs. espacio de usuario

Linux divide la memoria en dos zonas claramente separadas:

**Espacio de kernel (kernel space):** donde se ejecuta el kernel, con acceso total al hardware y privilegios completos sobre el sistema.

**Espacio de usuario (user space):** donde se ejecutan las aplicaciones. No pueden acceder al hardware por su cuenta: para cualquier operación deben pedírsela al kernel mediante **llamadas al sistema** (system calls).

<!-- ILLUSTRATION: kernel-espacios -->

Esa separación es la que mantiene el sistema estable y seguro: si una aplicación falla, no puede corromper el kernel ni arrastrar consigo a los demás procesos.

---

**Fuentes**

- Silberschatz, A., Galvin, P. & Gagne, G. *Operating System Concepts*, 10th Ed. Wiley, 2021.
- Tanenbaum, A. & Bos, H. *Modern Operating Systems*, 5th Ed. Pearson, 2023.
- NDG Linux Essentials. Cisco Networking Academy, 2024.
- The Linux Foundation. *Linux Kernel Development Report*, 2024.
- Linux kernel documentation. kernel.org/doc/html/latest
