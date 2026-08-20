### 1. Gestión de procesos

Un proceso es una instancia de un programa en ejecución, y en un sistema Linux típico hay cientos corriendo a la vez. El Kernel decide cuál usa la CPU, cuánto tiempo y en qué orden. Como casi siempre hay más procesos que núcleos disponibles, los alterna en turnos tan rápidos que parecen simultáneos. Eso es la **multitarea** (Silberschatz et al., 2021), y es lo que ocurre cuando están abiertos a la vez el navegador, la terminal y el reproductor de música. Cuando dos procesos piden el mismo recurso, el Kernel decide quién lo obtiene; si la memoria se agota, puede terminar uno para que el sistema no colapse.

<!-- ILLUSTRATION: kernel-procesos -->

Cada aplicación abierta consume CPU a ratos, sube cuando trabaja y baja cuando espera. El Kernel es quien reparte esos turnos. El módulo de gestión de procesos vuelve sobre esta misma lista, ya consultada desde la terminal con el consumo real del equipo.

### 2. Gestión de memoria

El Kernel asigna bloques de RAM a los procesos que la solicitan y los libera cuando dejan de usarse. Desde dentro, cada proceso cree tener un bloque grande y continuo solo para él; esa ilusión la sostiene el Kernel (Tanenbaum y Bos, 2023), que reparte bloques físicos más pequeños, comparte memoria entre procesos cuando puede y manda al espacio de intercambio o **swap** lo que lleva tiempo sin usarse. El proceso no se entera de nada de eso, solo ve memoria disponible.

<!-- ILLUSTRATION: kernel-memoria -->

### 3. Sistema de archivos

Para el Kernel todo es un archivo: los documentos, los directorios, los dispositivos de hardware e incluso los procesos en ejecución se representan dentro de una misma jerarquía. Linux soporta varios sistemas de archivos, entre ellos ext4 (el más común), XFS, Btrfs y NTFS para compatibilidad con Windows, y expone la misma interfaz para todos. Cuando una aplicación lee un archivo no sabe si está en un SSD, en un disco mecánico o en un recurso compartido de red, ni le hace falta saberlo, porque el Kernel se encarga de las diferencias por debajo (NDG, 2024), y por eso el mismo programa funciona igual sin importar dónde estén los datos.

<!-- ILLUSTRATION: kernel-archivos -->

### 4. Gestión de dispositivos

El Kernel se comunica con el hardware a través de **controladores** (drivers). Cada dispositivo conectado necesita uno que le indique al Kernel cómo interactuar con él. Linux incluye controladores para una enorme cantidad de hardware dentro del propio Kernel, y por eso la mayoría de dispositivos funcionan sin instalar software adicional.

<!-- ILLUSTRATION: kernel-dispositivos -->

### 5. Comunicación de red

El Kernel implementa los protocolos de red (TCP/IP, UDP, ICMP) que permiten al sistema comunicarse con otros computadores, y administra las interfaces, las tablas de enrutamiento, los sockets y las conexiones activas.

<!-- ILLUSTRATION: kernel-red -->

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Silberschatz, A., Galvin, P. B. y Gagne, G. (2021). *Operating system concepts* (10.ª ed.). Wiley.
- Tanenbaum, A. S. y Bos, H. (2023). *Modern operating systems* (5.ª ed.). Pearson.
