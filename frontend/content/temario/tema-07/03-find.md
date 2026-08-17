## Buscar archivos con find

`find` busca archivos y directorios. No lee lo que hay dentro: los localiza por su nombre, su tipo, su tamaño o su fecha, y escribe la ruta de cada uno.

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

`-name` compara el nombre del archivo con el patrón que se le indique. El patrón va entre comillas simples para que llegue entero hasta `find`.

```bash
find ~/actividades -name '*.txt'
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/backup/notas.txt
```

`-iname` funciona igual sin distinguir mayúsculas de minúsculas, útil cuando no se recuerda cómo estaba escrito el nombre.

## Por tipo

- `-type f`: sólo archivos
- `-type d`: sólo directorios

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

`-mtime` cuenta en días desde la última modificación, con los mismos signos. Lo modificado en las últimas veinticuatro horas:

```bash
find ~/actividades -type f -mtime -1
```

```
/home/prof_ruiz/grupos/g1/andres_torres/actividades/entrega.tar.gz
```

Para intervalos más cortos está `-mmin`, que cuenta minutos. `find ~/actividades -mmin -10` muestra lo que se tocó en los últimos diez.

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

`find` selecciona los archivos por su nombre y `grep -l` deja sólo los que además contienen el texto.

## Resumen

| Comando | Efecto |
|---|---|
| `find ruta` | Lista todo lo que hay bajo esa ruta |
| `find ruta -name '*.txt'` | Filtra por nombre |
| `find ruta -iname '*.txt'` | Igual, sin distinguir mayúsculas |
| `find ruta -type f` | Sólo archivos; `-type d` sólo directorios |
| `find ruta -size +1M` | Archivos de más de un megabyte |
| `find ruta -mtime -1` | Modificados en el último día |
| `find ruta \( A -o B \)` | Cumple una condición u otra |
| `find ruta -exec cmd {} \;` | Ejecuta un comando sobre cada resultado |
| `find ruta -delete` | Borra lo encontrado |

---

**Fuentes**

- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 17: "Searching for Files". linuxcommand.org
- GNU Findutils Manual. gnu.org/software/findutils/manual
