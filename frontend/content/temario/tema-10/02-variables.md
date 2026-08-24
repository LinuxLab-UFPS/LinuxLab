## Variables y argumentos

Un script que siempre hace exactamente lo mismo sirve de poco. Las variables guardan un dato con un nombre para poder cambiarlo en un sitio en lugar de en veinte.

## Guardar un valor

Se asigna con el signo igual, y **sin espacios a los lados** (Free Software Foundation, 2025). Un espacio ahí convierte la asignación en un comando y el shell responde con un error:

```
nombre="Andrés"
```

Para usarla se antepone `$` al nombre:

```bash
./saludo.sh
```

```
Hola, Andrés
```

El nombre puede llevar letras, números y guion bajo, no puede empezar por número, y distingue mayúsculas de minúsculas: `nombre` y `NOMBRE` son dos variables distintas.

## Las comillas importan

Entre comillas dobles el shell sustituye la variable por su valor. Entre comillas simples no sustituye nada y escribe el texto tal cual:

```
echo "Hola, $nombre"        →  Hola, Andrés
echo 'Hola, $nombre'        →  Hola, $nombre
```

Y hay un caso donde las comillas dejan de ser una preferencia. Un valor con espacios, sin comillas al usarlo, se parte en trozos:

```bash
archivo="mi informe.txt"
ls -l "$archivo"
ls -l $archivo
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 0 Aug 24 15:30 mi informe.txt
ls: cannot access 'mi': No such file or directory
ls: cannot access 'informe.txt': No such file or directory
```

La segunda línea llegó a `ls` como dos argumentos en vez de uno. La costumbre que evita el problema es escribir siempre `"$variable"` entre comillas.

## Guardar la salida de un comando

`$(comando)` ejecuta lo de dentro y devuelve lo que ese comando imprimió, que se puede guardar como cualquier otro valor:

```bash
hoy=$(date +%Y-%m-%d)
cuantos=$(ls /etc | wc -l)
echo "Hoy es $hoy y /etc tiene $cuantos entradas"
```

```
Hoy es 2026-08-24 y /etc tiene 114 entradas
```

Es lo que convierte un script en algo que reacciona al sistema en vez de repetir datos escritos a mano. Un nombre de copia de seguridad con la fecha del día se arma así.

## Las variables del entorno

El sistema define unas cuantas antes de que el script arranque. Se escriben en mayúsculas por convención:

```bash
echo "Cuenta: $USER"
echo "Shell:  $SHELL"
```

```
Cuenta: andres_torres
Shell:  /bin/bash
```

`HOME` guarda la ruta de la carpeta personal, y `PATH` es la del subtema anterior, la lista de directorios donde el shell busca los comandos. Se consultan igual, con `echo "$HOME"`.

## Argumentos

Un script recibe lo que se escriba detrás de su nombre, y los recoge en variables numeradas (DevOps Daily, 2025):

| Variable | Qué contiene |
|---|---|
| `$0` | El nombre del propio script |
| `$1`, `$2`… | El primer argumento, el segundo… |
| `$#` | Cuántos argumentos llegaron |
| `$@` | Todos, en una lista |

```bash
./copiar.sh informe.txt copia
```

```
Script: ./copiar.sh
Primero: informe.txt  Segundo: copia
Cuantos: 2
Todos: informe.txt copia
```

Llamándolo sin nada, esas variables quedan vacías y `$#` vale cero:

```bash
./copiar.sh
```

```
Script: ./copiar.sh
Primero:   Segundo: 
Cuantos: 0
Todos: 
```

Un script que necesita argumentos tiene que comprobar `$#` antes de seguir, y eso es el subtema siguiente.

## Preguntar mientras corre

Cuando el dato no viene de un argumento, `read` lo pide por teclado y lo guarda en una variable. La opción `-p` escribe el aviso en la misma línea:

```bash
read -p "¿Cómo te llamas? " nombre
echo "Hola, $nombre"
```

```
¿Cómo te llamas? Andrés
Hola, Andrés
```

Para una contraseña está `-s`, que no muestra en pantalla lo que se teclea.

## Resumen

| Forma | Efecto |
|---|---|
| `nombre="valor"` | Asigna, sin espacios alrededor del `=` |
| `$nombre` | Usa el valor |
| `"$nombre"` | Lo usa protegido de los espacios |
| `'$nombre'` | Escribe el texto literal, sin sustituir |
| `$(comando)` | Guarda lo que el comando imprimió |
| `$0` `$1` `$#` `$@` | Nombre, argumentos, cuántos y todos |
| `read -p "aviso " var` | Pide un dato por teclado |

---

**Fuentes**

- DevOps Daily. (2025). *Shell scripting basics*. https://devops-daily.com/guides/introduction-to-linux/09-shell-scripting
- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
