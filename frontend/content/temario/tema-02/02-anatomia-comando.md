## ¿Qué es un comando?

Un comando es un programa que, al ejecutarse en la terminal, realiza una acción sobre el sistema. Algunos son simples y se usan solos. Otros aceptan información adicional para funcionar de maneras distintas.

La estructura general de un comando es siempre la misma:

```
comando [opciones] [argumentos]
```

Las partes entre corchetes son opcionales. Hay comandos que funcionan solo con su nombre, sin nada más. Entender esta estructura es clave porque aplica a prácticamente todo lo que vas a escribir en la terminal.

## Argumentos

Un **argumento** es información que le pasas al comando para que actúe sobre algo específico. Por ejemplo, `ls` sin argumentos lista el contenido del directorio actual. Si le das un argumento, lista ese directorio:

```bash
ls /etc
```

```
apt  bash.bashrc  group  hostname  hosts  passwd  profile  shadow  ssh  systemd
```

También puedes pasar varios argumentos a la vez:

```bash
ls /etc /home
```

```
/etc:
apt  bash.bashrc  group  hostname  hosts  passwd  profile  shadow  ssh  systemd

/home:
estudiante
```

El comando recibirá los dos y procesará ambos en orden.

## Opciones

Las **opciones** modifican el comportamiento del comando. Se escriben con un guion antes de la letra:

```bash
ls -l
```

```
total 16
drwxr-xr-x 2 estudiante estudiante 4096 mar 10 09:14 Documentos
drwxr-xr-x 2 estudiante estudiante 4096 mar 10 09:14 Descargas
drwxr-xr-x 3 estudiante estudiante 4096 mar 12 11:02 proyectos
-rw-r--r-- 1 estudiante estudiante   84 mar 12 11:05 notas.txt
```

La opción `-l` hace que `ls` muestre el listado en formato largo, con información detallada de cada archivo: permisos, propietario, tamaño y fecha. Sin `-l`, solo muestra los nombres.

Puedes combinar opciones escribiéndolas juntas o separadas, el resultado es el mismo:

```bash
ls -l -r
ls -lr
ls -rl
```

```
total 16
-rw-r--r-- 1 estudiante estudiante   84 mar 12 11:05 notas.txt
drwxr-xr-x 3 estudiante estudiante 4096 mar 12 11:02 proyectos
drwxr-xr-x 2 estudiante estudiante 4096 mar 10 09:14 Descargas
drwxr-xr-x 2 estudiante estudiante 4096 mar 10 09:14 Documentos
```

En el ejemplo anterior, `-r` invierte el orden del listado. Combinado con `-l`, produces un listado largo en orden inverso.

Otra opción útil es `-h` (human-readable), que muestra los tamaños de archivo en un formato legible en lugar de bytes:

```bash
ls -lh
```

```
total 16K
drwxr-xr-x 2 estudiante estudiante 4.0K mar 10 09:14 Documentos
drwxr-xr-x 2 estudiante estudiante 4.0K mar 10 09:14 Descargas
drwxr-xr-x 3 estudiante estudiante 4.0K mar 12 11:02 proyectos
-rw-r--r-- 1 estudiante estudiante   84 mar 12 11:05 notas.txt
```

## Opciones largas

Algunos comandos, especialmente los más modernos, aceptan opciones en formato de palabra completa precedida por dos guiones:

```bash
ls -l --human-readable
```

```
total 16K
drwxr-xr-x 2 estudiante estudiante 4.0K mar 10 09:14 Documentos
drwxr-xr-x 2 estudiante estudiante 4.0K mar 10 09:14 Descargas
drwxr-xr-x 3 estudiante estudiante 4.0K mar 12 11:02 proyectos
-rw-r--r-- 1 estudiante estudiante   84 mar 12 11:05 notas.txt
```

Eso es equivalente a `ls -lh`. Las opciones cortas (`-h`) y largas (`--human-readable`) hacen exactamente lo mismo. Las largas son más fáciles de leer cuando estás escribiendo scripts.

## Opciones y argumentos juntos

Puedes combinar opciones y argumentos en el mismo comando:

```bash
ls -lh /usr/bin
```

```
total 142M
-rwxr-xr-x 1 root root 1.2M mar  1 08:00 bash
-rwxr-xr-x 1 root root  35K mar  1 08:00 cat
-rwxr-xr-x 1 root root 147K mar  1 08:00 grep
-rwxr-xr-x 1 root root 143K mar  1 08:00 ls
-rwxr-xr-x 1 root root  47K mar  1 08:00 mkdir
...
```

Aquí `-lh` son las opciones y `/usr/bin` es el argumento. El resultado es un listado largo con tamaños legibles del directorio `/usr/bin`.

El orden convencional es: primero las opciones, luego los argumentos. La mayoría de comandos lo esperan así.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
