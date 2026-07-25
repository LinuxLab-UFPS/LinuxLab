## Variables en Bash

El shell Bash mantiene un conjunto de variables que guardan información usada durante tu sesión: el directorio de inicio, el historial de comandos, la lista de rutas donde buscar programas, y cualquier valor que tú mismo quieras almacenar. Existen dos tipos: locales y de entorno.

## Variables locales

Una variable local existe solo mientras dura la sesión de Bash actual. Cuando cierras la terminal, desaparece. Por convención, los nombres de variables locales se escriben en minúsculas.

Para crear una variable y asignarle un valor, usa el signo igual sin espacios:

```bash
nombre='Juan'
```

Para leer su valor, antepones el signo `$`:

```bash
echo $nombre
```

```
Juan
```

Si la variable no existe, `echo $variable` simplemente no imprime nada. Si ya existe, la expresión de asignación reemplaza su valor anterior.

## Variables de entorno

Las variables de entorno, también llamadas globales, están disponibles en todos los shells abiertos por Bash. El sistema las recrea automáticamente cada vez que abres una terminal nueva. Ejemplos comunes son `HOME`, `PATH` e `HISTSIZE`.

Puedes consultar el valor de cualquiera con `echo`:

```bash
echo $HISTSIZE
```

```
1000
```

Para convertir una variable local en variable de entorno, usas `export`:

```bash
export nombre
```

A partir de ese momento, `nombre` forma parte del entorno. Puedes verificarlo con `env`, que lista todas las variables de entorno. Como la lista es larga, es útil filtrarla con `grep`:

```bash
env | grep nombre
```

```
nombre=Juan
```

También puedes crear y exportar una variable en una sola línea:

```bash
export ciudad='Cúcuta'
```

Para eliminar una variable de entorno, usas `unset`:

```bash
unset ciudad
```

Después de `unset`, la variable deja de existir en el entorno.

## La variable PATH

`PATH` es una de las variables de entorno más importantes. Contiene la lista de directorios donde el shell busca los programas cuando escribes un comando. Cada directorio está separado por dos puntos:

```bash
echo $PATH
```

```
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

Cuando escribes `ls`, el shell recorre esa lista en orden hasta encontrar un archivo ejecutable con ese nombre. Si no lo encuentra en ningún directorio, responde con un error:

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

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 11: "The Environment". linuxcommand.org
