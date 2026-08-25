Así está organizado por dentro cualquier sistema Linux, desde un portátil hasta el servidor más grande:

<!-- FS-TREE -->

## Todo es un archivo

En Linux, todo se representa como un archivo: los programas, los dispositivos de hardware, las conexiones de red. Los directorios son un tipo especial de archivo cuya función es contener a otros archivos. Esta idea parece abstracta al principio, pero explica por qué en Linux todo se manipula de la misma manera desde la terminal.

## La jerarquía del sistema de archivos

El sistema de archivos de Linux tiene un único punto de partida llamado directorio raíz, representado por el carácter `/`. A partir de ahí, todos los directorios se ramifican hacia abajo formando una jerarquía. A diferencia de Windows, en Linux no existen letras de unidad como `C:\` o `D:\`. Cada dispositivo físico, incluyendo discos, memorias USB y particiones, se integra dentro de esta misma jerarquía bajo un directorio (NDG, 2024).

Para ver qué contiene el directorio raíz:

```bash
ls /
```

```
bin   boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
```

Cada directorio tiene una función definida por el estándar FHS (The Linux Foundation, 2015). Algunos de los más relevantes contienen:

- `/bin` Comandos esenciales disponibles para todos los usuarios
- `/boot` Archivos necesarios para arrancar el sistema
- `/etc` Archivos de configuración del sistema y los servicios
- `/home` Directorios personales de los usuarios
- `/root` Directorio home del usuario administrador
- `/tmp` Archivos temporales (se borran al reiniciar)
- `/usr` Programas, librerías y documentación de uso general
- `/var` Datos que cambian constantemente: logs, colas, bases de datos

## El directorio home

Dentro de `/home` hay un subdirectorio por cada usuario del sistema. El nombre del subdirectorio coincide con el nombre del usuario: si el usuario es `estudiante`, su directorio personal es `/home/estudiante`.

El directorio home es especial por dos razones. Primero, al abrir una terminal el shell parte de ahí automáticamente. Segundo, es el único lugar del sistema donde el usuario tiene control total para crear, modificar y eliminar archivos sin necesitar permisos especiales. La mayoría de los otros directorios del sistema están protegidos con permisos de archivo que impiden modificaciones accidentales.

Los permisos se estudian en detalle más adelante en el curso.

## El símbolo ~

El carácter `~` representa el directorio home del usuario actual. Es más cómodo que escribir la ruta completa cada vez:

```bash
cd ~
pwd
```

```
/home/estudiante
```

También sirve para referirse al home de otro usuario:

```bash
ls ~root
```

Esto equivale a escribir `ls /root`.

## Rutas absolutas y relativas

Hay dos formas de indicar la ubicación de un archivo o directorio en el sistema.

Una **ruta absoluta** comienza siempre desde la raíz `/` y describe la ubicación completa sin importar cuál sea el directorio actual:

```bash
cd /home/estudiante/Documentos
```

Una **ruta relativa** parte desde el directorio actual. No empieza con `/`, sino con el nombre del directorio de destino, o con `.` (directorio actual) o `..` (directorio superior):

```bash
# Si ya estás en /home/estudiante:
cd Documentos

# Equivalente explícito:
cd ./Documentos

# Subir un nivel y entrar a otro directorio:
cd ../otro-usuario
```

La diferencia clave: las rutas absolutas siempre funcionan desde cualquier lugar, las relativas dependen de dónde estés parado (Shotts, 2026).

**Fuentes**

- The Linux Foundation. (2015). *Filesystem hierarchy standard* (versión 3.0). https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
