## Tomar decisiones

El subtema anterior terminó con un script que se queda mudo si no recibe argumentos. Un script útil comprueba antes de actuar, y para eso están los condicionales.

## if

La forma completa se lee casi como una frase:

```
if [ condición ]; then
    comandos
fi
```

Los corchetes son un comando de verdad, no puntuación, así que **necesitan un espacio a cada lado** (Free Software Foundation, 2025). Pegarlos al contenido es el error más común al empezar.

Un script que exige un argumento se protege así:

```bash
./ficha.sh
```

```
Uso: ./ficha.sh <archivo>
```

Y por dentro:

```
if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <archivo>"
    exit 1
fi
```

El `exit 1` corta ahí mismo. El `1` es el código de salida: cero significa que todo fue bien y cualquier otro número significa un fallo, que es lo que permite encadenar comandos con `&&`.

## Encadenar con elif y else

Cuando hay más de dos caminos, `elif` añade condiciones y `else` recoge lo que no encajó en ninguna:

```
if [ -f "$archivo" ]; then
    echo "$archivo es un archivo corriente"
elif [ -d "$archivo" ]; then
    echo "$archivo es un directorio"
else
    echo "$archivo no existe"
fi
```

```bash
./ficha.sh notas.txt
./ficha.sh apuntes
./ficha.sh fantasma
```

```
notas.txt es un archivo corriente
apuntes es un directorio
fantasma no existe
```

## Qué se puede comprobar

Para números, los operadores llevan guion y dos letras:

| Operador | Cierto cuando |
|---|---|
| `-eq` | Son iguales |
| `-ne` | Son distintos |
| `-lt` | El primero es menor |
| `-le` | Es menor o igual |
| `-gt` | Es mayor |
| `-ge` | Es mayor o igual |

Para cadenas de texto:

| Operador | Cierto cuando |
|---|---|
| `=` | Las dos cadenas son iguales |
| `!=` | Son distintas |
| `-z` | La cadena está vacía |
| `-n` | La cadena tiene algo |

Y para archivos, que es lo que más se usa en un script:

| Operador | Cierto cuando |
|---|---|
| `-e` | Existe, sea lo que sea |
| `-f` | Existe y es un archivo corriente |
| `-d` | Existe y es un directorio |
| `-r` | Se puede leer |
| `-w` | Se puede escribir |
| `-x` | Se puede ejecutar |

Los tres últimos responden sobre los permisos del módulo cinco, y responden para **la cuenta que ejecuta el script**, no en abstracto.

## Combinar y negar

`&&` exige que se cumplan las dos condiciones, `||` que se cumpla alguna, y `!` invierte la respuesta:

```
if [ -f "$archivo" ] && [ -r "$archivo" ]; then
    echo "existe y se puede leer"
fi

if [ ! -f "config.txt" ]; then
    echo "falta el archivo de configuración"
fi
```

Ese segundo caso, comprobar que algo **no** está, es el más frecuente al principio de un script.

## case

Cuando la decisión es comparar una misma variable contra varios valores, un `if` con cuatro `elif` se vuelve ilegible (DevOps Daily, 2025). `case` dice lo mismo más corto:

```
case "$1" in
    inicio)
        echo "Arrancando" ;;
    parada)
        echo "Deteniendo" ;;
    estado|info)
        echo "Consultando" ;;
    *)
        echo "Uso: $0 {inicio|parada|estado}"
        exit 1 ;;
esac
```

```bash
./servicio.sh inicio
./servicio.sh info
./servicio.sh otro
```

```
Arrancando
Consultando
Uso: ./servicio.sh {inicio|parada|estado}
```

Cada rama termina en `;;`, la barra vertical acepta varios valores para una misma rama, y el `*` del final recoge todo lo demás. Sin ese `*`, un valor inesperado no haría nada y el script terminaría en silencio.

## Resumen

| Forma | Efecto |
|---|---|
| `if [ cond ]; then … fi` | Ejecuta solo si se cumple |
| `elif` / `else` | Más caminos, y el que recoge el resto |
| `[ "$a" -eq "$b" ]` | Compara números |
| `[ "$a" = "$b" ]` | Compara cadenas |
| `[ -f archivo ]` | Comprueba que existe y es un archivo |
| `[ -d archivo ]` | Comprueba que es un directorio |
| `[ ! cond ]` | Invierte la condición |
| `case "$var" in … esac` | Compara una variable contra varios valores |
| `exit 1` | Corta el script señalando un fallo |

---

**Fuentes**

- DevOps Daily. (2025). *Shell scripting basics*. https://devops-daily.com/guides/introduction-to-linux/09-shell-scripting
- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
