## Ordenar los resultados

Una búsqueda devuelve las líneas en el orden en que estaban en el archivo. `sort` las reordena antes de mostrarlas.

El archivo de ejemplo contiene las cinco primeras cuentas del sistema:

```bash
cat cuentas.txt
```

```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
```

```bash
sort cuentas.txt
```

```
bin:x:2:2:bin:/bin:/usr/sbin/nologin
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
root:x:0:0:root:/root:/bin/bash
sync:x:4:65534:sync:/bin:/bin/sync
sys:x:3:3:sys:/dev:/usr/sbin/nologin
```

`sort` no modifica el archivo. Escribe el resultado en la salida, así que para guardarlo hay que redirigirlo con `>`.

## Ordenar números

El orden alfabético compara carácter a carácter, de modo que `10` queda antes que `2`. La opción `-n` trata el contenido como números.

```bash
sort -n tamanos.txt
```

```
2
9
10
100
```

La opción `-r` invierte cualquier orden.

```bash
sort -n -r tamanos.txt
```

```
100
10
9
2
```

## Ordenar por una columna

Muchos archivos del sistema guardan varios datos en cada línea, separados por un carácter fijo. Dos opciones permiten ordenar por uno de esos datos:

- `-t`: indica cuál es el carácter separador
- `-k`: indica qué campo se usa para ordenar, contando desde 1

El archivo de cuentas usa dos puntos como separador y guarda el número de usuario en el tercer campo.

```bash
sort -t: -n -k3 cuentas.txt
```

```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
```

Sin `-t:` el separador sería el espacio en blanco y la línea entera contaría como un solo campo.

Se pueden indicar varios `-k` para desempatar. En este archivo separado por comas, cada línea lleva año, sistema y autor:

```bash
cat sistemas.csv
```

```
1970,Unix,Ritchie
1987,Minix,Tanenbaum
1970,Unix,Thompson
1991,Linux,Torvalds
```

```bash
sort -t, -k2 -k1n -k3 sistemas.csv
```

```
1991,Linux,Torvalds
1987,Minix,Tanenbaum
1970,Unix,Ritchie
1970,Unix,Thompson
```

Ordena por sistema. Cuando dos líneas tienen el mismo sistema, decide el año como número, y si aún coinciden, el autor. La letra `n` pegada al número del campo aplica el orden numérico sólo a ese campo.

## Contar repeticiones

`uniq -c` cuenta las líneas repetidas, pero sólo detecta las que están seguidas. Por eso se usa después de `sort`, que es lo que junta las iguales.

```bash
sort respuestas.txt | uniq -c
```

```
      3 no
     14 si
```

Combinado con `grep`, responde a la pregunta de qué se repite más en un archivo largo:

```bash
grep -o 'ERROR\|AVISO' bitacora.txt | sort | uniq -c | sort -n -r
```

```
     14 ERROR
      3 AVISO
```

La opción `-o` de `grep` imprime cada coincidencia en su propia línea, en lugar de la línea completa. Después `sort` agrupa, `uniq -c` cuenta y el último `sort` deja arriba lo más frecuente.

<!-- SIMULATOR: despliegue-del-viernes -->

## Resumen

| Comando | Efecto |
|---|---|
| `sort archivo` | Orden alfabético |
| `sort -n` | Orden numérico |
| `sort -r` | Invierte el orden |
| `sort -t: -k3` | Ordena por el tercer campo, separado por `:` |
| `sort -k1n -k3` | Varios criterios, por orden de prioridad |
| `uniq -c` | Cuenta líneas repetidas seguidas |
| `sort \| uniq -c \| sort -n -r` | Lista lo más repetido primero |

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. Cap. 20: "Text Processing". linuxcommand.org
- GNU Coreutils Manual, secciones "sort" y "uniq". gnu.org/software/coreutils/manual
