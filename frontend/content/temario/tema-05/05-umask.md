<!-- VIDEO: video-permisos-linux | Permisos: de dónde salen los números de chmod y umask -->

## Permisos por defecto

Los archivos creados hasta ahora nunca han llevado los mismos permisos que un directorio recién hecho, y nadie ha elegido ninguno de los dos. Eso lo decide la `umask` (Free Software Foundation, 2025), un valor que cada sesión arrastra y que determina con qué permisos se crea todo lo nuevo.

```bash
umask
```

```
0002
```

El primer dígito corresponde a permisos especiales y en la práctica se ignora. Los tres siguientes son los de siempre: dueño, grupo y otros.

## Cómo se calcula

La `umask` no indica los permisos que se conceden, sino los que se **retiran**. Se parte de un máximo fijo, `666` para archivos y `777` para directorios (NDG, 2024), y la máscara apaga bits sobre ese máximo (Shotts, 2026).

Apagar bits no es restar. Escrita en binario, cada `1` de la máscara quita el permiso que ocupa esa posición y cada `0` lo deja intacto. Con la `umask 002` del laboratorio:

```
Máximo del archivo    rw- rw- rw-     110 110 110
umask 002             --- --- -w-     000 000 010
Resultado             rw- rw- r--     110 110 100
```

| | Archivos | Directorios |
|---|---|---|
| Máximo | `666` | `777` |
| umask del laboratorio | `002` | `002` |
| Resultado | `664` | `775` |

Que es exactamente lo que se observa:

```bash
touch u1.txt
mkdir u1
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u1.txt
drwxrwsr-x 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u1
```

Los dos máximos son distintos por una razón deliberada: un archivo nunca se crea con permiso de ejecución. Un documento de texto o una imagen no son programas, y marcarlos como ejecutables por defecto sería una puerta abierta a que cualquier cosa descargada pudiera correrse. La ejecución hay que concederla a mano con `chmod`, que es justo lo que se hizo en el subtema de `chmod` con `u+x`.

## Cambiarla

Pasarle un valor a `umask` la modifica para el resto de la sesión:

```bash
umask 027
touch u2.txt
mkdir u2
```

```
-rw-r----- 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u2.txt
drwxr-s--- 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u2
```

El `2` apaga la escritura del grupo y el `7` apaga los tres permisos de los demás, así que el archivo queda en `640` y el directorio en `750`. El grupo conserva lectura, los demás quedan fuera. Con `077` no queda nada para nadie salvo el dueño:

```bash
umask 077
touch u3.txt
```

```
-rw------- 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u3.txt
```

Y con `000` no se retira nada, aunque el archivo sigue sin recibir permiso de ejecución porque su máximo nunca fue `777`:

```bash
umask 000
touch u4.txt
mkdir u4
```

```
-rw-rw-rw- 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u4.txt
drwxrwsrwx 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u4
```

## Por qué no es una resta

Con los valores habituales la resta da el mismo resultado, y por eso se explica así a menudo, pero deja de funcionar en cuanto la máscara incluye el bit de ejecución. Un archivo nunca nace con `x`, de modo que ahí no hay nada que apagar:

```bash
umask 001
touch u5.txt
```

```
-rw-rw-rw- 1 andres_torres grp_cec1648c 0 Aug 10 22:22 u5.txt
```

`666 - 001` daría `665`, que concedería ejecución a los demás. Una máscara no concede permisos, únicamente apaga los que ya estaban, y ese bit estaba apagado desde el principio.

## Solo dura la sesión

El cambio afecta a lo que se cree a partir de ese momento y desaparece al cerrar la terminal. Los archivos ya existentes no se ven alterados: `umask` decide con qué permisos se crean las cosas, `chmod` cambia las que ya están. Para que un valor distinto persista hay que escribirlo en el archivo `.bashrc` de la carpeta personal, que es el que se lee al abrir cada sesión.

<!-- SIMULATOR: filtro-de-permisos -->

## Resumen

| Comando | Efecto |
|---|---|
| `umask` | Muestra el valor actual |
| `umask 027` | Lo cambia para el resto de la sesión |
| `666` menos lo que apague la máscara | Permisos iniciales de un archivo |
| `777` menos lo que apague la máscara | Permisos iniciales de un directorio |

---

**Fuentes**

- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
