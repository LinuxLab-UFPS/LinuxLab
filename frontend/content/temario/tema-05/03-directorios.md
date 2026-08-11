## Permisos sobre directorios

Las letras son las mismas, `r`, `w` y `x`, pero sobre un directorio significan otra cosa. Un directorio no es un texto que se pueda leer ni un programa que se pueda ejecutar: es una lista de nombres. Los permisos regulan qué se puede hacer con esa lista.

| Letra | Sobre un directorio |
|---|---|
| `r` | Se pueden ver los nombres que contiene |
| `x` | Se puede entrar y usarlo dentro de una ruta |
| `w` | Se pueden crear y borrar archivos, y sólo funciona junto con `x` |

Las tres se entienden mejor separándolas, que es algo que en un sistema real nunca se hace pero aquí revela cómo funciona cada una.

## r sin x

Un directorio con `r` pero sin `x` deja ver la lista de nombres y nada más:

```bash
chmod 400 caja
ls caja
```

```
dentro.txt
```

El nombre aparece. Pero cualquier intento de llegar al archivo falla, porque llegar a él implica atravesar el directorio:

```bash
cat caja/dentro.txt
```

```
cat: caja/dentro.txt: Permission denied
```

Ni siquiera `ls -l` puede completarse, porque para mostrar el tamaño y la fecha necesita consultar cada archivo:

```bash
ls -l caja
```

```
ls: cannot access 'caja/dentro.txt': Permission denied
total 0
```

## x sin r

El caso contrario es el más curioso. Sin `r` no hay lista:

```bash
chmod 100 caja
ls caja
```

```
ls: cannot open directory 'caja': Permission denied
```

Y sin embargo el contenido sigue siendo accesible para quien conozca el nombre exacto:

```bash
cat caja/dentro.txt
```

```
secreto
```

Un directorio así funciona como un pasillo a oscuras: no se puede mirar qué puertas hay, pero se abre la que se sepa nombrar.

## w sin x

El permiso de escritura por sí solo no sirve para nada:

```bash
chmod 200 caja
touch caja/nuevo.txt
```

```
touch: cannot touch 'caja/nuevo.txt': Permission denied
```

Crear un archivo exige modificar la lista de nombres del directorio, y para eso hay que entrar primero. Por eso `w` siempre va acompañado de `x`.

## La ruta entera tiene que dejar pasar

El permiso `x` sobre un directorio se comprueba en **cada** directorio de la ruta, no sólo en el último. Basta con que uno intermedio lo niegue para que todo lo que cuelga de él quede inalcanzable:

```bash
chmod 600 d/uno/dos
cat d/uno/dos/tres/final.txt
```

```
cat: d/uno/dos/tres/final.txt: Permission denied
```

El archivo no ha cambiado y su directorio tampoco. El corte está tres niveles más arriba, y ni siquiera se puede consultar:

```bash
ls -l d/uno/dos/tres/final.txt
```

```
ls: cannot access 'd/uno/dos/tres/final.txt': Permission denied
```

Devolver el permiso restablece el acceso al instante:

```bash
chmod 700 d/uno/dos
cat d/uno/dos/tres/final.txt
```

```
dato
```

Esto explica cómo funciona el aislamiento de este laboratorio. La ruta hasta tu carpeta personal atraviesa varios directorios que conceden `x` a todo el mundo pero no `r`: se puede pasar por ellos sin poder listar quién más hay. El último tramo, tu carpeta, cierra el paso a los demás. Por eso ningún compañero puede llegar a tus archivos, independientemente de los permisos que tengan los archivos en sí.

## Borrar depende del directorio, no del archivo

Ésta es la consecuencia que más sorprende, y conviene verla funcionando. Un archivo sin ningún permiso, cerrado a todo el mundo:

```bash
ls -l caja/blindado.txt
cat caja/blindado.txt
```

```
---------- 1 andres_torres grp_cec1648c 5 Aug 10 22:21 blindado.txt
cat: blindado.txt: Permission denied
```

No se puede leer ni escribir. Y aun así, con permiso de escritura sobre el directorio que lo contiene, desaparece sin una sola protesta:

```bash
chmod 700 caja
rm caja/blindado.txt
```

El motivo es que borrar no toca el archivo: quita su nombre de la lista del directorio. El permiso que se comprueba es el del directorio, no el del archivo. Poner un archivo a `000` no lo protege de ser borrado por quien pueda escribir en la carpeta donde vive.

## Los valores que se usan de verdad

Separar `r`, `w` y `x` sirve para entenderlos, pero en la práctica los directorios usan unas pocas combinaciones:

| Permiso | Significa |
|---|---|
| `700` | Privado. Sólo el dueño entra, lista y modifica |
| `750` | El grupo puede entrar y mirar, pero no modificar |
| `755` | Todo el mundo puede entrar y mirar, sólo el dueño modifica |
| `711` | Nadie lista el contenido, pero se puede atravesar hacia dentro |

Ese es también el motivo por el que un `chmod -R` con un solo número estropea las cosas. Un archivo de texto correcto es `644`, y ese mismo valor sobre un directorio le quita `x` y lo vuelve inaccesible. Un directorio correcto es `755`, y ese valor sobre un archivo de texto lo marca como ejecutable sin serlo.

## La s que aparece en tus directorios

Los directorios creados en este laboratorio se ven así:

```bash
mkdir recien
ls -ld recien
```

```
drwxrwsr-x 1 andres_torres grp_cec1648c 0 Aug 10 22:21 recien
```

En el bloque de grupo hay una `s` donde debería ir la `x`. Es un permiso especial que hace que todo lo creado dentro herede el grupo del directorio en lugar del grupo de quien lo crea. Está puesto a propósito para que los archivos del curso queden asociados al curso, viene heredado de la carpeta personal y no hay que tocarlo.

<!-- ACTIVIDAD: cerrar-el-proyecto -->

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 9: "Permissions". linuxcommand.org
- GNU Coreutils Manual, File permissions. gnu.org/software/coreutils/manual
- AlgoMaster. *Users, Groups and Permissions*. algomaster.io/learn/operating-systems
