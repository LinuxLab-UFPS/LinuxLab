<!-- VIDEO: video-comodines | Comodines: cuatro naipes para nombrar archivos -->

Aquí verás qué son los comodines y para qué sirven. Lo que viene abajo es la explicación a detalle, con los casos que el video no alcanza a cubrir.

## Nombrar varios archivos a la vez

Un **comodín** es un carácter que no significa lo que dice, sino "cualquier cosa que encaje aquí". Escribes un patrón con uno de ellos dentro, como `*.txt`, y el shell hace lo siguiente antes de ejecutar nada: mira los nombres del directorio, se queda con los que casan con el patrón y **sustituye el patrón por esa lista**. El comando nunca llega a ver el `*`; recibe ya los nombres, uno por uno, como si los hubieras escrito todos a mano (NDG, 2024).

Eso tiene una consecuencia que conviene entender de una vez: los comodines **no son una característica de `ls` ni de `cp`, sino del shell que los invoca**, así que funcionan igual en todos los comandos por igual.

El video reparte los cuatro sobre un directorio de prueba que sigue siendo la mesa de todos los ejemplos de esta lección:

```bash
ls
```

```
datos1.csv  datos2.csv  datos3.csv  foto.png  fotos.png  informe.txt  notas.txt  tareas.txt
```

## El asterisco en otras posiciones

En el video el asterisco cerró el patrón (`*.txt`) y lo abrió (`datos*`). Nada lo obliga a quedarse en un extremo, ni a aparecer una sola vez. El patrón `*o*.png` pide nombres que terminen en `.png` y contengan una `o` en cualquier parte:

```bash
ls *o*.png
```

```
foto.png  fotos.png
```

Ese mismo gesto es el que se usa para operar grupos completos. Un directorio nuevo más un asterisco basta para respaldar los tres CSV sin escribir ningún nombre completo:

```bash
mkdir respaldo
cp datos*.csv respaldo/
```

## Exigir una cantidad exacta de caracteres

La interrogación se puede encadenar para fijar cantidades exactas. `datos?.csv` pide un solo carácter después de `datos`:

```bash
ls datos?.csv
```

```
datos1.csv  datos2.csv  datos3.csv
```

Mientras que `datos??.csv` exigiría dos y no encontraría nada, porque después de `datos` solo hay un carácter antes del punto.

## Un dígito en cualquier parte

Combinado con asteriscos, el rango pregunta por la presencia de cierto tipo de carácter en cualquier parte del nombre. El patrón `*[0-9]*` selecciona todo lo que contenga al menos un dígito:

```bash
ls *[0-9]*
```

```
datos1.csv  datos2.csv  datos3.csv
```

El orden de los rangos es el de la tabla ASCII, así que van de menor a mayor. Un rango invertido como `[3-1]` no da error, simplemente no coincide con nada.

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

Es la misma regla del principio vista desde el otro lado: si no hay nada que sustituir, el patrón viaja intacto hasta el comando.

## Los ocultos no entran

Hay una excepción que conviene conocer antes de fiarse de un patrón. Un comodín no alcanza nunca los archivos ocultos, los que empiezan por punto (Shotts, 2026). En el mismo directorio, esta vez con un `.bashrc` y un `.perfil` dentro:

```bash
echo *
```

```
datos1.csv datos2.csv datos3.csv foto.png fotos.png informe.txt notas.txt tareas.txt
```

Ninguno de los dos aparece, y tampoco los alcanzaría un `rm *`. Para llegar a ellos el patrón tiene que empezar por el punto. Pero ese punto coincide también consigo mismo, así que el patrón `.*` arrastra además `.` y `..`, que son el propio directorio y su superior:

```bash
echo .*
```

```
. .. .bashrc .perfil
```

La forma que no falla combina el punto con la negación ya vista:

```bash
echo .[!.]*
```

Se lee como un punto seguido de algo que no sea otro punto, de modo que `.` y `..` quedan descartados:

```
.bashrc .perfil
```

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
| `*` | Cualquier cantidad de caracteres |
| `?` | Exactamente un carácter |
| `[abc]` | Un carácter, de los de la lista |
| `[a-z]` | Un carácter, dentro del rango |
| `[!abc]` | Un carácter, ninguno de los de la lista |
| `*texto*` | Todo lo que contenga `texto` |
| `.[!.]*` | Los archivos ocultos, que `*` no alcanza |

---

**Fuentes**

- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
