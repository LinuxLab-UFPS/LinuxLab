## Copiar, mover y borrar

Crear un archivo es sólo el primer paso. El trabajo diario con el sistema de archivos consiste en duplicar, reubicar y eliminar lo que ya existe. Tres comandos cubren esas operaciones sobre archivos. Sus variantes para directorios se vieron en el módulo anterior.

## cp

`cp` (copy) recibe primero el origen y después el destino:

```bash
cp notas.txt respaldo.txt
```

Eso deja las dos: `notas.txt` sigue donde estaba y `respaldo.txt` es una copia idéntica.

Si el destino es un directorio, la copia entra ahí con su mismo nombre:

```bash
cp notas.txt Documentos/
```

Y puedes copiar varios archivos de una vez, siempre que el último argumento sea un directorio:

```bash
cp notas.txt tareas.txt informe.pdf Documentos/
```

### Cuidado al sobrescribir

Si el destino ya existe, `cp` lo reemplaza sin preguntar y sin avisar. La opción `-i` (interactive) te hace confirmar antes:

```bash
cp -i notas.txt respaldo.txt
```

```
cp: ¿sobrescribir 'respaldo.txt'? y
```

## mv

`mv` (move) usa la misma forma que `cp`, pero el original no se queda:

```bash
mv notas.txt Documentos/
```

Lo interesante es que renombrar es exactamente lo mismo que mover: cambiarle el nombre a un archivo es moverlo a otro nombre dentro del mismo directorio.

```bash
mv notas.txt apuntes.txt
```

No hay un comando `rename` separado en Linux, porque no hace falta. Y `mv` no necesita `-r` para directorios: mover una carpeta es una sola operación, no una copia de todo su contenido.

## rm

`rm` (remove) elimina archivos:

```bash
rm respaldo.txt
```

### No hay papelera

Esto es lo más importante de esta lección: **`rm` no manda nada a la papelera de reciclaje**. Lo que borras desde la terminal se borra, y no hay una carpeta donde ir a buscarlo después.

La combinación `-rf` (recursivo y forzado) es la que más daño hace, porque borra directorios enteros sin preguntar ni una vez. Es una herramienta legítima y la vas a usar, pero conviene mirar dos veces la ruta antes de darle *Enter*.

Dos costumbres que ayudan:

1. Correr `ls` sobre la ruta antes de borrarla, para confirmar que es la que crees.
2. Usar `rm -i` mientras estés aprendiendo: pregunta archivo por archivo.

```bash
rm -i respaldo.txt
```

```
rm: ¿borrar el archivo regular 'respaldo.txt'? y
```

## Comodines

Escribir los nombres uno a uno deja de ser viable en cuanto hay unos cuantos archivos. Los comodines permiten nombrar varios a la vez por su forma.

El asterisco `*` sustituye cualquier cantidad de caracteres, incluida ninguna:

```bash
ls *.txt
```

```
informe.txt
notas.txt
```

El signo de interrogación `?` sustituye exactamente un carácter:

```bash
ls foto?.png
```

```
foto2.png
```

Con `foto?.png` queda fuera `foto.png`, porque ahí no hay ningún carácter entre `foto` y el punto.

Conviene entender quién hace el trabajo: **el comodín lo resuelve el shell, no el comando**. Bash expande el patrón a la lista de nombres que coinciden y entrega esa lista ya resuelta. `echo` lo deja a la vista:

```bash
echo *.png
```

```
foto.png foto2.png
```

El comando `echo` nunca vio un asterisco. Recibió dos nombres de archivo.

Eso explica el comportamiento con `rm`:

```bash
rm *.png
```

`rm` recibe la lista completa y la borra de una vez. Es la forma habitual de limpiar por extensión, y también la razón por la que conviene comprobar el patrón antes con `ls` o `echo`: lo que esos dos muestran es exactamente lo que `rm` va a recibir.

Un patrón demasiado amplio alcanza más de lo previsto. `rm *` borra todo el contenido del directorio, y `rm *.txt` en el directorio equivocado borra los archivos equivocados.


## Resumen

| Comando | Qué hace |
|---|---|
| `cp origen destino` | Copia, deja el original |
| `mv origen destino` | Mueve o renombra |
| `rm archivo` | Borra sin papelera |
| `rm *.ext` | Borra todos los de esa extensión |

Las variantes recursivas de `cp` y `rm`, junto con `rmdir`, se cubrieron en
Operaciones con directorios.

<!-- ACTIVIDAD: limpieza-con-comodines -->

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
