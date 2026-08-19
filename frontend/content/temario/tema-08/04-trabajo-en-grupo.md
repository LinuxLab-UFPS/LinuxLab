## Compartir archivos con un grupo

Un grupo permite que varias personas trabajen sobre los mismos archivos. La receta es siempre la misma: hacer a esas personas miembros de un grupo común, poner el directorio a nombre de ese grupo y ajustar sus permisos para que los miembros puedan entrar (NDG Linux Essentials, cap. 13). Sin grupos habría que conceder permisos a **otros**, que significa todo el mundo, o no conceder nada.

Este subtema arma ese montaje con lo ya visto y resuelve, de paso, un detalle que viene apareciendo desde el módulo de permisos sin explicación.

## Cambiar el grupo de un archivo

`chgrp` cambia el grupo dueño:

```bash
chgrp proyecto informe.txt
ls -l informe.txt
```

```
-rw-rw-r-- 1 andres_torres proyecto 42 Aug 18 11:20 informe.txt
```

A diferencia de `chown`, que cambia el usuario dueño y exige ser administrador, `chgrp` sí lo puede usar un usuario normal, con dos condiciones: **ser el dueño del archivo** y **pertenecer al grupo de destino** (manual de `chgrp`). Ambas son razonables, y se comprueban con `id` cuando el comando falla:

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

La solución es marcar el directorio para que imponga su propio grupo a todo lo que nazca dentro. Ese es el bit **setgid**, y se pone con `g+s`:

```bash
chmod g+s taller
ls -ld taller
```

```
drwxrws--- 1 andres_torres proyecto 0 Aug 18 11:27 taller
```

Ahí está la `s`, en el lugar donde iba la `x` del bloque de grupo. No la sustituye: significa que el permiso de ejecución **sigue puesto** y que además el directorio lleva setgid. Si apareciera una `S` mayúscula sería el aviso contrario: setgid puesto pero sin permiso de ejecución, una combinación que no sirve de nada.

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

En notación octal el bit es un cuarto dígito por delante, y por eso en la documentación de administración se ve escrito así (NDG Linux Essentials, cap. 13):

```bash
chmod 2770 taller
```

`2` es setgid, `770` los permisos de siempre.

## Lo que se veía desde el módulo de permisos

Este listado apareció en el tema de permisos:

```
drwxrwsr-x 1 andres_torres grp_cec1648c 0 Aug 10 22:09 apuntes
```

Esa `s` estaba ahí desde el principio. Y allí se dijo que en este laboratorio todos los archivos creados llevan el grupo del laboratorio sin necesidad de hacer nada. Ahora se puede decir por qué: el directorio personal tiene setgid con ese grupo, así que cada archivo nuevo lo hereda. No es magia del entorno, es este bit.

## Práctica

El montaje completo, sobre el grupo primario propio, para poder comprobarlo sin depender de nadie más. Primero el directorio con setgid:

```bash
mkdir compartido
chmod g+s compartido
ls -ld compartido
```

La `s` tiene que aparecer en el bloque de grupo. Después, un archivo dentro y la comprobación de que heredó el grupo del directorio y no otro:

```bash
touch compartido/prueba.txt
ls -l compartido/prueba.txt
```

Y la comparación que lo demuestra: un archivo creado fuera del directorio marcado.

```bash
touch suelto.txt
ls -l suelto.txt compartido/prueba.txt
```

Si los dos grupos coinciden es porque el grupo primario y el del directorio son el mismo, que es lo normal en una cuenta recién hecha. La diferencia se aprecia cuando el directorio pertenece a un grupo distinto del primario, que es exactamente el caso de un directorio de equipo.

Para terminar, conviene no dejar rastro:

```bash
rm -r compartido suelto.txt
```

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024. Cap. 13: directorio compartido con propiedad de grupo y bit setgid.
- Manuales de `chgrp` y `chmod`, apartado del bit setgid sobre directorios. man7.org/linux/man-pages
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 9: "Permissions". linuxcommand.org
