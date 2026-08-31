## Editores de texto

Los comandos vistos hasta ahora crean archivos y muestran su contenido, pero no permiten modificarlo. Para eso existen los editores de texto, programas que funcionan dentro de la propia terminal.

Linux incluye varios. `nano` es el más sencillo y muestra sus atajos en pantalla, mientras que `vi` (*visual editor*) es mucho más potente a cambio de una curva de aprendizaje empinada (NDG, 2024).

`vi` está en prácticamente cualquier sistema Unix porque la norma POSIX lo especifica entre sus utilidades y obliga a incluirlo en los sistemas que declaran soporte de utilidades de portabilidad de usuario (The Open Group, 2024). Por eso aparece en servidores mínimos y sistemas de rescate donde no hay ningún otro editor, y es el que se usa en esta asignatura.

En la mayoría de distribuciones `vi` ya no es el editor original, sino un enlace a **Vim** (*Vi improved*), su reemplazo moderno (Shotts, 2026). En este laboratorio ocurre lo mismo.

## Los modos

`vi` no funciona como un editor de escritorio. Las teclas no escriben siempre: su efecto depende del modo activo (Vim Project, 2026). Entender esto antes de tocar el teclado evita la mayor parte de la frustración inicial.

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

`d` sigue la misma regla que se explica en el apartado siguiente: es una acción que espera un movimiento para saber hasta dónde llega. `x` es la excepción cómoda, un atajo para el carácter que está bajo el cursor.

## Copiar y pegar

`vi` no usa el portapapeles del sistema. Lo que se copia o se borra va a un registro interno del editor, y de ahí se pega.

La tecla `y` (*yank*, copiar) no actúa sola: espera a que se le indique qué copiar, y eso se dice con una tecla de movimiento de las ya vistas. La combinación se lee de izquierda a derecha, primero la acción y después su alcance.

| Comando | Efecto |
|---|---|
| `yy` | Copia la línea actual |
| `yl` | Copia el carácter bajo el cursor |
| `yw` | Copia hasta el final de la palabra |
| `y$` | Copia hasta el final de la línea |
| `3yy` | Copia tres líneas |
| `p` | Pega después del cursor |
| `P` | Pega antes del cursor |

Repetir la letra de la acción significa "sobre la línea entera". Por eso `yy` copia la línea, igual que `dd` la borra.

Los comandos de borrado también llenan ese registro, así que `x` y `dd` no destruyen lo que quitan: lo cortan. De ahí que `dd` seguido de `p` mueva una línea de sitio, y que `x` seguido de `p` mueva un carácter.

El registro recuerda además si lo que guarda es una línea o un fragmento suelto, y `p` se comporta en consecuencia: después de `yy` o `dd` pega una línea nueva debajo, mientras que después de `x` o `yl` deja el carácter al lado del cursor. Es la misma tecla obedeciendo a lo último que se copió.

Duplicar una línea son dos pulsaciones: `yy` para copiarla y `p` para pegarla debajo. Intercambiar dos caracteres seguidos son otras dos: `x` corta el primero y `p` lo devuelve detrás del segundo.

## Unir dos líneas

`vi` es estricto con lo que considera una línea y no deja borrar el salto para pegar una con la siguiente. Para eso tiene un comando propio, la `J` mayúscula, que no hay que confundir con la `j` minúscula de bajar el cursor.

```
Linea 1
Linea 2
Linea 3
```

Con el cursor en la segunda línea, `J` deja:

```
Linea 1
Linea 2 Linea 3
```

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

## Sustituir

Reemplazar texto se hace desde el modo de comandos:

```
:%s/viejo/nuevo/g
```

Cada parte cumple una función:

| Parte | Qué hace |
|---|---|
| `:` | Entra en modo de comandos |
| `%` | El rango, desde la primera línea hasta la última |
| `s` | La operación, sustituir |
| `/viejo/nuevo/` | El texto que se busca y el que lo reemplaza |
| `g` | Cambia todas las apariciones de cada línea, no solo la primera |

Sin el `%` la sustitución afecta únicamente a la línea actual. Con una `c` al final, `vi` se detiene a pedir confirmación antes de cada cambio.

<!-- EJERCICIO: ficha-personal -->

<!-- SIMULATOR: retos-de-vi -->

## Resumen

| Tecla o comando | Efecto en vi |
|---|---|
| `vi archivo` | Abre el archivo en modo normal |
| <kbd>i</kbd> | Pasa a modo inserción |
| <kbd>Esc</kbd> | Vuelve a modo normal |
| `:w` | Guarda |
| `:q` | Sale |
| `:wq` | Guarda y sale |
| `:q!` | Sale descartando los cambios |
| `dd` | Corta la línea actual |
| `x` | Corta el carácter bajo el cursor |
| `yy` y `p` | Copia la línea y la pega debajo |
| `yl` y `p` | Copia un carácter y lo pega al lado |
| `u` | Deshace el último cambio |
| `/texto` | Busca hacia adelante |
| `:%s/a/b/g` | Sustituye en todo el archivo |
| `J` | Une la línea siguiente con la actual |

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
- The Open Group. (2024). *POSIX.1-2024: The Open Group base specifications issue 8*. https://pubs.opengroup.org/onlinepubs/9799919799/
- Vim Project. (2026). *Vim user manual* (versión 9.2). https://vimhelp.org/usr_toc.txt.html
