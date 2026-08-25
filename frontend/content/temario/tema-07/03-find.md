<!-- VIDEO: video-find | Buscar archivos con find -->

## Buscar archivos con find

`find` busca archivos y directorios. No lee lo que hay dentro: los localiza por su nombre, su tipo, su tamaño o su fecha, y escribe la ruta de cada uno (Free Software Foundation, 2026).

Recibe siempre una ruta por donde empezar y busca ahí y en todo lo que cuelga de esa ruta. Sin más condiciones, devuelve todo lo que encuentra.

```bash
find ~/actividades
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/notas.txt
/home/prof_ruiz/grupos/g1/andres_torres/actividades/entrega.tar.gz
```

Cada condición que se añade recorta esa lista.

## Por nombre

`-name` compara el nombre del archivo con un patrón. Los comodines son los mismos del tema de manejo de archivos:

| Patrón | Coincide con |
|---|---|
| `*` | Cualquier cantidad de caracteres, incluida ninguna |
| `?` | Exactamente un carácter |
| `[0-9]` | Un carácter de la lista, aquí un dígito |

El patrón va entre comillas simples. Sin ellas el shell lo resuelve antes con los archivos del directorio actual, y `find` termina buscando un nombre concreto en lugar del patrón.

```bash
find ~/actividades -name '*.txt'
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/notas.txt
```

`-iname` funciona igual sin distinguir mayúsculas de minúsculas, útil cuando no se recuerda cómo estaba escrito el nombre.

## Por tipo

- `-type f`: solo archivos
- `-type d`: solo directorios

```bash
find ~/actividades -type d
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup
```

## Por tamaño

`-size` filtra por lo que ocupa el archivo. El sufijo indica la unidad: `k` para kilobytes, `M` para megabytes y `G` para gigabytes. El signo `+` significa "más de" y el signo `-` significa "menos de".

```bash
find ~ -type f -size +1M
```

```
/home/prof_ruiz/grupos/g1/andres_torres/videos/practica.mp4
```

Es la forma habitual de averiguar qué está ocupando el espacio de una cuenta.

## Por fecha

`-mtime` cuenta en días desde la última modificación, con los mismos signos (DevOps Daily, 2025). Lo modificado en las últimas veinticuatro horas:

```bash
find ~/actividades -type f -mtime -1
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/entrega.tar.gz
```

El signo funciona igual que en `-size`: `-mtime +30` son los archivos de más de treinta días, los que llevan un mes sin tocarse.

```bash
find ~/actividades -type f -mtime +30
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/borrador-viejo.txt
```

Para intervalos más cortos está `-mmin`, que cuenta minutos en lugar de días. Es lo que sirve para encontrar lo que alguien acaba de tocar:

```bash
find ~/actividades -mmin -60
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/notas.txt
```

## Combinar condiciones

Varias condiciones seguidas deben cumplirse todas.

```bash
find ~/actividades -type f -name '*.log' -size +10k
```

Para aceptar una condición u otra se usa `-o`, y el grupo se encierra entre paréntesis escapados.

```bash
find ~/actividades -type f \( -name '*.log' -o -name '*.txt' \)
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/notas.txt
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/sesion.log
```

## Ejecutar un comando sobre lo encontrado

`-exec` ejecuta un comando sobre cada resultado. Las llaves `{}` representan el archivo encontrado y `\;` cierra el comando.

```bash
find ~/actividades -name '*.tmp' -exec rm {} \;
```

Para el caso concreto de borrar existe `-delete`, que hace lo mismo y se escribe más corto:

```bash
find ~/actividades -name '*.tmp' -delete
```

Antes de borrar conviene ejecutar la búsqueda sola. La lista que aparece es exactamente lo que va a recibir el borrado.

## Buscar archivos y luego buscar dentro

Los dos comandos del tema se combinan cuando la pregunta tiene dos partes: qué archivos son y cuáles de ellos contienen cierto texto.

```bash
find ~/actividades -name '*.log' -exec grep -l 'disco lleno' {} \;
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/sesion.log
```

`find` selecciona los archivos por su nombre y `grep -l` deja solo los que además contienen el texto.

## Resumen

| Comando | Efecto |
|---|---|
| `find ruta` | Lista todo lo que hay bajo esa ruta |
| `find ruta -name '*.txt'` | Filtra por nombre |
| `find ruta -iname '*.txt'` | Igual, sin distinguir mayúsculas |
| `find ruta -type f` | Solo archivos; `-type d` solo directorios |
| `find ruta -size +1M` | Archivos de más de un megabyte |
| `find ruta -mtime -1` | Modificados en el último día |
| `find ruta -mtime +30` | Sin tocar desde hace más de un mes |
| `find ruta -mmin -60` | Modificados en la última hora |
| `find ruta \( A -o B \)` | Cumple una condición u otra |
| `find ruta -exec cmd {} \;` | Ejecuta un comando sobre cada resultado |
| `find ruta -delete` | Borra lo encontrado |

---

**Fuentes**

- DevOps Daily. (2025). *Linux file system hierarchy*. https://devops-daily.com/guides/introduction-to-linux/04-file-system-hierarchy
- Free Software Foundation. (2026). *GNU findutils manual* (versión 4.11). https://www.gnu.org/software/findutils/manual/
