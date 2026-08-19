## Nombrar varios archivos a la vez

Escribir los nombres uno a uno deja de ser viable en cuanto hay unos cuantos archivos. Los **comodines** permiten nombrar varios a la vez por su forma, sin escribir ninguno completo (NDG, 2024).

Los ejemplos de esta lección trabajan sobre un directorio con estos archivos:

```bash
ls
```

```
datos1.csv  datos2.csv  datos3.csv  foto.png  fotos.png  informe.txt  notas.txt  tareas.txt
```

## El asterisco

El asterisco `*` sustituye cualquier cantidad de caracteres, incluida ninguna:

```bash
ls *.txt
```

```
informe.txt  notas.txt  tareas.txt
```

Puede ir en cualquier posición del patrón. Al final del patrón selecciona por el comienzo del nombre:

```bash
ls datos*
```

```
datos1.csv  datos2.csv  datos3.csv
```

Y puede aparecer más de una vez en el mismo patrón:

```bash
ls *o*.png
```

```
foto.png  fotos.png
```

## El signo de interrogación

El signo de interrogación `?` sustituye exactamente un carácter. Ni ninguno ni dos:

```bash
ls foto?.png
```

```
fotos.png
```

Con `foto?.png` queda fuera `foto.png`, porque ahí no hay ningún carácter entre `foto` y el punto. Esa es la diferencia con el asterisco, que habría aceptado los dos.

Se pueden encadenar varios para exigir una cantidad exacta de caracteres. `datos?.csv` pide uno solo después de `datos`, mientras que `datos??.csv` pediría dos y no encontraría nada.

## Los corchetes

Los corchetes `[ ]` también sustituyen un solo carácter, pero eligiendo de una lista concreta:

```bash
ls datos[13].csv
```

```
datos1.csv  datos3.csv
```

Dentro de los corchetes se escribe un rango con un guion en lugar de enumerar cada carácter:

```bash
ls datos[1-2].csv
```

```
datos1.csv  datos2.csv
```

Combinado con asteriscos, un rango pregunta por la presencia de cierto tipo de carácter en cualquier parte del nombre. El patrón `*[0-9]*` selecciona todo lo que contenga al menos un dígito:

```bash
ls *[0-9]*
```

```
datos1.csv  datos2.csv  datos3.csv
```

El orden de los rangos es el de la tabla ASCII, así que van de menor a mayor. Un rango invertido como `[3-1]` no da error, simplemente no coincide con nada.

## Negar con !

Un signo de admiración justo después del corchete de apertura invierte la selección y deja pasar todo lo que **no** esté en la lista:

```bash
ls [!df]*
```

```
informe.txt  notas.txt  tareas.txt
```

Quedaron fuera los que empiezan por `d` y por `f`. La negación también admite rangos, de modo que `[!0-9]*` selecciona los nombres que no empiezan por un dígito.

## Quién expande el comodín

Conviene entender quién hace el trabajo, porque **el comodín lo resuelve el shell, no el comando** (Free Software Foundation, 2025). Bash expande el patrón a la lista de nombres que coinciden y entrega esa lista ya resuelta. `echo` lo deja a la vista:

```bash
echo *.png
```

```
foto.png fotos.png
```

El comando `echo` nunca vio un asterisco. Recibió dos nombres de archivo.

De ahí sale lo que ocurre cuando un patrón no coincide con nada. El shell no tiene con qué sustituirlo, así que lo entrega tal cual, con los símbolos incluidos:

```bash
echo datos[3-1].csv
```

```
datos[3-1].csv
```

Y de ahí sale también que los comodines funcionen igual en cualquier comando. No son una característica de `ls` ni de `cp`, sino del shell que los invoca, así que sirven en todos por igual.

## Los ocultos no entran

Hay una excepción que conviene conocer antes de fiarse de un patrón. Un comodín no alcanza nunca los archivos ocultos, los que empiezan por punto (Shotts, 2026). En el mismo directorio, esta vez con un `.bashrc` y un `.perfil` dentro:

```bash
echo *
```

```
datos1.csv datos2.csv datos3.csv foto.png fotos.png informe.txt notas.txt tareas.txt
```

Ninguno de los dos aparece, y tampoco los alcanzaría un `rm *`. Para llegar a ellos el patrón tiene que empezar por el punto:

```bash
echo .*
```

```
.bashrc .perfil
```

En versiones antiguas de Bash ese patrón arrastraba además `.` y `..`, que son el propio directorio y el superior, y el resultado salía mal. La forma que no falla combina el punto con la negación ya vista:

```bash
echo .[!.]*
```

Se lee como un punto seguido de algo que no sea otro punto, de modo que `.` y `..` quedan descartados.

## Comprobar antes de borrar

Ese mismo mecanismo explica el comportamiento con `rm`:

```bash
rm *.png
```

`rm` recibe la lista completa y la borra de una vez. Es la forma habitual de limpiar por extensión, y también la razón por la que conviene comprobar el patrón antes con `ls` o `echo`, porque lo que esos dos muestran es exactamente lo que `rm` va a recibir.

Un patrón demasiado amplio alcanza más de lo previsto. `rm *` borra todo el contenido del directorio, y `rm *.txt` en el directorio equivocado borra los archivos equivocados. Mientras el patrón todavía no sea de fiar, `rm -i` pregunta archivo por archivo.

<!-- ACTIVIDAD: limpieza-con-comodines -->

## Resumen

| Patrón | Coincide con |
|---|---|
| `*` | Cualquier cantidad de caracteres, incluida ninguna |
| `?` | Exactamente un carácter |
| `[abc]` | Un carácter, de los de la lista |
| `[a-z]` | Un carácter, dentro del rango |
| `[!abc]` | Un carácter, ninguno de los de la lista |
| `*.txt` | Todo lo que termine en `.txt` |
| `*[0-9]*` | Todo lo que contenga un dígito |
| `.[!.]*` | Los archivos ocultos, que `*` no alcanza |

---

**Fuentes**

- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
