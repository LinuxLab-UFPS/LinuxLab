## Expresiones regulares

Hasta ahora `grep` ha buscado texto exacto. Una expresión regular describe una forma en lugar de un texto fijo (NDG, 2024): líneas que empiezan por cierta palabra, que terminan de cierta manera o que contienen un número.

Una expresión regular se escribe siempre entre comillas simples. Sin ellas, el shell interpreta algunos símbolos antes de que `grep` los reciba y la búsqueda deja de ser la que se escribió.

## Un carácter cualquiera

El punto representa un carácter, el que sea (Free Software Foundation, 2025).

```bash
grep 'acta.txt' listado.txt
```

```
acta1txt
acta.txt
```

Salen las dos líneas: en la primera el punto coincide con el `1` y en la segunda consigo mismo. Para buscar un punto literal se escribe `\.`, con barra invertida delante.

```bash
grep 'acta\.txt' listado.txt
```

```
acta.txt
```

## Un carácter de una lista

Los corchetes encierran los caracteres aceptados en esa posición. Vale uno cualquiera de ellos.

```bash
grep 'registro[0-9]' bitacora.txt
```

```
registro3 iniciado
registro7 detenido
```

Formas habituales:

- `[0-9]`: un dígito
- `[a-z]`: una letra minúscula
- `[A-Za-z]`: una letra, mayúscula o minúscula
- `[0-9a-f]`: un dígito o una letra de la `a` a la `f`, que es como se escribe un carácter hexadecimal
- `[^0-9]`: un carácter que no sea un dígito

## El principio y el final de la línea

El acento circunflejo ancla el patrón al principio de la línea y el signo de dólar al final.

```bash
grep '^root' /etc/passwd
```

```
root:x:0:0:root:/root:/bin/bash
```

Sin el ancla también aparecerían las líneas donde `root` está en medio, como las que lo llevan dentro de una ruta. El dólar hace lo mismo por el otro extremo:

```bash
grep 'bash$' /etc/passwd
```

```
root:x:0:0:root:/root:/bin/bash
andres_torres:x:1043:1043::/home/prof_ruiz/grupos/g1/andres_torres:/bin/bash
```

Solo pasan las líneas que terminan en `bash`, que en este archivo son las cuentas que abren sesión con ese shell.

## Repetir el carácter anterior

El asterisco repite el carácter que tiene delante, cero o más veces.

```bash
grep 'ho*la' saludos.txt
```

```
hla
hola
hooola
```

Las tres coinciden: `hla` tiene cero letras `o`, `hola` tiene una y `hooola` tiene tres.

Este asterisco no es el de los nombres de archivo. En `ls *.txt` el asterisco significa "cualquier cosa"; en una expresión regular significa "lo anterior, repetido". El equivalente a "cualquier cosa" se escribe `.*`, que se lee como "un carácter cualquiera, repetido cuantas veces sea".

```bash
grep '^error.*disco' bitacora.txt
```

```
error de lectura en el disco 2
```

La línea empieza por `error`, después viene cualquier texto y más adelante aparece `disco`.

## Expresiones regulares extendidas

Los símbolos anteriores forman las expresiones regulares básicas, que `grep` entiende sin opciones. Existe un juego ampliado que se activa con `-E`:

- `+`: el anterior, una o más veces
- `?`: el anterior, cero o una vez
- `|`: una alternativa u otra
- `( )`: agrupa varios caracteres para aplicarles lo anterior
- `{3}`: el anterior, exactamente tres veces

Buscar dos formas de escribir lo mismo en una sola pasada:

```bash
grep -E 'error|ERROR' bitacora.txt
```

```
error de lectura en el bloque 12
ERROR: disco lleno
```

Buscar un código de cuatro dígitos seguidos:

```bash
grep -E '[0-9]{4}' matriculas.txt
```

```
1152023 Ana Ruiz
1149871 Luis Prada
```

## Resumen

| Símbolo | Coincide con |
|---|---|
| `.` | Cualquier carácter |
| `\.` | Un punto literal |
| `[abc]` | Uno de esos caracteres |
| `[0-9]` | Un dígito |
| `[0-9a-f]` | Un dígito o una letra de la `a` a la `f` |
| `[^0-9]` | Un carácter que no sea un dígito |
| `*` | El anterior, repetido cero o más veces |
| `.*` | Cualquier texto, incluso ninguno |
| `^` | El principio de la línea |
| `$` | El final de la línea |
| `+` `?` `\|` `( )` `{n}` | Solo con `grep -E` |

---

**Fuentes**

- Free Software Foundation. (2025). *GNU grep manual* (versión 3.12). https://www.gnu.org/software/grep/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
