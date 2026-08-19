## Variables en Bash

El shell Bash mantiene un conjunto de variables que guardan información usada durante la sesión (NDG, 2024): el directorio de inicio, el historial de comandos, la lista de rutas donde buscar programas, y cualquier valor que se quiera almacenar. Existen dos tipos: locales y de entorno.

## Variables locales

Una variable local existe solo mientras dura la sesión de Bash actual. Cuando cierras la terminal, desaparece. Por convención, los nombres de variables locales se escriben en minúsculas.

Para crear una variable y asignarle un valor, usa el signo igual sin espacios:

```bash
nombre='Juan'
```

Leer su valor requiere dos cosas: un comando que imprima en pantalla y el signo `$` delante del nombre.

`echo` es ese comando. Recibe un texto y lo escribe en la terminal, sin más:

```bash
echo Hola
```

```
Hola
```

El `$` es lo que convierte un nombre en su contenido. Sin él, Bash recibe la palabra tal cual:

```bash
echo nombre
```

```
nombre
```

```bash
echo $nombre
```

```
Juan
```

Esa diferencia entre el nombre y su valor es la que hay que tener clara: `nombre` es la etiqueta, `$nombre` es lo que hay dentro.

Si la variable no existe, `echo $variable` simplemente no imprime nada. Si ya existe, la expresión de asignación reemplaza su valor anterior.

## Variables de entorno

Las variables de entorno, también llamadas globales, están disponibles en todos los shells abiertos por Bash. El sistema las recrea automáticamente en cada terminal nueva. Ejemplos comunes son `HOME`, `PATH` e `HISTSIZE`.

El valor de cualquiera se consulta con `echo`:

```bash
echo $HISTSIZE
```

```
1000
```

Para convertir una variable local en variable de entorno se usa `export` (Free Software Foundation, 2025):

```bash
export nombre
```

A partir de ese momento, `nombre` forma parte del entorno. `env` lo confirma, ya que lista todas las variables de entorno. Como la lista es larga, es útil filtrarla con `grep`:

```bash
env | grep nombre
```

```
nombre=Juan
```

También se puede crear y exportar una variable en una sola línea:

```bash
export ciudad='Cúcuta'
```

Para eliminar una variable de entorno se usa `unset`:

```bash
unset ciudad
```

Después de `unset`, la variable deja de existir en el entorno.

## La variable PATH

`PATH` es una de las variables de entorno más importantes. Contiene la lista de directorios donde el shell busca los programas al ejecutar un comando. Cada directorio está separado por dos puntos:

```bash
echo $PATH
```

```
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

Al ejecutar `ls`, el shell recorre esa lista en orden hasta encontrar un archivo ejecutable con ese nombre. Si no lo encuentra en ningún directorio, responde con un error:

```bash
programa-inexistente
```

```
bash: programa-inexistente: command not found
```

Ese error casi siempre significa una de dos cosas: el programa no está instalado, o está instalado pero en un directorio que no está en `PATH`.

Para añadir un directorio a `PATH`, incluyes el valor actual `$PATH` en la nueva asignación para no perder las rutas existentes:

```bash
PATH=/usr/bin/custom:$PATH
echo $PATH
```

```
/usr/bin/custom:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

El nuevo directorio queda al inicio, por lo que el shell lo revisará primero.

## Resumen

| Comando | Efecto |
|---|---|
| `nombre=valor` | Crea una variable local, sin espacios alrededor del `=` |
| `echo $nombre` | Muestra su contenido |
| `export nombre` | La convierte en variable de entorno |
| `export nombre=valor` | Crea y exporta en una sola línea |
| `env` | Lista todas las variables de entorno |
| `unset nombre` | Elimina la variable |
| `echo $PATH` | Muestra dónde busca el shell los programas |

---

**Fuentes**

- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
