## Empaquetar con tar

`gzip` comprime **un** archivo. No sabe qué hacer con una carpeta ni con un grupo de ellos, y ahí es donde entra `tar`.

`tar` hace algo distinto de comprimir: junta muchos archivos en uno solo, conservando los nombres, las rutas y los permisos de cada uno. A ese resultado se le llama paquete o archivo `.tar`, y por sí mismo no ocupa menos. Las dos operaciones se combinan, y de ahí salen los nombres que se ven por todas partes: `.tar.gz` es una carpeta empaquetada con `tar` y después comprimida con `gzip`.

## Las tres operaciones

`tar` se usa siempre igual: primero se dice qué operación se quiere, después con qué comprimir, y al final sobre qué archivo (Free Software Foundation, 2023).

| Opción | Operación |
|---|---|
| `-c` | Crear un paquete (create) |
| `-t` | Ver qué contiene (list) |
| `-x` | Extraer su contenido (extract) |

Y estas la acompañan:

| Opción | Función |
|---|---|
| `-f` | Indica el nombre del paquete (file) |
| `-z` | Comprimir o descomprimir con `gzip` |
| `-j` | Comprimir o descomprimir con `bzip2` |
| `-v` | Ir mostrando lo que procesa (verbose) |

### Crear

```bash
tar -czf practica.tar.gz practica
ls -l practica.tar.gz
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 298 Aug 11 18:48 practica.tar.gz
```

`-c` crea, `-z` comprime con gzip y `-f` da el nombre del paquete. El último argumento es lo que se quiere empaquetar, en este caso una carpeta entera. `tar` entra solo en las subcarpetas y guarda las rutas dentro del paquete.

### Ver qué hay dentro

Antes de extraer nada conviene mirar, porque un paquete puede soltar sus archivos sueltos en el directorio actual:

```bash
tar -tzf practica.tar.gz
```

```
practica/
practica/scripts/
practica/scripts/copiar.sh
practica/datos/
practica/datos/medidas.csv
practica/leeme.txt
```

Aquí todo cuelga de `practica/`, así que al extraerlo aparecerá esa única carpeta y nada más.

### Extraer

```bash
tar -xzvf practica.tar.gz
```

```
practica/
practica/scripts/
practica/scripts/copiar.sh
practica/datos/
practica/datos/medidas.csv
practica/leeme.txt
```

`-x` extrae, y `-v` va nombrando cada cosa a medida que sale. El paquete original no se toca: extraer es copiar hacia fuera, no vaciar.

`tar` extrae en el directorio actual, así que el sitio desde el que se ejecuta el comando decide dónde acaba todo.

## La f va siempre al final

Es el tropiezo más frecuente con `tar`, y no da un error que oriente (NDG, 2024). La opción `-f` toma como nombre del paquete **lo que venga justo detrás**, así que si se cuela otra letra después de la `f`, ésa pasa a ser el nombre:

```bash
tar -xzfv practica.tar.gz
```

```
tar (child): v: Cannot open: No such file or directory
tar (child): Error is not recoverable: exiting now
tar: Child returned status 2
```

`tar` buscó un paquete llamado `v`. Basta con recordar que la `f` cierra el grupo de opciones: `-xzvf` funciona y `-xzfv` no.

## Sacar un solo archivo

Añadiendo el nombre al final se extrae únicamente esa parte, escrita tal y como aparece en el listado:

```bash
tar -xzvf practica.tar.gz practica/leeme.txt
```

```
practica/leeme.txt
```

Por eso conviene el `-t` de antes: la ruta hay que darla completa, y el listado es donde se lee.

## Extraer en otra carpeta

`tar` deja lo que saca donde estés parado, así que abrir un paquete al lado del original mezcla las dos copias. `-C` dice a qué carpeta ir a extraer:

```bash
mkdir revision
tar -xzf practica.tar.gz -C revision
ls revision
```

```
practica
```

La carpeta tiene que existir antes: `tar` no la crea, y si no está, falla. Es lo que se hace al instalar algo que llega comprimido. El paquete se descarga a un lado y se extrae donde toca, sin moverse de sitio.

## Las rutas se guardan relativas

`tar` nunca guarda rutas absolutas. Si se le pasa una, le quita la barra inicial y lo avisa:

```bash
tar -czf copia.tar.gz /home/estudiante/practica
```

```
tar: Removing leading `/' from member names
```

Dentro del paquete la ruta queda como `home/estudiante/practica`, sin la barra de delante. Al extraerlo, esa ruta se recrea **a partir del directorio actual** y no desde la raíz, de modo que aparece una carpeta `home` justo donde estés parado. Es deliberado, porque permite abrir un paquete en cualquier sitio en lugar de obligarlo a volver a su ubicación original (Shotts, 2026).

Hay una consecuencia más al extraer. Salvo que se haga como administrador, los archivos que salen quedan a nombre de quien los extrae, no del dueño que tenían cuando se empaquetaron.

## Empaquetar sin comprimir

Quitando la `-z` se ve para qué sirve cada mitad:

```bash
tar -cf plano.tar practica
ls -l plano.tar practica.tar.gz
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 10240 Aug 11 18:48 plano.tar
-rw-rw-r-- 1 andres_torres grp_cec1648c   298 Aug 11 18:48 practica.tar.gz
```

El paquete sin comprimir ocupa 10240 bytes y el comprimido 298. `tar` reunió los archivos, `gzip` los encogió. Son dos trabajos distintos que se hacen en el mismo comando.

## zip, el formato de fuera

`zip` empaqueta y comprime a la vez, en un solo formato, y es el que entienden Windows y macOS sin instalar nada:

```bash
zip -rq practica.zip practica
unzip -l practica.zip
```

```
       12  2026-08-11 18:48   practica/scripts/copiar.sh
        0  2026-08-11 18:48   practica/datos/
        9  2026-08-11 18:48   practica/datos/medidas.csv
       14  2026-08-11 18:48   practica/leeme.txt
---------                     -------
       35                     6 files
```

La opción `-r` entra en las subcarpetas, que en `zip` no es automático como en `tar`, y `-q` evita que liste todo lo que va metiendo. Se deshace con `unzip`, y `-l` muestra el contenido sin extraerlo.

Entre uno y otro la elección es de destinatario: `tar` con `gzip` para todo lo que se quede en el mundo Unix, porque conserva permisos y propietarios; `zip` para lo que vaya a abrir alguien desde otro sistema.

<!-- SIMULATOR: escritorio-comprimido -->

<!-- ACTIVIDAD: paquete-de-entrega -->

## Resumen

| Comando | Efecto |
|---|---|
| `tar -czf paquete.tar.gz carpeta` | Empaqueta y comprime con gzip |
| `tar -cjf paquete.tar.bz2 carpeta` | Empaqueta y comprime con bzip2 |
| `tar -tzf paquete.tar.gz` | Lista el contenido sin extraerlo |
| `tar -xzvf paquete.tar.gz` | Extrae mostrando cada archivo |
| `tar -xzvf paquete.tar.gz ruta/archivo` | Extrae solo esa ruta |
| `tar -xzf paquete.tar.gz -C carpeta` | Extrae dentro de esa carpeta |
| `tar -cf plano.tar carpeta` | Empaqueta sin comprimir |
| `zip -rq paquete.zip carpeta` | Empaqueta y comprime en formato zip |
| `unzip paquete.zip` | Extrae un zip |

---

**Fuentes**

- Free Software Foundation. (2023). *GNU tar manual* (versión 1.35). https://www.gnu.org/software/tar/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
