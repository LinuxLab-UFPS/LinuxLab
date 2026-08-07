## Copiar, mover y borrar

Ya sabes moverte por el sistema y crear directorios. Falta lo otro: duplicar lo que necesitas, reacomodar lo que quedó mal puesto y quitar lo que sobra. Son tres comandos, y los tres trabajan igual de bien con archivos que con directorios completos.

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

### Copiar directorios

Un directorio no se copia solo con `cp`, porque implica copiar todo lo que hay dentro. Para eso está `-r` (recursive):

```bash
cp -r proyectos respaldo-proyectos
```

Sin `-r`, `cp` se niega y te avisa que omitió el directorio.

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

Para directorios, otra vez `-r`:

```bash
rm -r respaldo-proyectos
```

También existe `rmdir`, que borra un directorio **sólo si está vacío**. Falla si queda algo dentro, y por eso mismo es la opción segura cuando lo que quieres es limpiar una carpeta que ya vaciaste:

```bash
rmdir carpeta-vacia
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

## Resumen

| Comando | Qué hace | Para directorios |
|---|---|---|
| `cp origen destino` | Copia, deja el original | `cp -r` |
| `mv origen destino` | Mueve o renombra | igual, sin `-r` |
| `rm archivo` | Borra sin papelera | `rm -r` |
| `rmdir directorio` | Borra sólo si está vacío | — |

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
