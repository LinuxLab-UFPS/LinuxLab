## head y tail

`cat` vuelca el archivo entero de un golpe. Con veinte líneas va bien; con cinco mil, la terminal se llena y sólo alcanzas a ver el final.

Lo que hace falta son comandos que muestren un pedazo, y una forma de conectarlos entre sí.

`head` muestra las primeras líneas de un archivo. Por defecto son diez:

```bash
head materia.txt
```

`tail` hace lo mismo con las últimas:

```bash
tail materia.txt
```

Los dos aceptan `-n` para pedir otra cantidad:

```bash
head -n 3 materia.txt
```

`tail` es el que más se usa en el día a día. Los archivos que crecen —los registros del sistema, por ejemplo— escriben al final, así que lo último es lo que acaba de pasar.

## wc

`wc` (*word count*) cuenta líneas, palabras y caracteres:

```bash
wc materia.txt
```

```
 2  4 37 materia.txt
```

Dos líneas, cuatro palabras, 37 caracteres. Casi siempre lo que interesa es el conteo de líneas, y para eso está `-l`:

```bash
wc -l materia.txt
```

```
2 materia.txt
```

## El pipe

Hasta aquí cada comando recibe un archivo y escribe en la pantalla. El carácter `|` —el *pipe*, o tubería— cambia el destino: en vez de imprimir, la salida de un comando se convierte en la entrada del siguiente.

Míralo con un directorio grande. `/etc` es donde el sistema guarda su configuración y tiene cientos de entradas:

```bash
ls /etc
```

Eso llena la pantalla y te deja viendo el final de la lista. Ahora conéctalo con `head`:

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

La lista completa nunca llegó a la pantalla: `ls` se la pasó a `head`, y `head` imprimió las diez primeras.

Fíjate en lo que acaba de pasar. Antes le dabas un archivo a `head`; ahora no le diste ninguno y funcionó igual. Un comando que no recibe archivo lee de su entrada, y el pipe es lo que la llena.

Eso explica un uso que se vuelve costumbre:

```bash
ls | wc -l
```

```
7
```

`wc` no está contando las líneas de un archivo: cuenta lo que `ls` le pasó. Siete archivos en el directorio, sin abrir nada.

## Encadenar varios comandos

Se pueden poner los que quieras, uno detrás de otro. Cada comando ve sólo lo que le entregó el anterior:

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

Las primeras veinte entradas, y de esas, las últimas cinco. O sea, de la 16 a la 20.

## El orden de los factores, si altera el producto

Esta es la parte que hay que entender de verdad, y se ve mejor con `nl`, que numera las líneas que recibe.

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

Las líneas son las mismas, los números no. En el primero se numeró la lista completa y después se recortó, así que los números son los que a esas líneas les tocaban dentro del total. En el segundo se recortó primero, y `nl` numeró tres líneas que ya venían sueltas: para él eran todo lo que había.

Ninguno está mal. Son preguntas distintas: *¿en qué posición del listado están estas tres?* contra *¿cuántas son?*

## Pipe y redirección

Los dos cambian a dónde va la salida, y se confunden seguido:

| | Manda la salida a | Ejemplo |
|---|---|---|
| `>` | un archivo | `ls /etc > listado.txt` |
| `|` | otro comando | `ls /etc \| head` |

Se combinan, porque el pipe encadena y la redirección cierra:

```bash
ls /etc | head -n 20 > primeras.txt
```

Los veinte primeros nombres quedan guardados en `primeras.txt`, sin pasar por la pantalla.

## Tu turno

AEste botón copia algo a tu portapapeles. No vas a ver qué es: eso lo descubres cuando lo tengas dentro de un archivo.

<!-- COPIAR: logo-ufps -->

Guárdalo esto en un archivo llamado `logo.txt` en tu carpeta personal usando `cat`

Primero ejecuta:
```bash
cat > logo.txt
```

Luego pega con <kbd>Ctrl</kbd> + <kbd>V</kbd>, dale *Enter*, y cierra la entrada con <kbd>Ctrl</kbd> + <kbd>D</kbd>.

Si tu teclado no responde al pegar, prueba <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>: es el atajo propio de las terminales, porque ahí <kbd>Ctrl</kbd> + <kbd>V</kbd> significaba otra cosa desde antes de que existiera copiar y pegar.

Después míralo:

```bash
cat logo.txt
```

<!-- EJERCICIO: logo-ufps -->

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Barrett, D. J. *Efficient Linux at the Command Line*. O'Reilly Media, 2022.
- GNU. *Bash Reference Manual* — Pipelines. gnu.org/software/bash/manual
