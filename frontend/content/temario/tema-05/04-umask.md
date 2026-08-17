<!-- VIDEO: video-permisos-linux | Permisos: de dónde salen los números de chmod y umask -->

## Permisos por defecto

Los archivos creados hasta ahora nunca han llevado los mismos permisos que un directorio recién hecho, y nadie ha elegido ninguno de los dos. Eso lo decide la `umask`, un valor que cada sesión arrastra y que determina con qué permisos se crea todo lo nuevo.

```bash
umask
```

```
0002
```

El primer dígito corresponde a permisos especiales y en la práctica se ignora. Los tres siguientes son los de siempre: dueño, grupo y otros.

## Cómo se calcula

La `umask` no indica los permisos que se conceden, sino los que se **retiran**. Se parte de un máximo fijo y se le resta:

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

`666 - 027` da `640` y `777 - 027` da `750`. El grupo conserva lectura, los demás quedan fuera. Con `077` no queda nada para nadie salvo el dueño:

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

## Sólo dura la sesión

El cambio afecta a lo que se cree a partir de ese momento y desaparece al cerrar la terminal. Los archivos ya existentes no se ven alterados: `umask` decide con qué permisos se crean las cosas, `chmod` cambia las que ya están. Para que un valor distinto persista hay que escribirlo en el archivo `.bashrc` de la carpeta personal, que es el que se lee al abrir cada sesión.

<!-- SIMULATOR: filtro-de-permisos -->

## Resumen

| Comando | Efecto |
|---|---|
| `umask` | Muestra el valor actual |
| `umask 027` | Lo cambia para el resto de la sesión |
| `666 - umask` | Permisos iniciales de un archivo |
| `777 - umask` | Permisos iniciales de un directorio |

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 9: "Permissions". linuxcommand.org
- GNU Coreutils Manual, File permissions. gnu.org/software/coreutils/manual
- AlgoMaster. *Users, Groups and Permissions*. algomaster.io/learn/operating-systems
