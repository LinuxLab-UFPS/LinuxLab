En este punto de tu viaje para ser Ingeniero de Sistemas ya sabes lo que es un directorio, la terminal y un comando. Aquí tienes un vistazo de las diferentes partes de Linux y de cómo interactúan entre sí para procesar el comando `ls -l /home`.

`ls`, como veremos más adelante, sirve para listar los contenidos del directorio actual, cualquier archivo o subdirectorio que haya dentro de este. Puedes probar en tu propia terminal para ver lo que sucede al poner la opción `-l`.

<!-- VIDEO: video-arquitectura-linux | El viaje de un comando -->

## La shell

La shell es el programa que recibe lo que se escribe en la terminal y lo convierte en trabajo. Es la primera parada del comando y hace tres cosas antes de que nada se ejecute.

Primero **lo parte en piezas**. En `ls -l /home` reconoce que `ls` es el programa, que `-l` es una opción que modifica su comportamiento y que `/home` es el argumento sobre el que va a actuar.

Después **resuelve lo que haya que resolver**: si hay un alias definido lo sustituye, si hay una variable la reemplaza por su valor, y si hay comodines los expande a la lista de archivos que corresponda. `ls` es un archivo que vive en algún sitio del disco, y la shell lo localiza recorriendo una lista de directorios conocidos hasta encontrarlo.

No es parte del Kernel ni tiene privilegios especiales. Es un programa corriente, y de hecho se puede cambiar por otro: Bash es la más común en Linux, pero hay varias, y el módulo siguiente entra en ellas.

## Bibliotecas y APIs

Es la pieza menos visible y la que explica cómo se comunican las otras. Un programa no le habla al Kernel directamente: llama a una función de una biblioteca, y es esa biblioteca la que traduce la llamada al formato que el Kernel entiende.

La principal en Linux es la biblioteca estándar de C, **glibc**. Cuando `ls` necesita saber qué hay dentro de `/home`, no puede leer el disco por su cuenta. Llama a una función de glibc, y glibc emite la **llamada al sistema** correspondiente.

Ese es el punto exacto donde una petición deja de ser código corriente y pasa a ser una petición al Kernel. Sin esta capa, cada programa tendría que saber hablarle al Kernel en su propio idioma.

## El Kernel

El Kernel es el núcleo del sistema operativo. Es el software que se ejecuta directamente sobre el hardware y actúa como intermediario entre las aplicaciones y los recursos físicos del computador, desde el procesador y la memoria RAM hasta los discos, las interfaces de red y los periféricos (Silberschatz et al., 2021). Al ejecutar un comando, abrir un archivo o establecer una conexión a internet, es el Kernel quien realiza esa operación a nivel de hardware. Las aplicaciones nunca tocan los componentes físicos, siempre pasan por él (NDG, 2024).

En el recorrido del video, es la parada donde por fin se lee el disco. El Kernel consulta el sistema de archivos, obtiene los nombres que hay dentro de `/home` junto con sus permisos, su tamaño y sus fechas, y devuelve esa información hacia arriba.

Tiene cinco responsabilidades, y todo lo demás que hace se desprende de ellas: gestión de procesos, gestión de memoria, sistema de archivos, gestión de dispositivos y comunicación de red. Cada una se desarrolla en el subtema siguiente.

## El entorno de ventanas

Es la capa que dibuja el escritorio, las ventanas y los menús. Tampoco forma parte del Kernel, y por eso se puede desinstalar sin que el sistema deje de funcionar. Un servidor suele arrancar sin ninguno.

En el video es lo que se ve al principio: el escritorio, el dock y la ventana de la terminal que se abre al pulsar su icono. El cuarto subtema de este módulo lo desarrolla.

## La frontera: espacio de usuario y espacio de Kernel

Linux divide la memoria en dos zonas claramente separadas.

**Espacio de usuario:** donde se ejecutan las aplicaciones, la shell y las bibliotecas. No pueden acceder al hardware por su cuenta. Para cualquier operación deben pedírsela al Kernel mediante **llamadas al sistema** (system calls).

**Espacio de Kernel:** donde se ejecuta el Kernel, con acceso total al hardware y privilegios completos sobre el sistema.

<!-- ILLUSTRATION: kernel-espacios -->

Esa separación es la que mantiene el sistema estable y seguro, porque si una aplicación falla, no puede corromper el Kernel ni arrastrar consigo a los demás procesos.

Cruzar esa frontera no es gratis y por eso no se hace a la ligera: es la línea que el comando atraviesa en el video, y la que atraviesa de vuelta cargando el resultado.

## Y de vuelta

El camino de regreso importa tanto como el de ida. El Kernel devuelve los datos, `ls` les da formato de texto con sus columnas alineadas, y para escribirlos en pantalla vuelve a pedirle permiso al Kernel con otra llamada al sistema. El Kernel los entrega a la terminal, y la terminal los dibuja.

Solo entonces el programa termina, la shell se entera de que su trabajo acabó y vuelve a mostrar el prompt, lista para la siguiente orden.

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Silberschatz, A., Galvin, P. B. y Gagne, G. (2021). *Operating system concepts* (10.ª ed.). Wiley.
