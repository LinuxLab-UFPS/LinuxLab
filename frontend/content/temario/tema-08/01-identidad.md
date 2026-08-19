## Quién es uno para el sistema

El módulo de permisos dejó una pregunta a medias. Cada archivo lleva anotado un usuario dueño y un grupo dueño, y el sistema decide qué se puede hacer según a cuál de los dos se pertenezca. Falta la otra mitad: qué es exactamente un usuario, qué es un grupo y de dónde sale la identidad que el sistema compara.

Tres comandos responden eso, y los tres funcionan sin permisos especiales.

## whoami

Devuelve el nombre de la cuenta con la que se está trabajando:

```bash
whoami
```

```
andres_torres
```

Parece poco, pero es la primera comprobación cuando algo falla con un *Permission denied* inesperado: en una sesión larga es fácil haber cambiado de cuenta y no recordarlo.

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

Detrás de cada nombre hay un número. El sistema trabaja con esos números —el UID y el GID— y traduce a nombres sólo para mostrarlos. Por eso al borrar una cuenta sus archivos no quedan sin dueño: siguen apuntando al mismo UID, y `ls -l` pasa a mostrar el número porque ya no hay nombre que le corresponda.

`id` también acepta el nombre de otra cuenta:

```bash
id root
```

```
uid=0(root) gid=0(root) groups=0(root)
```

El UID de `root` es `0`, y ese cero es lo que le da el mando. No es el nombre: cualquier cuenta con UID 0 tendría los mismos privilegios.

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

Es la versión corta: sólo los nombres, sin números.

```bash
groups
```

```
grp_cec1648c proyecto
```

Sirve para una comprobación rápida, y sobre todo para entender un *Permission denied*: si un archivo pertenece a un grupo que no aparece en esta lista, el bloque de permisos que se aplica es el de **otros**.

## Cambios de grupo y sesión

Un detalle que confunde la primera vez: cuando un administrador añade una cuenta a un grupo nuevo, `groups` **sigue mostrando la lista antigua**. La pertenencia se calcula al iniciar sesión y queda fija hasta la siguiente.

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

Nada de esto es una simulación. La cuenta con la que se trabaja aquí es una cuenta de Linux de verdad dentro de un sistema compartido, y cada grupo del curso es un grupo de Linux con su propio GID. Por eso `id` devuelve números reales y los archivos creados llevan el grupo del curso.

Eso trae una consecuencia que conviene tener clara desde ya: **esta cuenta no es administradora**. Los comandos que crean y modifican cuentas se estudian en el tercer subtema, pero ejecutarlos aquí devolverá un error de permisos. No es un fallo del entorno, es exactamente lo que le pasaría a cualquier usuario normal en cualquier servidor.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024. Cap. 13: "Managing Users and Groups".
- man7.org — `id(1)`, `groups(1)`, `whoami(1)`.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 9: "Permissions". linuxcommand.org
