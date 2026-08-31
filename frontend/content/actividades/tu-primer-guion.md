Un script no es más que un archivo con comandos dentro, que el sistema ejecuta de arriba abajo. Este es el más corto que hace algo comprobable.

**Objetivos:**

1. Crea un archivo llamado `saludo.sh` cuya primera línea declare con qué se interpreta el archivo, y que debajo escriba tu código estudiantil dentro de un archivo `salida.txt`.
2. Déjalo con permisos `755`: lectura y ejecución para todos, y escritura solo para ti. Ponlos con el número, no con `+x`, porque `+x` añade la ejecución a lo que ya hubiera y el resultado depende de cómo se creara el archivo.
3. Ejecútalo, de modo que sea el script el que cree `salida.txt`. La última línea de ese archivo tiene que ser tu código estudiantil.

**Hint:**

El punto 3 es el que suele fallar: crear `salida.txt` a mano deja el script sin probar, y escribir el script sin ejecutarlo no crea nada. Hacen falta los dos pasos.

Para que el script pueda ejecutarse desde el directorio actual hay que llamarlo anteponiendo `./` a su nombre, porque el directorio actual no está en la lista de rutas donde el sistema busca programas.
