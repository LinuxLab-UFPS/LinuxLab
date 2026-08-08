## Editores de texto

Los comandos vistos hasta ahora crean archivos y muestran su contenido, pero no permiten modificarlo. Para eso existen los editores de texto, programas que funcionan dentro de la propia terminal.

Linux incluye varios. `nano` es el más sencillo y muestra sus atajos en pantalla. `vi` (*visual editor*) es el que está presente en prácticamente cualquier sistema Unix, incluidos servidores mínimos donde no hay nada más instalado, y es el que se usa en esta asignatura.

En este laboratorio `vi` ejecuta **Vim** (*Vi improved*), la versión moderna del editor original.

## Los modos

`vi` no funciona como un editor de escritorio. Las teclas no escriben siempre: su efecto depende del modo activo. Entender esto antes de tocar el teclado evita la mayor parte de la frustración inicial.

| Modo | Para qué sirve | Cómo se entra |
|---|---|---|
| **Normal** | Moverse, borrar, copiar y pegar | <kbd>Esc</kbd> |
| **Inserción** | Escribir texto | `i`, `a`, `o` |
| **Comandos** | Guardar, salir, buscar | `:` |

`vi` arranca siempre en modo normal. Las letras pulsadas ahí no aparecen en el archivo: se interpretan como órdenes. Escribir la palabra "hola" en modo normal ejecuta cuatro comandos distintos.

<kbd>Esc</kbd> devuelve al modo normal desde cualquier otro. Ante la duda sobre el modo activo, pulsar <kbd>Esc</kbd> deja el editor en un estado conocido.

## Abrir un archivo

```bash
vi notas.txt
```

La pantalla muestra el contenido, las líneas vacías marcadas con `~` y una barra inferior con el nombre del archivo, su número de líneas y su tamaño:

```
linea uno
linea dos
linea tres
~
~
~
"notas.txt" 3L, 31B                                    1,1           All
```

Los números `1,1` de la derecha indican la posición del cursor: línea 1, columna 1. Si el archivo no existe, `vi` lo crea al guardar y la barra muestra `[New]`.

## Guardar y salir

Estos comandos se escriben en modo normal, empiezan con `:` y terminan con <kbd>Enter</kbd>.

| Comando | Efecto |
|---|---|
| `:w` | Guarda sin salir |
| `:q` | Sale, si no hay cambios pendientes |
| `:wq` | Guarda y sale |
| `:q!` | Sale descartando los cambios |

`:q` se niega a cerrar si hay modificaciones sin guardar, y muestra un aviso. `:q!` fuerza la salida y descarta todo lo escrito desde el último guardado. La admiración al final de un comando significa "hazlo de todos modos".

`ZZ` (dos mayúsculas en modo normal) equivale a `:wq`.

## Moverse por el archivo

Las flechas del teclado funcionan, pero `vi` define su propio juego de teclas en la fila central, pensado para no mover las manos de la posición de escritura:

| Tecla | Movimiento |
|---|---|
| `h` | Izquierda |
| `j` | Abajo |
| `k` | Arriba |
| `l` | Derecha |

Los desplazamientos por palabras y líneas ahorran pulsaciones:

| Tecla | Movimiento |
|---|---|
| `w` | Al principio de la palabra siguiente |
| `b` | Al principio de la palabra anterior |
| `0` | Al principio de la línea |
| `$` | Al final de la línea |
| `gg` | A la primera línea del archivo |
| `G` | A la última línea |
| `:15` | A la línea 15 |

Casi todos los comandos aceptan un número delante que indica cuántas veces repetirlos. `5j` baja cinco líneas y `3w` avanza tres palabras.

## Escribir texto

Para pasar a modo inserción hay varias teclas, y la diferencia entre ellas es dónde queda el cursor:

| Tecla | Dónde empieza a escribir |
|---|---|
| `i` | Antes del cursor |
| `a` | Después del cursor |
| `I` | Al principio de la línea |
| `A` | Al final de la línea |
| `o` | En una línea nueva debajo |
| `O` | En una línea nueva encima |

En modo inserción el teclado se comporta como en cualquier editor. La barra inferior muestra `-- INSERT --`. <kbd>Esc</kbd> regresa al modo normal.

## Borrar

Estos comandos actúan en modo normal:

| Comando | Efecto |
|---|---|
| `x` | Borra el carácter bajo el cursor |
| `dw` | Borra hasta el final de la palabra |
| `dd` | Borra la línea completa |
| `D` | Borra desde el cursor hasta el final de la línea |
| `3dd` | Borra tres líneas |

## Copiar y pegar

`vi` no usa el portapapeles del sistema. Lo que se copia o se borra va a un registro interno del editor, y de ahí se pega.

| Comando | Efecto |
|---|---|
| `yy` | Copia la línea actual (*yank*) |
| `3yy` | Copia tres líneas |
| `yw` | Copia hasta el final de la palabra |
| `p` | Pega después del cursor |
| `P` | Pega antes del cursor |

Los comandos de borrado también llenan ese registro, de modo que `dd` seguido de `p` mueve una línea de sitio: `dd` la corta y `p` la deposita donde esté el cursor.

Duplicar una línea son dos pulsaciones: `yy` para copiarla y `p` para pegarla debajo.

## Deshacer

| Comando | Efecto |
|---|---|
| `u` | Deshace el último cambio |
| <kbd>Ctrl</kbd> + <kbd>r</kbd> | Rehace lo deshecho |

`u` se puede repetir para retroceder varios cambios.

## Buscar

Desde el modo normal, `/` seguido de un texto busca hacia adelante:

```
/error
```

<kbd>Enter</kbd> lleva a la primera coincidencia. `n` salta a la siguiente y `N` a la anterior. Con `?` en lugar de `/`, la búsqueda va hacia atrás.

## nano como alternativa

`nano` no tiene modos: al abrirlo se escribe directamente y los atajos aparecen listados al pie de la pantalla, donde `^X` significa <kbd>Ctrl</kbd> + <kbd>X</kbd>.

| Atajo | Efecto |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | Guarda |
| <kbd>Ctrl</kbd> + <kbd>X</kbd> | Sale |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Corta la línea |
| <kbd>Ctrl</kbd> + <kbd>U</kbd> | Pega |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Busca |

Es más cómodo para una edición rápida, pero no siempre está instalado. En un servidor recién montado o en un sistema de rescate suele haber únicamente `vi`, y por eso conviene manejarlo.

## Práctica

El ejercicio consiste en crear una ficha personal dentro del directorio home, usando `vi` para escribirla.

El archivo debe llamarse como el código estudiantil, con extensión `.txt`. Para un código 1152186 el comando sería:

```bash
vi 1152186.txt
```

El contenido tiene esta estructura:

1. El nombre completo en la primera línea.
2. Tres comandos aprendidos hasta ahora, uno por línea.
3. El correo institucional en la última línea.

El recorrido dentro del editor es el de la lección: `i` para entrar en modo inserción, <kbd>Esc</kbd> para volver al modo normal y `:wq` para guardar y salir.

<!-- EJERCICIO: ficha-personal -->

El nombre de la primera línea no se revisa. Lo que se comprueba es que el archivo se llame como el código, que tenga las líneas suficientes y que la última sea el correo institucional registrado en la plataforma.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
- Vim documentation. vimdoc.sourceforge.net
