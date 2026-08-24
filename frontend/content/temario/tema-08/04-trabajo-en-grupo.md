## Compartir archivos con un grupo

Un grupo permite que varias personas trabajen sobre los mismos archivos sin tener que abrirlos a **otros**, que significa todo el mundo. La receta es siempre la misma: hacer a esas personas miembros de un grupo común, poner el directorio a nombre de ese grupo y ajustar sus permisos para que los miembros puedan entrar (NDG, 2024).

## Cambiar el grupo de un archivo

`chgrp` cambia el grupo dueño:

```bash
chgrp proyecto informe.txt
ls -l informe.txt
```

```
-rw-rw-r-- 1 andres_torres proyecto 42 Aug 18 11:20 informe.txt
```

A diferencia de `chown`, que cambia el usuario dueño y exige ser administrador, `chgrp` sí lo puede usar un usuario normal, con dos condiciones: **ser el dueño del archivo** y **pertenecer al grupo de destino** (Free Software Foundation, 2026). Ambas son razonables, y se comprueban con `id` cuando el comando falla:

```bash
chgrp contabilidad informe.txt
```

```
chgrp: changing group of 'informe.txt': Operation not permitted
```

## El problema del directorio compartido

Con eso ya se puede montar una carpeta común. Se crea el directorio, se le pone el grupo y se le concede escritura al grupo:

```bash
mkdir taller
chgrp proyecto taller
chmod 770 taller
ls -ld taller
```

```
drwxrwx--- 1 andres_torres proyecto 0 Aug 18 11:24 taller
```

El montaje falla en cuanto alguien crea un archivo dentro:

```bash
touch taller/notas.txt
ls -l taller/notas.txt
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 0 Aug 18 11:25 taller/notas.txt
```

El archivo nuevo no salió con el grupo `proyecto`, sino con el grupo **primario** de quien lo creó. Es lo que decía el primer subtema: el grupo primario es el que se le pone a lo que se crea. Y el resultado es que el resto del equipo no puede escribir en ese archivo, aunque el directorio sea suyo.

Corregirlo a mano con `chgrp` cada vez depende de que alguien se acuerde, así que el sistema ofrece una forma de que lo haga solo.

## setgid, la `s` del directorio

La solución es marcar el directorio para que imponga su propio grupo a todo lo que nazca dentro. Ese es el bit **setgid**, y se pone con `g+s` (Shotts, 2026):

```bash
chmod g+s taller
ls -ld taller
```

```
drwxrws--- 1 andres_torres proyecto 0 Aug 18 11:27 taller
```

Ahí está la `s`, en el lugar donde iba la `x` del bloque de grupo. No la sustituye: significa que el permiso de ejecución **sigue puesto** y que además el directorio lleva setgid.

A partir de ese momento el comportamiento es el buscado:

```bash
touch taller/segundo.txt
ls -l taller
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 0 Aug 18 11:25 notas.txt
-rw-rw-r-- 1 andres_torres proyecto     0 Aug 18 11:28 segundo.txt
```

El archivo nuevo hereda `proyecto`. El anterior no cambia: setgid actúa al crear, no hacia atrás. Los que ya existían se arreglan con `chgrp`.

En notación octal el bit es un cuarto dígito por delante, `2` para setgid, que es como aparece escrito en la documentación de administración:

```bash
chmod 2770 taller
```

## Lo que se veía desde el módulo de permisos

Este listado apareció en el tema de permisos:

```
drwxrwsr-x 1 andres_torres grp_cec1648c 0 Aug 10 22:09 apuntes
```

Esa `s` estaba ahí desde el principio. Y allí se dijo que en este laboratorio todos los archivos creados llevan el grupo del laboratorio sin necesidad de hacer nada. Ahora se puede decir por qué: el directorio personal tiene setgid con ese grupo, así que cada archivo nuevo lo hereda. No es magia del entorno, es este bit.

## Práctica

La cuenta de este laboratorio pertenece a dos grupos: el primario, que se llama igual que la cuenta, y el del curso. Eso es justo lo que hace falta, porque la herencia solo se ve cuando el directorio pertenece a un grupo **distinto** del primario. El nombre del grupo del curso lo dice `id`:

```bash
id
```

```
uid=1001(maurox1177) gid=1001(maurox1177) groups=1001(maurox1177),1002(grp_387a8af4)
```

El segundo de la lista es el del curso, y es el que va en los comandos siguientes. Primero el directorio, a nombre de ese grupo y todavía sin marcar:

```bash
mkdir compartido
chgrp grp_387a8af4 compartido
chmod 770 compartido
touch compartido/antes.txt
ls -l compartido/antes.txt
```

```
-rw-rw-r-- 1 maurox1177 maurox1177 0 Aug 24 04:24 compartido/antes.txt
```

El archivo salió con el grupo primario, no con el del directorio. Ahora el mismo montaje con setgid:

```bash
chmod g+s compartido
ls -ld compartido
touch compartido/despues.txt
ls -l compartido
```

```
drwxrws--- 1 maurox1177 grp_387a8af4 18 Aug 24 04:24 compartido
-rw-rw-r-- 1 maurox1177 maurox1177   0 Aug 24 04:24 antes.txt
-rw-rw-r-- 1 maurox1177 grp_387a8af4 0 Aug 24 04:24 despues.txt
```

Los dos archivos están en la misma carpeta y los creó la misma persona con el mismo comando. El segundo heredó el grupo del directorio porque nació después del `chmod g+s`, y el primero se quedó como estaba.

La comprobación final es un archivo creado fuera:

```bash
touch suelto.txt
ls -l suelto.txt
```

```
-rw-rw-r-- 1 maurox1177 maurox1177 0 Aug 24 04:24 suelto.txt
```

Vuelve a salir el grupo primario, que confirma que la herencia era cosa del directorio y no de la cuenta.

Para terminar, conviene no dejar rastro:

```bash
rm -r compartido suelto.txt
```

---

**Fuentes**

- Free Software Foundation. (2026). *GNU coreutils manual* (versión 9.11). https://www.gnu.org/software/coreutils/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
