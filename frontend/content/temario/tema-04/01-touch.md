## Crear archivos

En Linux casi todo termina siendo un archivo: tus apuntes, la configuración de un programa, un script. Crear uno desde la terminal es cuestión de un comando, y hay varias formas según lo que quieras dejar dentro.

## touch

`touch` (como ya se había visto en el modulo anterior) crea un archivo vacío con el nombre que le des:

```bash
touch notas.txt
```

Si el archivo no existía, queda creado con cero bytes. Puedes comprobarlo con `ls -l`:

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

Y con llaves puedes generar la lista sin escribirla entera. Bash expande `{1..3}` antes de que `touch` la vea:

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

El nombre viene de "tocar", y ese es su comportamiento cuando el archivo **ya existe**: no lo borra ni lo modifica, sólo actualiza su fecha de modificación a ahora mismo.

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

`cat` vuelca el archivo completo de una vez, así que sirve para cosas cortas. Con un archivo de miles de líneas se te va la pantalla de largo y sólo alcanzas a ver el final.

## Crear un archivo con contenido

`touch` deja el archivo vacío. Si quieres meterle algo desde el mismo comando, el operador `>` redirige la salida de un comando hacia un archivo:

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

Los espacios en los nombres funcionan, pero obligan a escribir comillas o a escapar cada espacio, y eso se vuelve molesto rápido:

```bash
touch "mi archivo.txt"
```

Por eso la costumbre en Linux es usar guiones o guiones bajos: `mi-archivo.txt`, `mi_archivo.txt`.

Un nombre que empieza con punto es un archivo oculto: no aparece en `ls` a menos que pidas `ls -a`. No es un mecanismo de seguridad, es sólo una convención para que la configuración no te estorbe cuando listas tu carpeta.

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

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
