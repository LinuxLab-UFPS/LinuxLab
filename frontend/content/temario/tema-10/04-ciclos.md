## Repetir trabajo

Un script que trata un archivo sirve para un archivo. La razón por la que se automatiza algo es tratar cuarenta sin escribir cuarenta líneas, y de eso se encargan los ciclos.

## for sobre una lista

`for` toma una lista, guarda cada elemento en una variable y repite el bloque una vez por elemento (DevOps Daily, 2025):

```
for nombre in Andrés Laura Carlos; do
    echo "Hola, $nombre"
done
```

```
Hola, Andrés
Hola, Laura
Hola, Carlos
```

La variable, aquí `nombre`, existe solo para el ciclo y va cambiando de valor en cada vuelta.

## for sobre un rango

Con llaves y dos puntos se genera una secuencia de números sin escribirlos:

```
for i in {1..5}; do
    echo "Vuelta $i"
done
```

Es la forma de repetir algo un número fijo de veces.

## for sobre archivos

Aquí es donde el ciclo se vuelve útil de verdad. Un comodín del tema cuatro se expande a la lista de archivos que coinciden, y `for` los recorre uno a uno:

```bash
./procesar.sh
```

```
Procesando informe.txt
Procesando notas.txt
```

Con este cuerpo:

```
for f in *.txt; do
    echo "Procesando $f"
done
```

El shell resuelve el `*.txt` antes de empezar, así que el ciclo recibe los nombres ya expandidos. Y como siempre, `"$f"` va entre comillas por si algún nombre lleva espacios.

## while

`while` no recorre una lista, repite **mientras** una condición se cumpla (Free Software Foundation, 2025). Lleva las mismas comparaciones del tema anterior:

```
c=1
while [ "$c" -le 3 ]; do
    echo "Vuelta $c"
    ((c++))
done
```

```
Vuelta 1
Vuelta 2
Vuelta 3
```

Ese `((c++))` suma uno a la variable, y es la parte que no se puede olvidar: si el contador no cambia, la condición se cumple para siempre y el ciclo no termina nunca.

`until` es su contrario, repite **hasta** que la condición se cumpla, y se usa mucho menos.

## Salir antes o saltar una vuelta

Dos palabras controlan el ciclo desde dentro. `continue` salta a la vuelta siguiente sin terminar la actual, y `break` abandona el ciclo entero:

```
for i in {1..10}; do
    [ "$i" -eq 3 ] && continue
    [ "$i" -eq 6 ] && break
    echo -n "$i "
done
```

```
1 2 4 5 
```

Falta el `3` porque `continue` se lo saltó, y no hay `6` ni nada después porque `break` cortó ahí.

## Mirar antes de borrar

Un ciclo hace lo mismo cuarenta veces, y esa es su gracia y su peligro: un error dentro de un `for` no se equivoca una vez, se equivoca cuarenta.

La costumbre que lo evita ya apareció dos veces en el curso, con `ls` antes de un `rm *` y con `find` antes de un `-delete` (Shotts, 2026). Aquí es la misma: se pone `echo` delante del comando destructivo y se ejecuta el ciclo para leer lo que **iba** a pasar.

```bash
./limpiar.sh
```

```
rm datos.csv
```

Con este cuerpo:

```
for f in *.csv; do
    echo rm "$f"
done
```

No se borró nada: `echo` solo imprimió la orden. Si la lista es la esperada, se quita el `echo` y se ejecuta de verdad.

Conviene saber además que el laboratorio pone un techo. Cada sesión está limitada a **16 procesos**, así que un ciclo desbocado que intente abrir programas sin parar se detiene solo en cuanto llega a ese número, sin llevarse por delante el trabajo de nadie más. El límite es del entorno del curso, no de Linux: en un servidor de verdad ese ciclo seguiría creciendo.

Y lo que ya se sabe del tema cinco sigue valiendo: un script no tiene más alcance que la cuenta que lo ejecuta, así que no puede tocar lo que la cuenta no puede tocar.

## Resumen

| Forma | Efecto |
|---|---|
| `for x in a b c; do … done` | Repite una vez por elemento |
| `for i in {1..5}; do … done` | Repite sobre un rango de números |
| `for f in *.txt; do … done` | Repite sobre los archivos que coincidan |
| `while [ cond ]; do … done` | Repite mientras la condición se cumpla |
| `((c++))` | Suma uno al contador |
| `continue` | Salta a la vuelta siguiente |
| `break` | Sale del ciclo |
| `echo` delante del comando | Enseña lo que iba a hacer, sin hacerlo |

---

**Fuentes**

- DevOps Daily. (2025). *Shell scripting basics*. https://devops-daily.com/guides/introduction-to-linux/09-shell-scripting
- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
