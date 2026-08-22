<!-- VIDEO: video-intro-terminal | El prompt y los primeros comandos -->

## ¿Qué es un comando?

Un comando es un programa que, al ejecutarse en la terminal, realiza una acción sobre el sistema (NDG, 2024). Algunos son simples y se usan solos. Otros aceptan información adicional para funcionar de maneras distintas.

La estructura general de un comando es siempre la misma (The Open Group, 2024):

<div class="cmd-anatomy">
  <div class="cmd-anatomy-schema"><span class="cmd-name">comando</span> <span class="cmd-opt">[opciones]</span> <span class="cmd-arg">[argumentos]</span></div>
  <div class="cmd-anatomy-legend">
    <div><span class="cmd-name">comando</span><span>El programa que se ejecuta. Es la única parte obligatoria.</span></div>
    <div><span class="cmd-opt">[opciones]</span><span>Modifican su comportamiento. Empiezan por uno o dos guiones.</span></div>
    <div><span class="cmd-arg">[argumentos]</span><span>Aquello sobre lo que actúa: archivos, directorios, rutas, texto.</span></div>
  </div>
</div>

Las partes entre corchetes son opcionales: hay comandos que funcionan solo con su nombre. Esos tres colores se mantienen en todos los ejemplos del curso, de modo que las partes de cualquier comando se reconocen a simple vista.

`whoami` es uno de esos que no necesitan nada más. Como ya viste en el video, dice el usuario con el que se trabaja:

```bash
whoami
```

```
estudiante
```

El símbolo `$` al abrir una terminal significa que Bash está listo para recibir un comando.

```bash
usuario@linuxlab:~$
```

Ese texto antes del `$` es el **prompt**: indica el nombre de usuario, el nombre del equipo y el directorio actual. El `~` representa el directorio de inicio (home).

Si ese último carácter es `#` en lugar de `$`, la sesión tiene privilegios de administrador (Shotts, 2026). Merece la pena mirarlo antes de ejecutar cualquier cosa que toque el sistema, porque con `#` no hay red de seguridad.

Otra costumbre que hay que desaprender: <kbd>Ctrl</kbd> + <kbd>C</kbd> y <kbd>Ctrl</kbd> + <kbd>V</kbd> no copian ni pegan dentro de la terminal. Esas combinaciones ya significan otra cosa para el shell.


## Argumentos

Un **argumento** es información que le pasas al comando para que actúe sobre algo específico. Por ejemplo, `ls` sin argumentos lista el contenido del directorio actual. Si le das un argumento, lista ese directorio:

```bash
ls /etc
```

```
apt  bash.bashrc  group  hostname  hosts  passwd  profile  shadow  ssh  systemd
```

También admite varios argumentos a la vez:

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

El video mostró otro comando que trabaja con un argumento. Como ya viste, `cd` cambia de directorio y su argumento es el destino:

```bash
cd Documentos
```

`cd` no imprime nada. Su efecto se ve en el prompt, que pasa de `~` a `~/Documentos`: la respuesta del comando es el lugar nuevo. `cd` y `ls`, el comando con el que este apartado empezó, se practican a fondo en el módulo siguiente de Directorios.

## Opciones

Las **opciones** modifican el comportamiento del comando. Se escriben con un guion antes de la letra.

El ejemplo es `help`, el mismo del video: sirve para pedir ayuda sobre los comandos que el shell trae integrados. Con la opción `-d` entrega la descripción corta del comando que se le pida:

```bash
help -d cd
```

```
cd - Change the shell working directory.
```

Con `-s` entrega otra cosa: la sinopsis, la plantilla de cómo se escribe el comando y qué opciones acepta:

```bash
help -s cd
```

```
cd: cd [-L|[-P [-e]] [-@]] [dir]
```

Mismo comando, mismo tema, distinta opción: `-d` describe y `-s` muestra la sintaxis. Eso es exactamente lo que hace una opción: cambiar lo que el comando entrega.

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

Eso es equivalente a `ls -lh`. Las opciones cortas (`-h`) y largas (`--human-readable`) hacen exactamente lo mismo. Las largas son más fáciles de leer dentro de un script.

## Opciones y argumentos juntos

Opciones y argumentos se combinan en el mismo comando:

```bash
help -d cd pwd
```

```
cd - Change the shell working directory.
pwd - Print the name of the current working directory.
```

Aquí `-d` es la opción y los dos temas son los argumentos sobre los que actúa: help entrega la descripción de cada uno en orden. `pwd`, que apareció en la lista de ayuda del video, imprime el directorio donde se está trabajando.

El orden convencional es: primero las opciones, luego los argumentos. La mayoría de comandos lo esperan así.

## Resumen

| Forma | Significado |
|---|---|
| `comando` | El nombre del programa, lo único obligatorio |
| `comando argumento` | Sobre qué actúa el comando |
| `comando -o` | Opción corta, una letra |
| `comando -ab` | Varias opciones cortas combinadas |
| `comando --opcion` | Opción larga, más legible en scripts |
| `comando -o argumento` | Opciones y argumentos en la misma línea |

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
- The Open Group. (2024). *POSIX.1-2024: The Open Group base specifications issue 8*. https://pubs.opengroup.org/onlinepubs/9799919799/
