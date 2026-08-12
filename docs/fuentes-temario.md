# Fuentes del temario

Inventario de lo que se cita en las lecciones y de lo que se enlaza como recurso
de cada tema. Se mantiene al día conforme se escribe contenido nuevo, para poder
volcarlo después en la bibliografía del documento.

Dos cosas distintas conviven aquí. Las **fuentes** son las obras consultadas para
redactar una lección y aparecen al pie de esa lección. Los **recursos** son
materiales que se ofrecen al estudiante para ampliar, y viven en el `meta.json`
del tema.

## Fuentes recurrentes

Sostienen la mayor parte del temario y se repiten en casi todas las lecciones.

| Obra | Uso |
|---|---|
| NDG Linux Essentials. Cisco Networking Academy, 2024. | Referencia del curso. Presente en las 15 lecciones |
| Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. | Comandos y shell. linuxcommand.org, Creative Commons |
| GNU Coreutils Manual. gnu.org/software/coreutils/manual | Semántica exacta de las utilidades |

## Por tema

### 1. Introducción a Linux

| Lección | Fuentes |
|---|---|
| ¿Qué es Linux? Dónde todo empezó | Stallings, *Operating Systems*, 9th Ed., 2018 · Cisco · W3Techs, 2024 · TOP500, 2024 · Wikipedia (ES), *Historia de Linux* |
| El Kernel | Silberschatz, Galvin & Gagne, *Operating System Concepts*, 10th Ed., 2021 · Tanenbaum & Bos, *Modern Operating Systems*, 5th Ed., 2023 · Cisco · The Linux Foundation, *Kernel Development Report*, 2024 · kernel.org |
| Entorno de ventanas | Cisco · Wikipedia (ES), *Entornos de escritorio* · GNOME · KDE Plasma |
| Instalación | Instituto Linux |

Recursos: tres videos (historia, guía para novatos, instalación de Ubuntu).

### 2. La Terminal

| Lección | Fuentes |
|---|---|
| La línea de comandos | Cisco · Shotts |
| Anatomía de un comando | Cisco · Shotts |
| Variables en Bash | Cisco · Shotts, cap. 11 "The Environment" |

Recursos: hoja de comandos esenciales en PDF, curso de Bash en video, Shotts.

### 3. Directorios

| Lección | Fuentes |
|---|---|
| El sistema de archivos | Cisco · Shotts, cap. 3 "Exploring the System" · Filesystem Hierarchy Standard 3.0, 2015 |
| Navegación esencial | Cisco · Shotts |
| Operaciones con directorios | Cisco · Shotts · GNU Coreutils |
| Práctica: crea tu estructura | Cisco · Shotts |

Recursos: Shotts, simulador de rutas.

### 4. Manejo de Archivos

| Lección | Fuentes |
|---|---|
| Crear archivos | Cisco · Shotts |
| Copiar, mover y borrar | Cisco · Shotts |
| Encadenar comandos | Cisco · Barrett, *Efficient Linux at the Command Line*, 2022 · GNU Bash Reference Manual, Pipelines |
| Editores de texto | Cisco · Shotts · Vim documentation |

Recursos: Shotts, Barrett, pipes explicados con dibujos (wizardzines).

### 5. Permisos

| Lección | Fuentes |
|---|---|
| Dueño, grupo y permisos | Cisco · Shotts, cap. 9 "Permissions" · GNU Coreutils, File permissions · AlgoMaster, *Users, Groups and Permissions* |
| Cambiar permisos con chmod | Cisco · Shotts · GNU Coreutils, chmod |
| Permisos sobre directorios | Cisco · Shotts · GNU Coreutils · AlgoMaster |
| Permisos por defecto | Cisco · Shotts · GNU Coreutils · AlgoMaster |

Recursos aportados por el director del curso:

| Recurso | URL |
|---|---|
| Simulador de permisos | madarme.co/webapp/permisos.html |
| Simulador de umask | madarme.co/webapp/umask.html |

### 6. Compresión

| Lección | Fuentes |
|---|---|
| Comprimir y descomprimir | Cisco · Shotts, cap. 18 "Archiving and Backup" · GNU Gzip Manual |
| Empaquetar con tar | Cisco · Shotts, cap. 18 · GNU Tar Manual |

Recursos: Shotts, manual de referencia de GNU tar.

AlgoMaster (algomaster.io/learn/operating-systems) se usa como referencia de
apoyo, no como fuente principal: es un tutorial web sin licencia declarada, así
que se cita pero no se reproduce texto suyo.
