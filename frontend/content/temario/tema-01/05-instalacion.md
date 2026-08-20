## ¿Qué es una distribución?

Linux no viene en una sola versión. El Kernel es el núcleo, pero un sistema operativo completo y usable necesita mucho más: un gestor de paquetes para instalar software, herramientas del sistema, un entorno gráfico, configuraciones por defecto. Quien empaqueta todo eso junto y lo distribuye es lo que se llama una **distribución** (o simplemente "distro"). Además del Kernel y las herramientas, incluye lo necesario para preparar el disco, instalar el sistema y, después, añadir o quitar software con un gestor de paquetes (NDG, 2024).

Por eso existen tantas. Cada distribución toma el mismo Kernel y lo combina con diferentes herramientas, filosofías y públicos objetivo. Casi todas las que se usan hoy descienden de tres troncos: Red Hat, Debian y Slackware. La diferencia más visible entre ellos es el gestor de paquetes. Ubuntu apunta a la facilidad de uso. Fedora va hacia desarrolladores que quieren lo más reciente. Arch es para quien quiere construir y entender cada parte del sistema. Hay distros para servidores, para equipos viejos, para privacidad, para diseño gráfico, para gaming.

Los comandos de este laboratorio funcionan igual en todas ellas. La terminal es la misma, y esa es la razón por la que aprenderla rinde en cualquier distribución (Shotts, 2026).

## El proceso de instalación

Instalar Linux en un computador sigue siempre la misma lógica, sin importar la distribución que elijas (Tuxnauta, 2025).

<!-- IMAGE: instalacion-linux-portada.png | Proceso de instalación de Linux -->

### 1. Elegir la distribución

El primer paso es decidir qué distribución instalar. Para quien empieza, la recomendación más común es **Ubuntu** o **Linux Mint**, que tienen buena documentación, comunidad activa y un instalador amigable. Con algo de experiencia previa, **Fedora** es una opción sólida y más moderna.

### 2. Descarga la imagen ISO

Desde el sitio oficial de la distribución elegida descargas un archivo `.iso`. Ese archivo es una imagen del sistema operativo completo, lista para ser grabada en un dispositivo de arranque.

### 3. Crea el USB booteable

Con la ISO en mano, hay que grabarla en un pendrive de mínimo 8 GB con una herramienta como **Rufus** (Windows) o **Balena Etcher** (multiplataforma). Esto convierte el pendrive en un instalador desde el que puede arrancar el computador.

### 4. Configura el arranque

Reinicia el computador con el pendrive conectado y entra al menú de arranque. Dependiendo del equipo, la tecla es <kbd>F12</kbd>, <kbd>F2</kbd>, <kbd>ESC</kbd> o <kbd>DEL</kbd>. Ahí seleccionas el pendrive como dispositivo de arranque principal.

### 5. Prueba en modo Live antes de instalar

La mayoría de distribuciones ofrecen la opción de correr el sistema desde el USB sin instalar nada. Se llama **modo Live**. Sirve para verificar que el hardware funciona correctamente con Linux antes de tocar el disco.

### 6. Instala el sistema

Cuando estés listo, inicias el instalador. El proceso incluye:

- Selección de idioma y teclado
- Configuración de particiones de disco (el instalador trae una opción automática para no hacerlo a mano)
- Creación de usuario y contraseña
- Selección de software adicional

### 7. Reinicia y actualiza

Al terminar la instalación, retiras el USB y el sistema arranca desde el disco. Una vez dentro, lo primero es actualizar los paquetes del sistema:

```bash
sudo apt update && sudo apt upgrade
```

Eso en distribuciones basadas en Debian/Ubuntu. En Fedora sería `dnf upgrade`, en Arch `pacman -Syu`.

## ¿Qué distribución usar?

No hay una respuesta universal, pero sí opciones que encajan mejor según el uso previsto.

| Distribución | Para quién |
|---|---|
| **Ubuntu / Linux Mint** | Personas que vienen de Windows y quieren empezar sin complicaciones |
| **Fedora** | Desarrolladores que quieren software actualizado y tecnologías recientes |
| **Arch Linux** | Usuarios que quieren construir su sistema desde cero y entender cada parte |
| **Debian** | Servidores y entornos que necesitan estabilidad por encima de todo |
| **CachyOS** | Gamers y usuarios que quieren rendimiento máximo del hardware |

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
- Tuxnauta. (2025, 8 de marzo). *Instalación de Linux*. Instituto Linux. https://www.institutolinux.com/instalacion-de-linux/
