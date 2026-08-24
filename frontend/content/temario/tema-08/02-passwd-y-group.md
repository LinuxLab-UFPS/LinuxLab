## Dónde se guarda esa información

`id` toma la información de unos archivos de texto que están en `/etc`. Leerlos directamente responde preguntas que ningún comando resuelve de un tirón, como qué shell tiene una cuenta o quién pertenece a un grupo.

Son tres, y cada uno guarda una cosa distinta:

| Archivo | Qué guarda | Quién puede leerlo |
|---|---|---|
| `/etc/passwd` | Las cuentas y sus datos básicos | Todo el mundo |
| `/etc/group` | Los grupos y sus miembros | Todo el mundo |
| `/etc/shadow` | Las contraseñas cifradas | Solo `root` |

Modificarlos a mano es posible y desaconsejado: un error de edición puede dejar a todos los usuarios sin poder iniciar sesión (NDG, 2024). Para eso existen los comandos del siguiente subtema.

## getent, mejor que cat

Los dos primeros son texto plano y `cat` los muestra sin problema. Aun así conviene acostumbrarse a `getent`, que consulta lo mismo pero también encuentra cuentas que no están en el archivo, como las que vienen de un directorio de red:

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

La **`x` del segundo campo** es una marca de que la contraseña real está en `/etc/shadow` (DevOps Daily, 2025). Antes vivía aquí mismo, y como este archivo lo lee cualquiera, bastaba con copiarlo para atacarlo con calma: de ahí que se separara a otro archivo ilegible.

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

Esas tres líneas son **cuentas de sistema**, y existen para que los servicios que corren en segundo plano no lo hagan como `root`: si uno resulta comprometido, el daño queda acotado.

Se distinguen por el UID. En Ubuntu y Debian las cuentas de persona empiezan en **1000**; por debajo de esa cifra el rango está reservado para el sistema. La convención está escrita en `/etc/login.defs`:

```bash
grep UID_MIN /etc/login.defs
```

```
UID_MIN			 1000
```

Con eso, listar solo las cuentas de persona es un `awk` sobre el tercer campo:

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

En orden: nombre del grupo, marca de contraseña, GID y la lista de los nombres de usuario que son miembros del grupo, separados por comas (Shadow Project, 2026).

El cuarto campo tiene una particularidad que suele confundir:

**Quien tiene el grupo como primario no aparece en esa lista.** En el ejemplo, `andres_torres` pertenece a `grp_cec1648c`, como mostró `id` en el subtema anterior, y sin embargo su nombre no está. La razón es que su pertenencia no se guarda aquí, sino en el cuarto campo de su línea de `/etc/passwd`, el GID. La lista de `/etc/group` recoge únicamente a los miembros **secundarios**.

De ahí que contar miembros leyendo solo `/etc/group` dé siempre de menos. Para saber los grupos reales de una cuenta, `id` es la respuesta fiable:

```bash
id laura_pena
```

```
uid=1005(laura_pena) gid=1005(laura_pena) groups=1005(laura_pena),1006(grp_cec1648c)
```

Ahí aparecen los dos: su grupo primario, que se llama igual que la cuenta, y `grp_cec1648c`, en el que figura como miembro secundario.

## /etc/shadow, el que no se puede leer

El tercer archivo guarda las contraseñas cifradas, y por eso está cerrado incluso a la lectura (Shotts, 2026):

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

`/etc/passwd` deja leer a otros y `/etc/shadow` no concede nada a ese bloque: es el mismo mecanismo de `r`, `w` y `x` de siempre, aplicado a un archivo que importa.

Del contenido basta con saber dos cosas. La línea tiene nueve campos, y además de la contraseña cifrada guarda las fechas que controlan su caducidad: cuándo se cambió por última vez, cuántos días puede durar y cuántos días antes se avisa. Y si el campo de la contraseña empieza por un signo de admiración `!`, está bloqueada: la cuenta existe y conserva sus archivos, pero no puede entrar.

---

**Fuentes**

- DevOps Daily. (2025). *User and group management*. https://devops-daily.com/guides/introduction-to-linux/06-user-management
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shadow Project. (2026). *Shadow utilities* (versión 4.20.2). https://github.com/shadow-maint/shadow
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
