El tema anterior terminó con el proyecto GNU aportando las piezas que al Kernel le faltaban para ser un sistema usable. Una de las más importantes es la **shell**, el programa que recibe lo que se escribe en la terminal y lo convierte en trabajo. Es la que manda a ejecutar tus instrucciones.

Pero la shell no trabaja sola. Entre lo que se teclea y el disco que responde hay varias capas, cada una con un oficio distinto. Aquí las verás una por una y luego, ya con los nombres puestos, seguirás el recorrido completo del comando `ls -l /home`.

`ls`, como veremos más adelante, sirve para listar los contenidos de un directorio: cualquier archivo o subdirectorio que haya dentro de este. Puedes probar en tu propia terminal para ver lo que sucede al poner la opción `-l`.

## La terminal

Es la ventana donde se escribe. Su único oficio es dibujar texto: recoge las teclas que se pulsan, se las entrega a la shell y luego pinta en pantalla lo que le devuelvan. No entiende ni un solo comando.

Suena a poco y es exactamente el punto. La terminal es el papel, no quien escribe, y por eso el mismo comando funciona igual en la ventana de un escritorio, en una sesión de texto sin gráficos o en la terminal de esta plataforma.

## La shell

Es la primera parada del comando y hace tres cosas antes de que nada se ejecute.

Primero **lo parte en piezas**. En `ls -l /home` reconoce que `ls` es el programa, que `-l` es una opción que modifica su comportamiento y que `/home` es el argumento sobre el que va a actuar.

Después **resuelve lo que haya que resolver**: si hay un alias definido lo sustituye, si hay una variable la reemplaza por su valor, y si hay comodines los expande a la lista de archivos que corresponda. `ls` es un archivo que vive en algún sitio del disco, y la shell lo localiza recorriendo una lista de directorios conocidos hasta encontrarlo.

No es parte del Kernel ni tiene privilegios especiales. Es un programa corriente, y de hecho se puede cambiar por otro: Bash es la más común en Linux, pero hay varias, y el tema de la terminal entra en ellas.

## Bibliotecas y APIs

Es la pieza menos visible y la que explica cómo se comunican las otras. Un programa no le habla al Kernel directamente: llama a una función de una biblioteca, y es esa biblioteca la que traduce la llamada al formato que el Kernel entiende.

La principal en Linux es la biblioteca estándar de C, **glibc**. Cuando `ls` necesita saber qué hay dentro de `/home`, no puede leer el disco por su cuenta. Llama a una función de glibc, y glibc emite la **llamada al sistema** correspondiente.

Ese es el punto exacto donde una petición deja de ser código corriente y pasa a ser una petición al Kernel. Sin esta capa, cada programa tendría que saber hablarle al Kernel en su propio idioma.

## El Kernel

El Kernel es el núcleo del sistema operativo. Es el software que se ejecuta directamente sobre el hardware y actúa como intermediario entre las aplicaciones y los recursos físicos del computador, desde el procesador y la memoria RAM hasta los discos, las interfaces de red y los periféricos (Silberschatz et al., 2021). Al ejecutar un comando, abrir un archivo o establecer una conexión a internet, es el Kernel quien realiza esa operación a nivel de hardware. Las aplicaciones nunca tocan los componentes físicos, siempre pasan por él (NDG, 2024).

Es la parada donde por fin se lee el disco. El Kernel consulta el sistema de archivos, obtiene los nombres que hay dentro de `/home` junto con sus permisos, su tamaño y sus fechas, y devuelve esa información hacia arriba.

Tiene cinco responsabilidades, y todo lo demás que hace se desprende de ellas: gestión de procesos, gestión de memoria, sistema de archivos, gestión de dispositivos y comunicación de red. Cada una se desarrolla en el tema siguiente.

## El entorno de ventanas

Es la capa que dibuja el escritorio, las ventanas y los menús. Tampoco forma parte del Kernel, y por eso se puede desinstalar sin que el sistema deje de funcionar. Un servidor suele arrancar sin ninguno.

Es lo que se ve antes de que empiece nada: el escritorio, el dock y el icono desde el que se abre la terminal. El cuarto tema lo desarrolla.

## La frontera: espacio de usuario y espacio de Kernel

Linux divide la memoria en dos zonas claramente separadas.

**Espacio de usuario:** donde se ejecutan las aplicaciones, la shell y las bibliotecas. No pueden acceder al hardware por su cuenta. Para cualquier operación deben pedírsela al Kernel mediante **llamadas al sistema** (system calls).

**Espacio de Kernel:** donde se ejecuta el Kernel, con acceso total al hardware y privilegios completos sobre el sistema.

<!-- ILLUSTRATION: kernel-espacios -->

Esa separación es la que mantiene el sistema estable y seguro, porque si una aplicación falla, no puede corromper el Kernel ni arrastrar consigo a los demás procesos.

Cruzar esa frontera no es gratis y por eso no se hace a la ligera: es la línea que el comando atraviesa a la ida, y la que atraviesa de vuelta cargando el resultado.

## El recorrido completo

Ya están todas las piezas con su nombre. Ahora veamos a qué responde cada una cuando ejecutas un comando, de principio a fin.

<!-- VIDEO: video-arquitectura-linux | El viaje de un comando -->

El camino de regreso importa tanto como el de ida. El Kernel devuelve los datos, `ls` les da formato de texto con sus columnas alineadas, y para escribirlos en pantalla vuelve a pedirle permiso al Kernel con otra llamada al sistema. El Kernel los entrega a la terminal, y la terminal los dibuja.

Solo entonces el programa termina, la shell se entera de que su trabajo acabó y vuelve a mostrar el prompt, lista para la siguiente orden.

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Silberschatz, A., Galvin, P. B. y Gagne, G. (2021). *Operating system concepts* (10.ª ed.). Wiley.
