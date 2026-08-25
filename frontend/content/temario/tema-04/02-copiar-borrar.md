## Copiar, mover y borrar

Crear un archivo es solo el primer paso. El trabajo diario con el sistema de archivos consiste en duplicar, reubicar y eliminar lo que ya existe. Tres comandos cubren esas operaciones sobre archivos. Sus variantes para directorios se vieron en el tema anterior.

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

También copia varios archivos de una vez, siempre que el último argumento sea un directorio:

```bash
cp notas.txt tareas.txt informe.pdf Documentos/
```

### Cuidado al sobrescribir

Si el destino ya existe, `cp` lo reemplaza sin preguntar y sin avisar (NDG, 2024). La opción `-i` (interactive) pide confirmación antes:

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

Lo interesante es que renombrar es exactamente lo mismo que mover: cambiarle el nombre a un archivo es moverlo a otro nombre dentro del mismo directorio (Free Software Foundation, 2026).

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

La combinación `-rf` (recursivo y forzado) es la que más daño hace, porque borra directorios enteros sin preguntar ni una vez. Es una herramienta legítima y de uso corriente, pero conviene mirar dos veces la ruta antes de darle *Enter*.

Dos costumbres que ayudan:

1. Correr `ls` sobre la ruta antes de borrarla, para confirmar que es la que crees.
2. Usar `rm -i` mientras estés aprendiendo: pregunta archivo por archivo.

```bash
rm -i respaldo.txt
```

```
rm: ¿borrar el archivo regular 'respaldo.txt'? y
```

## Resumen

| Comando | Qué hace |
|---|---|
| `cp origen destino` | Copia, deja el original |
| `mv origen destino` | Mueve o renombra |
| `rm archivo` | Borra sin papelera |

Las variantes recursivas de `cp` y `rm`, junto con `rmdir`, se cubrieron en
Operaciones con directorios. Para aplicar estos tres comandos a muchos archivos
a la vez, la lección siguiente cubre los comodines.

---

**Fuentes**

- Free Software Foundation. (2026). *GNU coreutils manual* (versión 9.11). https://www.gnu.org/software/coreutils/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
