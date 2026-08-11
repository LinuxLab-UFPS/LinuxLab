## Cambiar permisos con chmod

`chmod` (change mode) modifica los permisos de un archivo o un directorio. Sólo puede usarlo el dueño del archivo, o el administrador.

Admite dos formas de escribir el permiso nuevo. La numérica resume cada bloque en un dígito y reescribe los nueve permisos de una vez. La simbólica los nombra con letras, `u+x` o `g-w`, y modifica sólo lo que menciona. Conviene manejar las dos, pero la de letras es la que resuelve la mayoría de los casos del día a día y la que se usa cuando el archivo ya tiene permisos que no hay que estropear.

## Forma numérica

Cada permiso vale un número, y esos valores se suman dentro de cada bloque:

| Valor | Permiso |
|---|---|
| `4` | Lectura |
| `2` | Escritura |
| `1` | Ejecución |

Un bloque queda entonces resumido en un dígito del 0 al 7. Las ocho combinaciones posibles:

| Dígito | Bloque | Dígito | Bloque |
|---|---|---|---|
| `7` | `rwx` | `3` | `-wx` |
| `6` | `rw-` | `2` | `-w-` |
| `5` | `r-x` | `1` | `--x` |
| `4` | `r--` | `0` | `---` |

Tres dígitos describen el archivo entero, en el orden de siempre: dueño, grupo, otros.

```bash
chmod 640 notas.txt
```

```
-rw-r----- 1 andres_torres grp_cec1648c 6 Aug 10 22:19 notas.txt
```

El `6` da lectura y escritura al dueño, el `4` deja al grupo sólo leer, y el `0` cierra el archivo a los demás. Para dejarlo privado del todo:

```bash
chmod 600 notas.txt
```

```
-rw------- 1 andres_torres grp_cec1648c 6 Aug 10 22:19 notas.txt
```

La forma numérica siempre escribe los nueve permisos de golpe. Eso la hace rápida cuando se sabe exactamente cómo debe quedar el archivo, y peligrosa cuando sólo se quiere retocar una cosa: lo que no se menciona no se conserva, se borra.

## Forma simbólica

La forma simbólica nombra qué se toca y lo modifica sin alterar el resto. Se compone de tres partes:

| Parte | Valores |
|---|---|
| A quién | `u` dueño, `g` grupo, `o` otros, `a` todos |
| Qué se hace | `+` añadir, `-` quitar, `=` dejar exactamente esto |
| Qué permiso | `r`, `w`, `x` |

```bash
chmod u+x notas.txt
```

```
-rwx------ 1 andres_torres grp_cec1648c 6 Aug 10 22:19 notas.txt
```

Añadió ejecución al dueño y no tocó nada más. Se pueden encadenar varios cambios separándolos con comas, sin espacios:

```bash
chmod g+r,o-r notas.txt
```

```
-rwxr----- 1 andres_torres grp_cec1648c 6 Aug 10 22:19 notas.txt
```

Cada tramo separado por comas es un cambio completo e independiente, y dentro de uno se pueden pedir varios permisos a la vez escribiéndolos seguidos. Eso permite dejar un archivo como debe quedar en un solo comando, por muchas cosas que haya que tocar. Partiendo de `bitacora.log` en `640`:

```bash
chmod u+wx,g+w bitacora.log
```

```
-rwxrw---- 1 andres_torres grp_cec1648c 0 Aug 11 02:46 bitacora.log
```

El primer tramo dio escritura y ejecución al dueño, el segundo dio escritura al grupo, y los demás quedaron como estaban. Merece la pena acostumbrarse a esto: evita encadenar tres o cuatro `chmod` seguidos sobre el mismo archivo.

El signo `=` es el más tajante de los tres: fija el bloque tal cual y descarta lo que hubiera.

```bash
chmod a=r notas.txt
```

```
-r--r--r-- 1 andres_torres grp_cec1648c 6 Aug 10 22:19 notas.txt
```

### La a: los tres bloques de una vez

De los cuatro destinatarios, `a` es el que conviene mirar aparte, porque no es un bloque más: equivale a escribir `u`, `g` y `o` juntos. Partiendo de un archivo en `640`:

```bash
chmod a+r informe.txt
```

```
-rw-r--r-- 1 andres_torres grp_cec1648c 0 Aug 11 01:27 informe.txt
```

La lectura llegó a los tres bloques a la vez. Y quitar con `a` alcanza igualmente a todos, incluido el dueño:

```bash
chmod a-w informe.txt
```

```
-r--r--r-- 1 andres_torres grp_cec1648c 0 Aug 11 01:27 informe.txt
```

Ahí está el descuido que hay que tener presente: `a-w` deja el archivo de sólo lectura para su propio dueño. Cuando el cambio no es para todo el mundo, conviene nombrar los bloques exactos.

### Combinar destinatarios

Los destinatarios también se agrupan sin llegar a `a`, escribiéndolos seguidos:

```bash
chmod ug+rw informe.txt
```

```
-rw-rw---- 1 andres_torres grp_cec1648c 0 Aug 11 01:27 informe.txt
```

Y un bloque se vacía dejando el `=` sin ninguna letra detrás, que es la forma corta de cerrarlo por completo:

```bash
chmod o= informe.txt
```

```
-rwxr-x--- 1 andres_torres grp_cec1648c 0 Aug 11 01:27 informe.txt
```

### El destinatario no se omite

`chmod +w informe.txt` es válido en un sistema real, pero no significa lo que aparenta: sin destinatario, el cambio se aplica a los tres bloques descontando la `umask` vigente, de modo que el resultado depende de una configuración que no está a la vista. Escribir siempre `u`, `g`, `o` o `a` evita esa sorpresa.

## Cuál usar

La numérica conviene cuando el archivo debe quedar en un estado concreto y conocido: `chmod 600` para algo privado, `chmod 755` para un programa.

La simbólica conviene en todo lo demás, y es la que más se usa. Describe el cambio en los mismos términos en que se piensa el problema: si lo que hace falta es que el grupo pueda escribir, se escribe `chmod g+w` y el resto del archivo queda intacto. Con la numérica habría que averiguar primero cómo estaban los otros seis permisos para no borrarlos al escribir los tres dígitos.

## Varios archivos y directorios enteros

`chmod` acepta varios nombres, y los comodines del tema anterior funcionan igual que en cualquier otro comando:

```bash
chmod 644 a.txt b.txt
```

```
-rw-r--r-- 1 andres_torres grp_cec1648c 0 Aug 10 22:19 a.txt
-rw-r--r-- 1 andres_torres grp_cec1648c 0 Aug 10 22:19 b.txt
```

La opción `-R` aplica el cambio a un directorio y a todo lo que contenga, en cualquier nivel de profundidad:

```bash
chmod -R 700 arbol
```

```
drwx------ 1 andres_torres grp_cec1648c 20 Aug 10 22:19 arbol
```

```
drwx------ 1 andres_torres grp_cec1648c 14 Aug 10 22:19 sub
-rwx------ 1 andres_torres grp_cec1648c  0 Aug 10 22:19 uno.txt
```

Conviene mirar ese resultado con atención. El `700` era el permiso adecuado para el directorio, pero se aplicó también a `uno.txt`, que ha quedado ejecutable sin ser un programa. Un `chmod -R` con un número pensado para directorios estropea los archivos, y con un número pensado para archivos deja los directorios inservibles. La razón está en el subtema siguiente: `x` no significa lo mismo en un directorio que en un archivo.

## Resumen

| Comando | Efecto |
|---|---|
| `chmod 600 archivo` | Fija los nueve permisos de una vez |
| `chmod u+x archivo` | Añade un permiso sin tocar los demás |
| `chmod g-w archivo` | Quita un permiso |
| `chmod ug+rw archivo` | Varios destinatarios en un solo cambio |
| `chmod a+r archivo` | Alcanza a los tres bloques a la vez |
| `chmod a=r archivo` | Deja exactamente ese permiso y descarta el resto |
| `chmod o= archivo` | Cierra un bloque por completo |
| `chmod g+r,o-r archivo` | Encadena cambios con comas |
| `chmod u+wx,g+w archivo` | Varios permisos en cada tramo de la coma |
| `chmod -R 700 carpeta` | Aplica el cambio a todo el contenido |

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 9: "Permissions". linuxcommand.org
- GNU Coreutils Manual, chmod. gnu.org/software/coreutils/manual
