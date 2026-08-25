Como ya mencionamos, el Kernel es la pieza que se sienta entre las aplicaciones y el hardware: la shell le pide, las bibliotecas le traducen la petición y él es quien de verdad toca el disco, la memoria y el procesador.

El Kernel que corre hoy en cualquier máquina no es el que Torvalds publicó en 1991. Aquel eran unas diez mil líneas escritas para un solo modelo de procesador; el de ahora pasa de treinta millones y arranca desde un reloj de pulsera hasta una supercomputadora. Lo que no ha cambiado en todo ese camino son sus cinco responsabilidades, que estaban desde el primer día y siguen siendo las mismas.

## 1. Gestión de procesos

Como ya mencionamos, un proceso vendría siendo cada programa en ejecución, y en un sistema Linux típico hay cientos corriendo a la vez. El Kernel decide cuál usa la CPU, cuánto tiempo y en qué orden. Como casi siempre hay más procesos que núcleos disponibles, los alterna en turnos tan rápidos que parecen simultáneos. Eso es la **multitarea** (Silberschatz et al., 2021), y es lo que ocurre cuando están abiertos a la vez el navegador, la terminal y el reproductor de música. Cuando dos procesos piden el mismo recurso, el Kernel decide quién lo obtiene; si la memoria se agota, puede terminar uno para que el sistema no colapse.

<!-- ILLUSTRATION: kernel-procesos -->

Cada aplicación abierta consume CPU a ratos, sube cuando trabaja y baja cuando espera. El Kernel es quien reparte esos turnos.

## 2. Gestión de memoria

La memoria RAM es donde vive todo lo que está abierto en este momento. Las pestañas del navegador, la partida de un juego, el documento a medio escribir: nada de eso está en el disco mientras se usa, está en la RAM, porque es el único sitio lo bastante rápido para que el procesador trabaje. Al cerrar el programa esa memoria se libera y queda para el siguiente.

El Kernel asigna bloques de RAM a los procesos que la solicitan y los libera cuando dejan de usarse. Desde dentro, cada proceso cree tener un bloque grande y continuo solo para él; esa ilusión la sostiene el Kernel (Tanenbaum y Bos, 2023), que reparte bloques físicos más pequeños, comparte memoria entre procesos cuando puede y manda al espacio de intercambio o **swap** lo que lleva tiempo sin usarse. El proceso no se entera de nada de eso, solo ve memoria disponible.

<!-- ILLUSTRATION: kernel-memoria -->

## 3. Sistema de archivos

Para el Kernel todo es un archivo: los documentos, los directorios, los dispositivos de hardware e incluso los procesos en ejecución se representan dentro de una misma jerarquía. Linux soporta varios sistemas de archivos, entre ellos ext4 (el más común), XFS, Btrfs y NTFS para compatibilidad con Windows, y expone la misma interfaz para todos. Cuando una aplicación lee un archivo no sabe si está en un SSD, en un disco mecánico o en un recurso compartido de red, ni le hace falta saberlo, porque el Kernel se encarga de las diferencias por debajo (NDG, 2024), y por eso el mismo programa funciona igual sin importar dónde estén los datos.

<!-- ILLUSTRATION: kernel-archivos -->

## 4. Gestión de dispositivos

El Kernel se comunica con el hardware a través de **controladores** (drivers). Cada dispositivo conectado necesita uno que le indique al Kernel cómo interactuar con él. Linux incluye controladores para una enorme cantidad de hardware dentro del propio Kernel, y por eso la mayoría de dispositivos funcionan sin instalar software adicional.

<!-- ILLUSTRATION: kernel-dispositivos -->

## 5. Comunicación de red

El Kernel implementa los protocolos de red (TCP/IP, UDP, ICMP) que permiten al sistema comunicarse con otros computadores, y administra las interfaces, las tablas de enrutamiento, los sockets y las conexiones activas.

<!-- ILLUSTRATION: kernel-red -->

## Con cuáles trabajarás

Las cinco están siempre funcionando, pero desde la terminal no se tocan por igual. El curso se apoya sobre todo en dos: el **sistema de archivos**, que es donde ocurre casi todo lo que vas a escribir, desde crear un directorio hasta cambiarle los permisos a un archivo; y la **gestión de procesos**, que aparece al final, cuando toque mirar qué está corriendo y cerrar lo que sobra.

Las otras tres se quedan debajo. Se notan cuando fallan, no cuando funcionan, y esa es justamente la señal de que el Kernel está haciendo bien su trabajo.

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Silberschatz, A., Galvin, P. B. y Gagne, G. (2021). *Operating system concepts* (10.ª ed.). Wiley.
- Tanenbaum, A. S. y Bos, H. (2023). *Modern operating systems* (5.ª ed.). Pearson.
