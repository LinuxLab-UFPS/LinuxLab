## Comprimir y descomprimir

Comprimir es reescribir un archivo ocupando menos espacio, de forma que después pueda recuperarse. Un texto donde una palabra se repite mil veces no necesita guardarla mil veces: basta con anotarla una vez y apuntar dónde va. Ese es el trabajo de los algoritmos de compresión, y de ahí sale la regla que gobierna todo el tema: **cuanta más repetición tiene un archivo, más se encoge**.

Un archivo comprimido no se usa directamente. Se descomprime antes, y entonces vuelve a ser lo que era.

### Con pérdida y sin pérdida

| Tipo | Qué ocurre al recuperar |
|---|---|
| Sin pérdida | Sale exactamente el original, bit por bit |
| Con pérdida | Sale algo parecido, no idéntico |

La compresión con pérdida sirve para imágenes, audio y video, donde el ojo y el oído no notan la diferencia y el ahorro es grande: es lo que hace un JPEG. Para todo lo demás no vale. Un documento, un registro del sistema o un programa tienen que salir idénticos, así que se usa compresión sin pérdida, y es la única que se maneja desde la terminal.

## gzip

`gzip` es la herramienta habitual. Recibe un archivo y lo deja comprimido:

```bash
ls -l bitacora.txt
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 44892 Aug 11 18:48 bitacora.txt
```

```bash
gzip bitacora.txt
ls -l bitacora.txt.gz
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 2365 Aug 11 18:48 bitacora.txt.gz
```

Conviene fijarse en lo que pasó, porque sorprende la primera vez: **el original ya no está**. `gzip` no deja una copia comprimida al lado, sustituye el archivo por su versión comprimida y le añade la extensión `.gz`.

La opción `-l` (list) resume el resultado sin descomprimir nada:

```bash
gzip -l bitacora.txt.gz
```

```
         compressed        uncompressed  ratio uncompressed_name
               2365               44892  94.8% bitacora.txt
```

De 44892 bytes a 2365, un 94,8% menos. Esa cifra tan alta no es lo normal: el archivo del ejemplo son novecientas líneas casi iguales, y la repetición es justo lo que un compresor aprovecha.

Para volver atrás está `gunzip`:

```bash
gunzip bitacora.txt.gz
ls -l bitacora.txt
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 44892 Aug 11 18:48 bitacora.txt
```

El archivo vuelve a su tamaño y a su nombre. `gzip -d` (decompress) hace exactamente lo mismo.

### Conservar el original

Si interesa quedarse con las dos versiones, la opción `-k` (keep) no borra el archivo de partida:

```bash
gzip -k bitacora.txt
ls -l bitacora.txt bitacora.txt.gz
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 44892 Aug 11 18:48 bitacora.txt
-rw-rw-r-- 1 andres_torres grp_cec1648c  2365 Aug 11 18:48 bitacora.txt.gz
```

### Leer sin descomprimir

Para consultar un archivo comprimido no hace falta deshacerlo. `zcat` lo descomprime en el aire y escribe el resultado en la salida, así que se combina con los comandos del tema de pipes:

```bash
zcat bitacora.txt.gz | head -2
```

```
registro de la practica de laboratorio numero 1
registro de la practica de laboratorio numero 2
```

## bzip2

`bzip2` funciona igual pero usa otro algoritmo: aprieta más y tarda más. Sobre el mismo archivo:

```bash
gzip a.txt
bzip2 b.txt
ls -l a.txt.gz b.txt.bz2
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 2358 Aug 11 18:48 a.txt.gz
-rw-rw-r-- 1 andres_torres grp_cec1648c  986 Aug 11 18:48 b.txt.bz2
```

Menos de la mitad que `gzip`, a cambio de más tiempo de procesador. Su extensión es `.bz2` y se deshace con `bunzip2`.

La elección entre uno y otro es un intercambio: `gzip` cuando importa la rapidez, `bzip2` cuando importa el tamaño final. Existen otros compresores con el mismo esquema de uso, como `xz`, que no está instalado en este laboratorio.

## Cuando no hay nada que ganar

Si la compresión vive de la repetición, un archivo sin repeticiones no se puede encoger. Y no es que se quede igual: crece, porque el formato añade su propia cabecera. Con cuarenta mil bytes tomados al azar:

```bash
gzip azar.bin
gzip -l azar.bin.gz
```

```
         compressed        uncompressed  ratio uncompressed_name
              40037               40000  -0.0% azar.bin
```

Treinta y siete bytes más de los que había. El porcentaje sale negativo.

Esto importa porque **un archivo ya comprimido se parece mucho a uno aleatorio**: el compresor que actuó primero se llevó las repeticiones y dejó pocas. Por eso meter fotos en un `.zip` no reduce casi nada, ya que un JPEG o un PNG están comprimidos por dentro, y por eso volver a comprimir un paquete rara vez compensa.

`gzip` incluso se niega cuando reconoce su propia extensión, en lugar de gastar tiempo para nada:

```bash
gzip practica.tar.gz
```

```
gzip: practica.tar.gz already has .gz suffix -- unchanged
```

## Resumen

| Comando | Efecto |
|---|---|
| `gzip archivo` | Comprime y sustituye el original por `archivo.gz` |
| `gzip -k archivo` | Comprime y conserva el original |
| `gzip -l archivo.gz` | Muestra tamaños y porcentaje ahorrado |
| `gunzip archivo.gz` | Descomprime y recupera el nombre original |
| `zcat archivo.gz` | Muestra el contenido sin descomprimirlo |
| `bzip2 archivo` | Comprime más y más despacio, en `.bz2` |
| `bunzip2 archivo.bz2` | Descomprime un `.bz2` |

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 18: "Archiving and Backup". linuxcommand.org
- GNU Gzip Manual. gnu.org/software/gzip/manual
