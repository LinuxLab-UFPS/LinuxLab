## Buscar dentro de los archivos

Linux tiene dos comandos de búsqueda y cada uno responde una pregunta distinta (Free Software Foundation, 2025).

| Comando | Pregunta que responde |
|---|---|
| `grep` | ¿En qué líneas aparece este texto? |
| `find` | ¿Dónde está este archivo? |

`grep` abre los archivos y mira lo que hay escrito dentro. `find` no lee el contenido: busca archivos por su nombre, su tamaño o su fecha. Esta lección trata el primero y la lección de `find` trata el segundo.

## Buscar una palabra

`grep` recibe dos cosas: el texto que se busca y el archivo donde buscarlo. Devuelve las líneas que contienen ese texto.

```bash
grep bash /etc/passwd
```

```
root:x:0:0:root:/root:/bin/bash
andres_torres:x:1043:1043::/home/prof_ruiz/grupos/g1/andres_torres:/bin/bash
```

El archivo `/etc/passwd` guarda una línea por cada cuenta del sistema. De las cuarenta que tiene, esas dos son las que mencionan `bash`.

La opción `--color` resalta la parte de la línea que coincidió:

```bash
grep --color bash /etc/passwd
```

Es útil en líneas largas, donde no siempre queda claro por qué salieron.

## Buscar una frase

Cuando lo que se busca lleva espacios hay que encerrarlo entre comillas. Sin ellas la shell parte la frase en varias palabras y `grep` toma la segunda como si fuera el nombre de un archivo.

```bash
grep "sin memoria" bitacora.txt
```

```
14:02 ERROR el proceso murio sin memoria disponible
```

Escrito sin comillas, `grep sin memoria bitacora.txt` buscaría la palabra `sin` dentro de dos archivos llamados `memoria` y `bitacora.txt`, y el primero no existe.

## Contar las coincidencias

La opción `-c` devuelve cuántas líneas coinciden, en lugar de mostrarlas (NDG, 2024).

```bash
grep -c bash /etc/passwd
```

```
2
```

## Ver el número de línea

La opción `-n` antepone el número que ocupa cada línea dentro del archivo. Sirve para volver después al archivo y editar esa línea concreta.

```bash
grep -n bash /etc/passwd
```

```
1:root:x:0:0:root:/root:/bin/bash
43:andres_torres:x:1043:1043::/home/prof_ruiz/grupos/g1/andres_torres:/bin/bash
```

## Ignorar mayúsculas

Por defecto `grep` distingue entre mayúsculas y minúsculas. La opción `-i` hace que no lo haga.

```bash
grep -i error bitacora.txt
```

```
ERROR: disco lleno
error de lectura en el bloque 12
Error corregido
```

## Buscar palabras completas

La opción `-w` exige que el texto encontrado sea una palabra entera, sin letras, dígitos ni guion bajo pegados a los lados.

Sin la opción:

```bash
grep are notas.txt
```

```
Hay tres areas de trabajo.
Beware del fantasma del cuarto.
```

Con la opción:

```bash
grep -w are notas.txt
```

```
Hay tres areas de trabajo.
```

La segunda línea desaparece porque en `Beware` el texto `are` forma parte de otra palabra.

## Invertir la búsqueda

La opción `-v` muestra las líneas que **no** contienen el texto. En `/etc/passwd`, la mayoría de las cuentas son de servicio y llevan `nologin`. Quitarlas deja a la vista las cuentas de personas.

```bash
grep -v nologin /etc/passwd
```

```
root:x:0:0:root:/root:/bin/bash
sync:x:4:65534:sync:/bin:/bin/sync
andres_torres:x:1043:1043::/home/prof_ruiz/grupos/g1/andres_torres:/bin/bash
```

## Buscar en varios archivos

`grep` acepta más de un archivo. Cuando hay varios, antepone el nombre del archivo a cada línea.

```bash
grep -n TODO practica1.txt practica2.txt
```

```
practica1.txt:14:TODO revisar los permisos
practica2.txt:3:TODO falta la conclusion
```

Para buscar en un directorio completo, incluidas sus subcarpetas, se usa `-r`:

```bash
grep -r contrasena ~/actividades
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/notas.txt:contrasena provisional
```

Y si solo interesa saber en qué archivos está el texto, `-l` devuelve los nombres sin las líneas:

```bash
grep -rl contrasena ~/actividades
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/notas.txt
```

## Ver las líneas vecinas

Una línea aislada no siempre explica lo que pasó. Tres opciones muestran las líneas de alrededor:

- `-A n`: las `n` líneas posteriores
- `-B n`: las `n` líneas anteriores
- `-C n`: las `n` líneas de ambos lados

```bash
grep -C 1 'disco lleno' bitacora.txt
```

```
copia iniciada a las 03:00
ERROR: disco lleno
copia cancelada
```

## Filtrar la salida de otro comando

`grep` también trabaja sobre lo que produce otro comando. En ese caso no recibe archivo, porque lee de la entrada que le llega por el pipe.

```bash
ls -l ~/actividades | grep backup
```

```
drwx------ 2 andres_torres grp_cec1648c 4096 Aug 11 18:48 backup
```

Este es el uso más frecuente de `grep` en el trabajo diario: quedarse con la parte que interesa de una salida demasiado larga.

## Resumen

| Comando | Efecto |
|---|---|
| `grep texto archivo` | Muestra las líneas que contienen el texto |
| `grep "una frase" archivo` | Entre comillas cuando el texto lleva espacios |
| `grep -c` | Cuenta las líneas en vez de mostrarlas |
| `grep -n` | Antepone el número de línea |
| `grep -i` | Ignora mayúsculas y minúsculas |
| `grep -w` | Solo palabras completas |
| `grep -v` | Muestra las líneas que no contienen el texto |
| `grep -r ruta` | Busca en un directorio y sus subcarpetas |
| `grep -l` | Muestra solo los nombres de archivo |
| `grep -C 2` | Añade dos líneas de contexto a cada lado |
| `comando \| grep texto` | Filtra la salida de otro comando |

---

**Fuentes**

- Free Software Foundation. (2025). *GNU grep manual* (versión 3.12). https://www.gnu.org/software/grep/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
