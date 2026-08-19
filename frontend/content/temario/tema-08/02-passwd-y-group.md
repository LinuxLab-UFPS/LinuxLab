## Dónde se guarda esa información

`id` no inventa nada: lee unos archivos de texto que están en `/etc`. Saber leerlos sirve para responder preguntas que ningún comando resuelve de un tirón, como qué shell tiene una cuenta o quién pertenece a un grupo.

Son tres, y cada uno guarda una cosa distinta:

| Archivo | Qué guarda | Quién puede leerlo |
|---|---|---|
| `/etc/passwd` | Las cuentas y sus datos básicos | Todo el mundo |
| `/etc/group` | Los grupos y sus miembros | Todo el mundo |
| `/etc/shadow` | Las contraseñas cifradas | Sólo `root` |

Modificarlos a mano es posible y desaconsejado: un error de edición puede dejar a todos los usuarios sin poder iniciar sesión (NDG Linux Essentials, cap. 13). Para eso existen los comandos del siguiente subtema.

## getent, mejor que cat

Los dos primeros son texto plano y `cat` los muestra sin problema. Aun así conviene acostumbrarse a `getent`, que consulta lo mismo pero también encuentra cuentas que no están en el archivo, como las que vienen de un directorio de red (NDG Linux Essentials, cap. 13):

```bash
getent passwd andres_torres
```

```
andres_torres:x:1004:1006:Andrés Torres:/home/andres_torres:/bin/bash
```

Sin argumento devuelve la lista entera, así que se combina con lo ya conocido:

```bash
getent passwd | wc -l
```

```
48
```

## Los siete campos de /etc/passwd

La línea se lee separando por `:`. Son siempre siete, en este orden:

```
andres_torres : x : 1004 : 1006 : Andrés Torres : /home/andres_torres : /bin/bash
      │         │     │      │          │                  │                │
      │         │     │      │          │                  │                └── shell de inicio
      │         │     │      │          │                  └─────────────────── directorio personal
      │         │     │      │          └────────────────────────────────────── comentario
      │         │     │      └───────────────────────────────────────────────── GID del grupo primario
      │         │     └──────────────────────────────────────────────────────── UID
      │         └────────────────────────────────────────────────────────────── contraseña (ver abajo)
      └──────────────────────────────────────────────────────────────────────── nombre de la cuenta
```

Dos campos merecen atención.

La **`x` del segundo campo** no es la contraseña, sino una marca de que la contraseña real está en `/etc/shadow` (DevOps Daily, *User and Group Management*). Hace décadas la contraseña cifrada vivía aquí mismo, y como este archivo lo lee cualquiera, bastaba con copiarlo para atacarlo con calma. Separarla en otro archivo ilegible fue la solución.

El **último campo es el shell**, y hace de interruptor de acceso. Un valor como `/usr/sbin/nologin` significa que la cuenta existe y puede ser dueña de archivos, pero nadie puede abrir una sesión con ella:

```bash
getent passwd | grep nologin | head -3
```

```
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
```

## Cuentas de persona y cuentas de servicio

Esas tres primeras líneas no son de nadie. Son **cuentas de sistema**: existen para que los servicios que corren en segundo plano no tengan que hacerlo como `root`, de modo que si uno resulta comprometido el daño queda acotado (NDG Linux Essentials, cap. 13).

Se distinguen por el UID. En Ubuntu y Debian las cuentas de persona empiezan en **1000**; por debajo de esa cifra el rango está reservado para el sistema. La convención está escrita en `/etc/login.defs`:

```bash
grep UID_MIN /etc/login.defs
```

```
UID_MIN			 1000
```

Con eso, listar sólo las cuentas de persona es un `awk` sobre el tercer campo:

```bash
getent passwd | awk -F: '$3 >= 1000 {print $1, $3}'
```

```
andres_torres 1004
laura_pena 1005
sysadmin 1001
```

## Los cuatro campos de /etc/group

Más corto:

```bash
getent group grp_cec1648c
```

```
grp_cec1648c:x:1006:laura_pena,carlos_ruiz
```

En orden: nombre del grupo, marca de contraseña, GID y la lista de los nombres de usuario que son miembros del grupo, separados por comas (manual del archivo `group`).

Aquí está la trampa clásica, y explica una confusión muy común:

**Quien tiene el grupo como primario no aparece en esa lista.** En el ejemplo, `andres_torres` pertenece a `grp_cec1648c` —lo dijo `id` en el subtema anterior— y sin embargo su nombre no está. La razón es que su pertenencia no se guarda aquí, sino en el cuarto campo de su línea de `/etc/passwd`, el GID. La lista de `/etc/group` recoge únicamente a los miembros **secundarios**.

De ahí que contar miembros leyendo sólo `/etc/group` dé siempre de menos. Para saber los grupos reales de una cuenta, `id` es la respuesta fiable:

```bash
id laura_pena
```

## /etc/shadow, el que no se puede leer

El tercer archivo guarda las contraseñas cifradas, y por eso está cerrado:

```bash
cat /etc/shadow
```

```
cat: /etc/shadow: Permission denied
```

Ese error es el comportamiento correcto. Se comprueba con lo aprendido en el módulo de permisos:

```bash
ls -l /etc/shadow /etc/passwd
```

```
-rw-r----- 1 root shadow 1284 Aug 18 09:12 /etc/shadow
-rw-r--r-- 1 root root   2519 Aug 18 09:12 /etc/passwd
```

`/etc/passwd` deja leer a otros; `/etc/shadow` no concede nada al bloque de otros. Es el mismo mecanismo de `r`, `w` y `x` de siempre, aplicado a un archivo que importa.

Del contenido basta con saber dos cosas, porque se ven en cualquier documentación de administración. La línea tiene nueve campos: además de la contraseña cifrada, guarda las fechas que controlan su caducidad —cuándo se cambió por última vez, cuántos días puede durar, cuántos días antes se avisa—. Y sobre el estado de la cuenta, el manual del archivo es claro: si el campo de la contraseña empieza por un signo de admiración `!`, la contraseña está bloqueada (manual del archivo `shadow`). La cuenta existe y conserva sus archivos, pero no puede entrar.

---

**Fuentes**

- Manuales de los archivos `passwd`, `group` y `shadow`, sección de formatos. man7.org/linux/man-pages
- NDG Linux Essentials. Cisco Networking Academy, 2024. Cap. 13: "Managing Users and Groups".
- *User and Group Management*. DevOps Daily. devops-daily.com/guides/introduction-to-linux
