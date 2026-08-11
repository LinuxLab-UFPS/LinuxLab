## Dueño, grupo y permisos

Linux es un sistema multiusuario: varias personas trabajan sobre la misma máquina al mismo tiempo. Por eso cada archivo lleva anotado quién es su dueño y qué puede hacer con él cada quien. Esa información aparece en `ls -l`, en la parte que hasta ahora se ha ignorado.

```bash
ls -l
```

```
total 12
drwxrwsr-x 1 andres_torres grp_cec1648c  0 Aug 10 22:09 apuntes
-rw------- 1 andres_torres grp_cec1648c  2 Aug 10 22:09 informe.txt
-rw-rw-r-- 1 andres_torres grp_cec1648c 10 Aug 10 22:09 notas.txt
-rwxr-xr-x 1 andres_torres grp_cec1648c 22 Aug 10 22:09 saludo.sh
```

Las dos columnas del centro son los dos dueños: primero el usuario, después el grupo. Los diez caracteres de la izquierda son el tipo de archivo y sus permisos.

## Los diez caracteres

El primero indica qué clase de archivo es. En el trabajo diario aparecen tres:

| Carácter | Tipo |
|---|---|
| `-` | Archivo corriente: texto, imagen, programa |
| `d` | Directorio |
| `l` | Enlace simbólico, un nombre que apunta a otro archivo |

```bash
ls -l
```

```
drwxrwsr-x 1 andres_torres grp_cec1648c 0 Aug 10 22:19 apuntes
lrwxrwxrwx 1 andres_torres grp_cec1648c 9 Aug 10 22:19 atajo -> notas.txt
-rw-rw-r-- 1 andres_torres grp_cec1648c 6 Aug 10 22:19 notas.txt
```

Hay cuatro tipos más, y todos representan cosas que no son archivos de datos sino puntos de comunicación con el sistema: `b` y `c` para dispositivos, `p` para tuberías con nombre y `s` para sockets. Viven en `/dev` y rara vez se los encuentra fuera de ahí.

```bash
ls -l /dev/null /dev/tty
```

```
crw-rw-rw- 1 root root 1, 3 Aug 10 20:52 /dev/null
crw-rw-rw- 1 root root 5, 0 Aug 10 21:08 /dev/tty
```

Los nueve caracteres restantes se leen en tres bloques de tres:

```
-  rw-  rw-  r--
│   │    │    │
│   │    │    └── otros
│   │    └─────── grupo
│   └──────────── dueño
└──────────────── tipo de archivo
```

Cada bloque usa siempre las mismas tres posiciones, en el mismo orden: lectura, escritura y ejecución. Una letra indica que el permiso está concedido y un guion que no.

| Letra | Sobre un archivo |
|---|---|
| `r` | Se puede leer su contenido |
| `w` | Se puede modificar |
| `x` | Se puede ejecutar como programa |

Con eso, `-rw-rw-r--` se lee de corrido: archivo corriente, el dueño lee y escribe, el grupo lee y escribe, los demás sólo leen.

## Sólo se aplica un bloque

Los tres bloques no se suman. El sistema mira quién intenta el acceso y aplica **un solo** bloque, en este orden:

1. Si es el dueño, valen los permisos del dueño y se acabó.
2. Si no lo es pero pertenece al grupo, valen los del grupo.
3. En cualquier otro caso, valen los de otros.

La consecuencia sorprende cuando pasa: `-r--rw-rw-` deja al dueño sin poder escribir su propio archivo, aunque el grupo y los demás sí puedan. Al ser el dueño, nunca se llega a mirar los otros bloques.

## Las dos columnas del centro

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 10 Aug 10 22:09 notas.txt
```

La primera es el usuario dueño, normalmente quien creó el archivo. La segunda es el grupo dueño. En este laboratorio ese grupo es el del curso, y por eso todos los archivos que se creen aquí lo llevan puesto sin necesidad de hacer nada.

El comando `id` responde quién es uno para el sistema:

```bash
id
```

```
uid=1004(andres_torres) gid=1006(andres_torres) groups=1006(andres_torres)
```

Detrás de cada nombre hay un número. El sistema trabaja con esos números, el UID del usuario y el GID del grupo, y traduce a nombres sólo para mostrarlos. La opción `-n` de `ls` muestra lo que el sistema guarda en realidad:

```bash
ls -ln notas.txt
ls -l notas.txt
```

```
-rw-rw-r-- 1 1004 1047 2 Aug 11 00:00 notas.txt
-rw-rw-r-- 1 andres_torres grp_cec1648c 2 Aug 11 00:00 notas.txt
```

Los nombres son una comodidad para leer. Si se borra la cuenta de un usuario, sus archivos no quedan sin dueño: siguen apuntando al mismo UID, y como ya no hay nombre que le corresponda, `ls -l` pasa a mostrar el número.

Cambiar de dueño un archivo requiere privilegios de administrador, así que en la práctica el dueño es quien lo creó.

## La misma información, en números

`stat` muestra lo mismo que `ls -l` pero añade la forma numérica de los permisos, que es la que se usa para cambiarlos:

```bash
stat -c "%A  %a  %U  %G  %n" notas.txt informe.txt saludo.sh
```

```
-rw-rw-r--  664  andres_torres  grp_cec1648c  notas.txt
-rw-------  600  andres_torres  grp_cec1648c  informe.txt
-rwxr-xr-x  755  andres_torres  grp_cec1648c  saludo.sh
```

Cada bloque de tres letras equivale a un dígito. De dónde salen esos números y cómo se usan para cambiar permisos es el contenido del siguiente subtema.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 9: "Permissions". linuxcommand.org
- GNU Coreutils Manual, File permissions. gnu.org/software/coreutils/manual
- AlgoMaster. *Users, Groups and Permissions*. algomaster.io/learn/operating-systems
