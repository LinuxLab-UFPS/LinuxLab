## Quiénes somos para el sistema

Un usuario es una cuenta con la que se accede al sistema y un grupo es un conjunto de cuentas. El módulo de permisos ya trabajó con los dos, porque cada archivo lleva anotado un usuario dueño y un grupo dueño. Aquí se ve de dónde sale esa identidad y cómo se consulta.

Una cuenta no siempre corresponde a una persona. Los servicios que corren en segundo plano también tienen la suya (DevOps Daily, 2025), y eso explica buena parte de lo que aparece al listar las cuentas de un sistema.

Tres comandos responden quién es eres, y los tres funcionan sin permisos especiales (Free Software Foundation, 2026).

## whoami

Devuelve el nombre de la cuenta con la que se está trabajando:

```bash
whoami
```

```
andres_torres
```

Es la primera comprobación cuando algo falla con un *Permission denied* inesperado, porque en una sesión larga es fácil haber cambiado de cuenta y no recordarlo.

## id

Es la respuesta completa. Muestra la identidad numérica y todos los grupos:

```bash
id
```

```
uid=1004(andres_torres) gid=1006(grp_cec1648c) groups=1006(grp_cec1648c),1007(proyecto)
```

Tres datos, y conviene separarlos porque significan cosas distintas:

| Campo | Qué es |
|---|---|
| `uid` | El número de la cuenta. Es lo que el sistema compara |
| `gid` | El grupo **primario**: el que se le pone a los archivos que se crean |
| `groups` | Todos los grupos a los que se pertenece, primario incluido |

Detrás de cada nombre hay un número. El sistema trabaja con esos números, el UID y el GID, y traduce a nombres solo para mostrarlos (Shotts, 2026). Por eso al borrar una cuenta sus archivos no quedan sin dueño: siguen apuntando al mismo UID, y `ls -l` pasa a mostrar el número porque ya no hay nombre que le corresponda.

`id` también acepta el nombre de otra cuenta:

```bash
id root
```

```
uid=0(root) gid=0(root) groups=0(root)
```

El UID de `root` es `0`, y ese número es lo que le concede sus privilegios. Cualquier cuenta con UID 0 actuaría en la práctica como administrador, así que el mando está en el número y no en el nombre: renombrar la cuenta no le quitaría nada.

## Grupo primario y grupos secundarios

La distinción importa porque tiene una consecuencia práctica.

- El **grupo primario** es uno solo. Es el que el sistema le pone automáticamente a cada archivo nuevo.
- Los **grupos secundarios** son los demás. Sirven para acceder a lo que ya existe, no para marcar lo que se crea.

Se comprueba creando un archivo y mirando qué grupo le tocó:

```bash
touch prueba.txt
ls -l prueba.txt
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 0 Aug 18 11:04 prueba.txt
```

El grupo del archivo coincide con el `gid` que devolvió `id`, no con la lista completa de `groups`. Pertenecer a `proyecto` permite entrar en los archivos de ese grupo, pero no hace que lo creado salga marcado como suyo.

## groups

`groups` devuelve los mismos grupos que `id`, solo los nombres y sin los números.

```bash
groups
```

```
grp_cec1648c proyecto
```

Sirve para una comprobación rápida, y sobre todo para entender un *Permission denied*: si un archivo pertenece a un grupo que no aparece en esta lista, el bloque de permisos que se aplica es el de **otros**.

## Cambios de grupo y sesión

Un detalle que confunde la primera vez: cuando un administrador añade una cuenta a un grupo nuevo, `groups` **sigue mostrando la lista antigua**. La pertenencia se calcula al iniciar sesión y queda fija hasta la siguiente, de modo que un cambio de grupos no le llega al usuario hasta que vuelve a entrar (NDG, 2024).

```bash
groups
```

```
grp_cec1648c
```

Aunque el grupo `proyecto` ya se haya concedido, no aparece hasta cerrar la sesión y volver a entrar. El dato nuevo sí está en el sistema, y se puede consultar sin esperar:

```bash
id andres_torres
```

Preguntando por el nombre de la cuenta, `id` lee la configuración actual del sistema en lugar de la sesión en curso, y ahí sí aparece el grupo recién añadido.

## En este laboratorio

La cuenta con la que se trabaja aquí es una cuenta de Linux dentro de un sistema compartido, y cada grupo del laboratorio es un grupo de Linux con su propio GID. Por eso `id` devuelve números reales y los archivos creados llevan el grupo del laboratorio.

Eso trae una consecuencia que conviene tener clara desde ya: **esta cuenta no es administradora**. Los comandos que crean y modifican cuentas se estudian en el tercer subtema, pero ejecutarlos aquí devolverá un error de permisos. No es un fallo del entorno, es exactamente lo que le pasaría a cualquier usuario normal en cualquier servidor.

---

**Fuentes**

- DevOps Daily. (2025). *User and group management*. https://devops-daily.com/guides/introduction-to-linux/06-user-management
- Free Software Foundation. (2026). *GNU coreutils manual* (versión 9.11). https://www.gnu.org/software/coreutils/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
