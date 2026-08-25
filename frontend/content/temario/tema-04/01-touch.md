## Crear archivos

Crear un archivo desde la terminal es cuestión de un comando, y hay varias formas según lo que quieras dejar dentro: vacío, con una línea suelta o con el contenido de otro.

## touch

`touch` (como ya se había visto en el tema anterior) crea un archivo vacío con el nombre que le des:

```bash
touch notas.txt
```

Si el archivo no existía, queda creado con cero bytes, y `ls -l` lo confirma (NDG, 2024):

```bash
ls -l notas.txt
```

```
-rw-r--r-- 1 estudiante estudiante 0 mar 12 11:05 notas.txt
```

Ese `0` es el tamaño. El archivo existe, pero no tiene contenido.

### Varios de una vez

`touch` acepta todos los nombres que quieras:

```bash
touch enero.txt febrero.txt marzo.txt
```

Y con llaves se genera la lista sin escribirla entera. Bash expande `{1..3}` antes de que `touch` la vea (Free Software Foundation, 2025):

```bash
touch practica-{1..3}.txt
```

```bash
ls
```

```
practica-1.txt  practica-2.txt  practica-3.txt
```

### El otro trabajo de touch

El nombre viene de "tocar", y ese es su comportamiento cuando el archivo **ya existe**: no lo borra ni lo modifica, solo actualiza su fecha de modificación a ahora mismo (Free Software Foundation, 2026).

```bash
touch notas.txt
```

Suena a detalle menor, pero hay herramientas, como los compiladores, que deciden qué rehacer mirando esas fechas. Marcar un archivo como recién tocado es la forma de decirles "esto cambió, vuelve a procesarlo".

## cat

Antes de meterle contenido a un archivo conviene saber cómo mirarlo. Para eso está `cat`, que recibe un archivo y vuelca su contenido en la terminal:

```bash
cat notas.txt
```

Sobre un archivo recién creado con `touch` no imprime nada, y con razón: está vacío.

El nombre viene de *concatenate*, porque su trabajo original era pegar archivos uno detrás de otro:

```bash
cat enero.txt febrero.txt
```

Eso muestra primero el contenido de uno y después el del otro, seguidos. Leer un solo archivo es el caso más común, pero es en realidad un efecto secundario de lo que el comando sabe hacer.

`cat` vuelca el archivo completo de una vez, así que sirve para cosas cortas. Con un archivo de miles de líneas la salida desborda la pantalla y solo queda visible el final.

## Crear un archivo con contenido

`touch` deja el archivo vacío. Para escribir algo en él desde el mismo comando, el operador `>` redirige la salida hacia un archivo:

```bash
echo "Sistemas Operativos" > materia.txt
```

```bash
cat materia.txt
```

```
Sistemas Operativos
```

`>` **reemplaza** todo el contenido anterior. Para agregar al final sin borrar lo que había, se usa `>>`:

```bash
echo "Segundo semestre" >> materia.txt
```

```bash
cat materia.txt
```

```
Sistemas Operativos
Segundo semestre
```

Esa diferencia entre `>` y `>>` es una de las que más cuesta al principio, y también una de las que más molesta cuando se confunde: `>` sobre un archivo con trabajo dentro lo deja en blanco.

## Nombres de archivo

Linux distingue mayúsculas de minúsculas: `Notas.txt`, `notas.txt` y `NOTAS.TXT` son tres archivos distintos y pueden convivir en el mismo directorio.

La extensión (`.txt`, `.sh`, `.pdf`) es parte del nombre y nada más. A diferencia de Windows, el sistema no decide qué es un archivo por su extensión sino por su contenido; la extensión está ahí para que las personas se orienten.

El comando `file` lo demuestra, porque mira dentro del archivo en lugar de fiarse del nombre (Shotts, 2026):

```bash
cp notas.txt notas.jpg
file notas.txt notas.jpg
```

```
notas.txt: ASCII text
notas.jpg: ASCII text
```

La copia se llama `.jpg` y sigue siendo texto. Cambiarle la extensión a un archivo no cambia lo que hay dentro.

Los espacios en los nombres funcionan, pero obligan a escribir comillas o a escapar cada espacio, y eso se vuelve molesto rápido:

```bash
touch "mi archivo.txt"
```

Por eso la costumbre en Linux es usar guiones o guiones bajos: `mi-archivo.txt`, `mi_archivo.txt`.

Un nombre que empieza con punto es un archivo oculto: no aparece en `ls` a menos que se use `ls -a` (DevOps Daily, 2025). No es un mecanismo de seguridad, es solo una convención para que la configuración no estorbe al listar una carpeta.

```bash
touch .configuracion
ls
```

```
materia.txt  notas.txt
```

```bash
ls -a
```

```
.  ..  .configuracion  materia.txt  notas.txt
```

<!-- ACTIVIDAD: universidad-facultades -->

## Resumen

| Comando | Efecto |
|---|---|
| `touch archivo` | Crea un archivo vacío, o actualiza su fecha si ya existe |
| `touch a.txt b.txt` | Crea varios de una vez |
| `cat archivo` | Muestra el contenido completo |
| `cat a.txt b.txt` | Muestra un archivo detrás de otro |
| `echo texto > archivo` | Escribe el texto, reemplazando lo que hubiera |
| `echo texto >> archivo` | Añade el texto al final |
| `ls -a` | Muestra también los archivos ocultos |
| `file archivo` | Dice qué contiene de verdad, sin mirar la extensión |

---

**Fuentes**

- DevOps Daily. (2025). *Linux file system hierarchy*. https://devops-daily.com/guides/introduction-to-linux/04-file-system-hierarchy
- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- Free Software Foundation. (2026). *GNU coreutils manual* (versión 9.11). https://www.gnu.org/software/coreutils/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
