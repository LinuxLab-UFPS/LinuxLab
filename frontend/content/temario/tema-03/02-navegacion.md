<!-- VIDEO: video-terminal-linux | La terminal en acción: pwd, ls, cd, mkdir, touch y tree -->

## Moverse por el sistema

El sistema de archivos de Linux es una jerarquía de directorios. Moverse por ella desde la terminal requiere unos pocos comandos (NDG, 2024). Son pocos, pero aparecen en todo lo que sigue.

## pwd: ¿dónde estoy?

`pwd` (print working directory) indica cuál es el directorio actual:

```bash
pwd
```

```
/home/estudiante
```

`pwd` es la respuesta cada vez que se pierde la referencia de dónde está parada la terminal.

## ls: ¿qué hay aquí?

`ls` lista el contenido del directorio actual:

```bash
ls
```

```
Documentos  Descargas  proyectos  notas.txt
```

Con `-a` ves también los archivos ocultos, los que empiezan con un punto (Shotts, 2026):

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

`cd` (change directory) cambia el directorio actual:

```bash
cd Documentos
```

Admite rutas absolutas (desde la raíz `/`) y relativas (desde el directorio actual):

```bash
# Ruta absoluta
cd /home/estudiante/Documentos

# Ruta relativa (sube un nivel)
cd ..

# Volver al directorio de inicio directamente
cd
```

`cd` sin argumentos vuelve siempre al directorio de inicio.

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

`tree` no viene instalado en todas las distribuciones y se consigue con el gestor de paquetes. En LinuxLab ya está disponible.

<!-- SIMULATOR: travesia-del-arbol -->

## Resumen

| Comando | Efecto |
|---|---|
| `pwd` | Muestra el directorio actual |
| `ls` | Lista el contenido del directorio |
| `ls -l` | Lista con permisos, dueño, tamaño y fecha |
| `ls -a` | Incluye los archivos ocultos |
| `cd ruta` | Entra en un directorio |
| `cd ..` | Sube un nivel |
| `cd` | Vuelve al directorio de inicio |
| `mkdir nombre` | Crea un directorio |
| `touch nombre` | Crea un archivo vacío |
| `tree` | Dibuja la jerarquía completa |

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
