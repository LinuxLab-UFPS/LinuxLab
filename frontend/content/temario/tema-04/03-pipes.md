## head y tail

El comando `cat` imprime el contenido completo de un archivo. En archivos cortos resulta práctico, pero en uno de varios miles de líneas la salida desborda la pantalla y sólo queda visible el final.

Para esos casos existen comandos que muestran una porción del archivo.

`head` imprime las primeras líneas. Por defecto son diez:

```bash
head materia.txt
```

`tail` imprime las últimas:

```bash
tail materia.txt
```

Ambos aceptan la opción `-n` para indicar otra cantidad:

```bash
head -n 3 materia.txt
```

`tail` es el más frecuente en administración de sistemas. Los archivos que crecen durante la operación del sistema, como los registros en `/var/log`, escriben al final, de modo que las últimas líneas corresponden a los eventos más recientes.

## wc

`wc` (*word count*) cuenta líneas, palabras y caracteres:

```bash
wc materia.txt
```

```
 2  4 37 materia.txt
```

El resultado indica dos líneas, cuatro palabras y 37 caracteres. La opción `-l` limita el conteo a las líneas:

```bash
wc -l materia.txt
```

```
2 materia.txt
```

## El pipe

Los comandos anteriores reciben un archivo como argumento y escriben el resultado en la pantalla. El carácter `|`, llamado *pipe* o tubería, redirige ese resultado: la salida de un comando se convierte en la entrada del siguiente.

El directorio `/etc` almacena la configuración del sistema y contiene cientos de entradas:

```bash
ls /etc
```

La salida ocupa más de una pantalla. Conectada a `head`, el resultado se reduce a las primeras diez líneas:

```bash
ls /etc | head
```

```
adduser.conf
alternatives
apparmor.d
apt
bash.bashrc
bindresvport.blacklist
binfmt.d
ca-certificates
ca-certificates.conf
cloud
```

La lista completa nunca llega a la pantalla. `ls` la entrega a `head`, y `head` imprime las diez primeras líneas.

En este último comando `head` no recibió ningún archivo como argumento. Cuando un comando no recibe archivo, lee de su entrada estándar, y el pipe es lo que la alimenta.

De ahí surge una combinación habitual:

```bash
ls | wc -l
```

```
7
```

`wc` no cuenta las líneas de un archivo, sino las que recibió de `ls`. El resultado es la cantidad de archivos del directorio.

## Encadenar varios comandos

Un mismo comando admite varios pipes consecutivos. Cada comando procesa únicamente lo que recibe del anterior:

```bash
ls /etc | head -n 20 | tail -n 5
```

```
debian_version
default
deluser.conf
dhcp
dpkg
```

El resultado son las primeras veinte entradas, y de esas, las últimas cinco: las posiciones 16 a 20.

## El orden de los factores, si altera el producto

El comando `nl` numera las líneas que recibe. Comparar dos encadenamientos con los mismos comandos en distinto orden muestra el efecto:

```bash
ls /etc/ssh | nl | tail -n 3
```

```
    12  ssh_import_id
    13  sshd_config
    14  sshd_config.d
```

```bash
ls /etc/ssh | tail -n 3 | nl
```

```
     1  ssh_import_id
     2  sshd_config
     3  sshd_config.d
```

Las líneas coinciden, la numeración no. En el primer caso `nl` numeró la lista completa y `tail` recortó después, así que los números corresponden a la posición dentro del total. En el segundo, `tail` recortó primero y `nl` numeró tres líneas aisladas.

Ninguno de los dos es incorrecto. Responden a preguntas distintas: la posición de esas tres entradas dentro del listado, frente a cuántas son.

## Pipe y redirección

Ambos operadores cambian el destino de la salida y suelen confundirse:

| | Envía la salida a | Ejemplo |
|---|---|---|
| `>` | un archivo, reemplazando lo que hubiera | `ls /etc > listado.txt` |
| `>>` | un archivo, después de lo que ya hay | `ls /etc/ssh >> listado.txt` |
| `|` | otro comando | `ls /etc \| head` |

La diferencia entre `>` y `>>` importa cuando el archivo se arma por partes. Con `>` cada comando borra el resultado del anterior y sólo sobrevive el último; con `>>` se van acumulando en el orden en que se ejecutan.

Los tres se combinan en un mismo comando. El pipe encadena y la redirección cierra:

```bash
ls /etc | head -n 20 > primeras.txt
```

Los veinte primeros nombres quedan guardados en `primeras.txt` sin pasar por la pantalla.

## Práctica

El siguiente botón copia un bloque de texto al portapapeles. (Su contenido es una sorpresa)

<!-- COPIAR: logo-ufps -->

El objetivo es guardarlo en un archivo llamado `logo.txt` dentro del directorio personal, usando `cat` y el operador de redirección.

```bash
cat > logo.txt
```

Sin archivo como argumento, `cat` lee de la entrada estándar y `>` envía esa entrada a `logo.txt`. La terminal queda a la espera de texto.

El siguiente paso es pegar el contenido con <kbd>Ctrl</kbd> + <kbd>V</kbd>, pulsar *Enter* para cerrar la última línea y terminar la entrada con <kbd>Ctrl</kbd> + <kbd>D</kbd>.

En las terminales el atajo de pegado también es <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>, porque <kbd>Ctrl</kbd> + <kbd>V</kbd> tenía otra función antes de que existiera el portapapeles.

El resultado se comprueba con:

```bash
cat logo.txt
```

<!-- EJERCICIO: logo-ufps -->

<!-- ACTIVIDAD: mensaje-oculto -->

## Resumen

| Comando | Efecto |
|---|---|
| `head archivo` | Las primeras diez líneas |
| `head -n 3 archivo` | Las primeras tres |
| `tail archivo` | Las últimas diez líneas |
| `wc -l archivo` | Cuenta las líneas |
| `comando \| otro` | Pasa la salida del primero como entrada del segundo |
| `comando > archivo` | Guarda la salida en un archivo |
| `comando >> archivo` | Añade la salida al final del archivo |

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Barrett, D. J. *Efficient Linux at the Command Line*. O'Reilly Media, 2022.
- GNU. *Bash Reference Manual*, Pipelines. gnu.org/software/bash/manual
