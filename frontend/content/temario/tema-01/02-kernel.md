<!-- VIDEO: video-arquitectura-linux | Arquitectura de Linux: qué pasa cuando ejecutas un comando -->

## ¿Qué es el kernel?

El kernel es el núcleo del sistema operativo. Es el software que se ejecuta directamente sobre el hardware y actúa como intermediario entre las aplicaciones y los recursos físicos del computador, desde el procesador y la memoria RAM hasta los discos, las interfaces de red y los periféricos (Silberschatz et al., 2021). Al ejecutar un comando, abrir un archivo o establecer una conexión a internet, es el kernel quien realiza esa operación a nivel de hardware. Las aplicaciones nunca tocan los componentes físicos, siempre pasan por él.

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

Un proceso es una instancia de un programa en ejecución, y en un sistema Linux típico hay cientos corriendo a la vez. El kernel decide cuál usa la CPU, cuánto tiempo y en qué orden. Como casi siempre hay más procesos que núcleos disponibles, los alterna en turnos tan rápidos que parecen simultáneos. Eso es la **multitarea** (Silberschatz et al., 2021), y es lo que ocurre cuando están abiertos a la vez el navegador, la terminal y el reproductor de música. Cuando dos procesos piden el mismo recurso, el kernel decide quién lo obtiene; si la memoria se agota, puede terminar uno para que el sistema no colapse.

<!-- ILLUSTRATION: kernel-procesos -->

Cada aplicación abierta consume CPU a ratos, sube cuando trabaja y baja cuando espera. El kernel es quien reparte esos turnos. Más adelante en el curso esta misma lista se puede consultar desde la terminal, con el consumo real del equipo.

### 2. Gestión de memoria

El kernel asigna bloques de RAM a los procesos que la solicitan y los libera cuando dejan de usarse. Desde dentro, cada proceso cree tener un bloque grande y continuo solo para él; esa ilusión la sostiene el kernel (Tanenbaum y Bos, 2023), que reparte bloques físicos más pequeños, comparte memoria entre procesos cuando puede y manda al espacio de intercambio o **swap** lo que lleva tiempo sin usarse. El proceso no se entera de nada de eso, solo ve memoria disponible.

<!-- ILLUSTRATION: kernel-memoria -->

### 3. Sistema de archivos

Para el kernel todo es un archivo: los documentos, los directorios, los dispositivos de hardware e incluso los procesos en ejecución se representan dentro de una misma jerarquía. Linux soporta varios sistemas de archivos, entre ellos ext4 (el más común), XFS, Btrfs y NTFS para compatibilidad con Windows, y expone la misma interfaz para todos. Cuando una aplicación lee un archivo no sabe si está en un SSD, en un disco mecánico o en un recurso compartido de red, ni le hace falta saberlo, porque el kernel se encarga de las diferencias por debajo, y por eso el mismo programa funciona igual sin importar dónde estén los datos.

<!-- ILLUSTRATION: kernel-archivos -->

### 4. Gestión de dispositivos

El kernel se comunica con el hardware a través de **controladores** (drivers). Cada dispositivo conectado necesita uno que le indique al kernel cómo interactuar con él (Tanenbaum y Bos, 2023). Linux incluye controladores para una enorme cantidad de hardware dentro del propio kernel, y por eso la mayoría de dispositivos funcionan sin instalar software adicional.

<!-- ILLUSTRATION: kernel-dispositivos -->

### 5. Comunicación de red

El kernel implementa los protocolos de red (TCP/IP, UDP, ICMP) que permiten al sistema comunicarse con otros computadores, y administra las interfaces, las tablas de enrutamiento, los sockets y las conexiones activas.

<!-- ILLUSTRATION: kernel-red -->

## Espacio de kernel vs. espacio de usuario

Linux divide la memoria en dos zonas claramente separadas:

**Espacio de kernel (kernel space):** donde se ejecuta el kernel, con acceso total al hardware y privilegios completos sobre el sistema.

**Espacio de usuario (user space):** donde se ejecutan las aplicaciones. No pueden acceder al hardware por su cuenta. Para cualquier operación deben pedírsela al kernel mediante **llamadas al sistema** (system calls).

<!-- ILLUSTRATION: kernel-espacios -->

Esa separación es la que mantiene el sistema estable y seguro, porque si una aplicación falla, no puede corromper el kernel ni arrastrar consigo a los demás procesos.

---

**Fuentes**

- Linux Kernel Organization. (s.f.). *The Linux kernel documentation*. https://www.kernel.org/doc/html/latest/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Silberschatz, A., Galvin, P. B. y Gagne, G. (2021). *Operating system concepts* (10.ª ed.). Wiley.
- Tanenbaum, A. S. y Bos, H. (2023). *Modern operating systems* (5.ª ed.). Pearson.
- The Linux Foundation. (2024). *Linux kernel development report*. https://www.linuxfoundation.org/
