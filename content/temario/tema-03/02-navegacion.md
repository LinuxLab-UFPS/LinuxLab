<!-- VIDEO: video-terminal-linux | La terminal en acción: pwd, ls, cd, mkdir, touch y tree -->

## Moverse por el sistema

El sistema de archivos de Linux es una jerarquía de directorios. Para moverte por ella desde la terminal necesitas saber usar ciertos comandos. No son muchos, pero los vas a usar todo el tiempo.

## pwd: ¿dónde estoy?

`pwd` (print working directory) te dice en qué directorio estás en este momento:

```bash
pwd
```

```
/home/estudiante
```

Siempre que no sepas dónde estás parado, `pwd` te lo dice.

## ls: ¿qué hay aquí?

`ls` lista el contenido del directorio actual:

```bash
ls
```

```
Documentos  Descargas  proyectos  notas.txt
```

Con `-a` ves también los archivos ocultos, los que empiezan con un punto:

```bash
ls -a
```

```
.  ..  .bashrc  .profile  Documentos  Descargas  proyectos  notas.txt
```

Combinándolo con el `-l` como ya vimos anteriormente, obtienes todo el contenido del directorio, incluidos los ocultos, con sus permisos, tamaño y fecha.

```bash
ls -la
```

```
total 32
drwxr-xr-x 5 estudiante estudiante 4096 mar 12 11:05 .
drwxr-xr-x 3 root       root       4096 mar  1 08:00 ..
-rw-r--r-- 1 estudiante estudiante  220 mar  1 08:00 .bashrc
-rw-r--r-- 1 estudiante estudiante  807 mar  1 08:00 .profile
drwxr-xr-x 2 estudiante estudiante 4096 mar 10 09:14 Documentos
drwxr-xr-x 2 estudiante estudiante 4096 mar 10 09:14 Descargas
drwxr-xr-x 3 estudiante estudiante 4096 mar 12 11:02 proyectos
-rw-r--r-- 1 estudiante estudiante   84 mar 12 11:05 notas.txt
```

## cd: moverse entre directorios

`cd` (change directory) te mueve a otro directorio:

```bash
cd Documentos
```

Puedes usar rutas absolutas (desde la raíz `/`) o relativas (desde donde estás):

```bash
# Ruta absoluta
cd /home/estudiante/Documentos

# Ruta relativa (sube un nivel)
cd ..

# Volver al directorio de inicio directamente
cd
```

`cd` sin argumentos siempre te lleva a tu directorio de inicio.

## mkdir: crear un directorio

`mkdir` (make directory) crea un nuevo directorio:

```bash
mkdir proyectos
```

Para crear una ruta de directorios anidados de una sola vez, usa `-p`:

```bash
mkdir -p proyectos/linux/practicas
```

Sin `-p`, si alguno de los directorios intermedios no existe, el comando falla.

## touch:  crear un archivo vacío

`touch` crea un archivo vacío si no existe, o actualiza su fecha de modificación si ya existe:

```bash
touch notas.txt
```

Es útil para crear archivos de forma rápida antes de editarlos, o para marcar que un archivo fue "tocado" en cierta fecha.

## tree:  ver la estructura completa

`tree` muestra el contenido de un directorio y todos sus subdirectorios en forma de árbol. No viene instalado por defecto en todas las distribuciones, pero es uno de los comandos más útiles para entender cómo está organizado el sistema:

```bash
tree proyectos
```

```
proyectos
└── linux
    └── practicas
```

Si no tienes `tree` instalado puedes conseguirlo con el gestor de paquetes de tu distribución. En LinuxLab ya está disponible.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
