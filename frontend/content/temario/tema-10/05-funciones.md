## Funciones y un script completo

Cuando el mismo bloque de comandos aparece tres veces en un script, conviene ponerle nombre. Una función es eso: un trozo de script guardado bajo un nombre para poder llamarlo desde varios sitios.

## Definir y llamar

Se declara con el nombre, unos paréntesis vacíos y las llaves con el cuerpo dentro (Shotts, 2026):

```
saludar() {
    echo "Hola, $1"
}

saludar "Andrés"
saludar "Laura"
```

```
Hola, Andrés
Hola, Laura
```

Los argumentos funcionan como en el script entero: dentro de la función, `$1` es lo primero que se le pasó al llamarla, no lo primero que recibió el script. Es la misma idea aplicada un nivel más abajo.

La función tiene que estar definida **antes** de la línea que la llama, así que lo habitual es ponerlas todas arriba y dejar las llamadas al final.

## Devolver un dato

Una función devuelve texto imprimiéndolo, y quien la llama lo recoge con `$( )`, igual que con cualquier otro comando:

```
contar_lineas() {
    wc -l < "$1"
}

n=$(contar_lineas notas.txt)
echo "notas.txt tiene $n líneas"
```

```
notas.txt tiene 3 líneas
```

`return` existe, pero no sirve para esto: devuelve un código de salida, no un valor. Se usa para decir si la función terminó bien o mal, no para entregar datos.

## Variables dentro y fuera

Una variable creada dentro de una función es visible en todo el script, y modificarla ahí dentro la cambia también fuera (DevOps Daily, 2025). `local` la limita a la función:

```
ambito() {
    global="cambiada"
    local propia="solo aquí"
}

global="original"
ambito
echo "global ahora: $global"
echo "propia fuera: '$propia'"
```

```
global ahora: cambiada
propia fuera: ''
```

La segunda salió vacía porque `propia` dejó de existir al terminar la función. Conviene declarar `local` todo lo que sea de uso interno: evita que dos funciones se pisen una variable sin querer.

## El código de salida

Ya apareció con `exit 1` al comprobar los argumentos. La variable `$?` guarda el código del último comando ejecutado, y sirve para reaccionar a un fallo:

```bash
ls carpeta-que-no-existe
echo "código: $?"
```

```
ls: cannot access 'carpeta-que-no-existe': No such file or directory
código: 2
```

Cero significa que todo fue bien y cualquier otro número señala un problema (Free Software Foundation, 2025). Un script que va a usar otro script debe terminar con el código correcto, porque es lo único que el de fuera puede consultar.

Hay dos herramientas más que se ven en scripts de administración y que conviene reconocer aunque no se usen aquí: `set -e` al principio hace que el script se detenga en cuanto un comando falle, y `trap` permite ejecutar una limpieza cuando el script recibe una señal de las del módulo nueve.

## Un script que junta todo

Este cuenta las líneas de los archivos `.txt` de un directorio. Usa argumentos, dos comprobaciones, una función y un ciclo:

```
#!/bin/bash
# Cuenta las lineas de los .txt de un directorio.

if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <directorio>"
    exit 1
fi

carpeta="$1"

if [ ! -d "$carpeta" ]; then
    echo "No existe el directorio: $carpeta"
    exit 1
fi

contar() {
    wc -l < "$1"
}

total=0
for f in "$carpeta"/*.txt; do
    [ -e "$f" ] || continue
    n=$(contar "$f")
    echo "$(basename "$f"): $n líneas"
    total=$((total + n))
done

echo "Total: $total líneas"
```

Se comporta distinto según lo que reciba. Sin argumentos:

```bash
./resumen.sh
```

```
Uso: ./resumen.sh <directorio>
```

Con un directorio que no existe:

```bash
./resumen.sh fantasma
```

```
No existe el directorio: fantasma
```

Y con uno que sí:

```bash
./resumen.sh apuntes
```

```
informe.txt: 2 líneas
notas.txt: 3 líneas
Total: 5 líneas
```

Dos detalles del cuerpo que merecen atención. El `[ -e "$f" ] || continue` está ahí porque un comodín que no encuentra nada se queda tal cual, así que sin esa línea el ciclo intentaría contar un archivo llamado literalmente `*.txt`. Y `$((total + n))` es aritmética: los dobles paréntesis hacen la suma, porque sin ellos el shell pegaría los dos números como si fueran texto.

## Resumen

| Forma | Efecto |
|---|---|
| `nombre() { … }` | Define una función |
| `nombre argumento` | La llama y le pasa un dato |
| `$1` dentro de la función | El primer argumento de la llamada |
| `var=$(funcion)` | Recoge lo que la función imprimió |
| `local var=…` | La variable existe solo dentro |
| `$?` | Código de salida del último comando |
| `exit 0` / `exit 1` | Termina el script diciendo si fue bien |
| `$((a + b))` | Hace la cuenta en vez de pegar el texto |

---

**Fuentes**

- DevOps Daily. (2025). *Shell scripting basics*. https://devops-daily.com/guides/introduction-to-linux/09-shell-scripting
- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
