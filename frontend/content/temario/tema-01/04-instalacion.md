## ¿Qué es una distribución?

Linux no viene en una sola versión. El kernel es el núcleo, pero para tener un sistema operativo completo y usable necesitas mucho más: un gestor de paquetes para instalar software, herramientas del sistema, un entorno gráfico, configuraciones por defecto. Quien empaqueta todo eso junto y lo distribuye es lo que se llama una **distribución** (o simplemente "distro").

Por eso existen tantas. Cada distribución toma el mismo kernel y lo combina con diferentes herramientas, filosofías y públicos objetivo. Ubuntu apunta a la facilidad de uso. Fedora va hacia desarrolladores que quieren lo más reciente. Arch es para quien quiere construir y entender cada parte del sistema. Hay distros para servidores, para equipos viejos, para privacidad, para diseño gráfico, para gaming.

Lo importante: los comandos que vas a aprender en este curso funcionan igual en todas ellas. La terminal es la misma.

## El proceso de instalación

Instalar Linux en un computador sigue siempre la misma lógica, sin importar la distribución que elijas.

<!-- IMAGE: instalacion-linux-portada.png | Proceso de instalación de Linux -->

### 1. Elige tu distribución

El primer paso es decidir qué distribución vas a usar. Para alguien que está empezando, la recomendación más común es **Ubuntu** o **Linux Mint**: tienen buena documentación, comunidad activa y un instalador amigable. Si ya tienes algo de experiencia o quieres algo más moderno, **Fedora** es una opción sólida.

### 2. Descarga la imagen ISO

Desde el sitio oficial de la distribución elegida descargas un archivo `.iso`. Ese archivo es una imagen del sistema operativo completo, lista para ser grabada en un dispositivo de arranque.

### 3. Crea el USB booteable

Con la ISO en mano, necesitas grabarla en un pendrive de mínimo 8 GB usando una herramienta como **Rufus** (Windows) o **Balena Etcher** (multiplataforma). Esto convierte el pendrive en un instalador desde el que puede arrancar el computador.

### 4. Configura el arranque

Reinicia el computador con el pendrive conectado y entra al menú de arranque. Dependiendo del equipo, la tecla es **F12**, **F2**, **ESC** o **DEL**. Ahí seleccionas el pendrive como dispositivo de arranque principal.

### 5. Prueba en modo Live antes de instalar

La mayoría de distribuciones te dan la opción de correr el sistema desde el USB sin instalar nada. Se llama **modo Live**. Sirve para verificar que el hardware funciona correctamente con Linux antes de comprometerte con la instalación.

### 6. Instala el sistema

Cuando estés listo, inicias el instalador. El proceso incluye:

- Selección de idioma y teclado
- Configuración de particiones de disco (el instalador tiene opción automática si no quieres hacerlo manual)
- Creación de usuario y contraseña
- Selección de software adicional

### 7. Reinicia y actualiza

Al terminar la instalación, retiras el USB y el sistema arranca desde el disco. Una vez dentro, lo primero es actualizar los paquetes del sistema:

```bash
sudo apt update && sudo apt upgrade
```

Eso en distribuciones basadas en Debian/Ubuntu. En Fedora sería `dnf upgrade`, en Arch `pacman -Syu`.

## ¿Qué distribución usar?

No hay una respuesta universal, pero sí hay opciones que encajan mejor según para qué la quieres.

| Distribución | Para quién |
|---|---|
| **Ubuntu / Linux Mint** | Personas que vienen de Windows y quieren empezar sin complicaciones |
| **Fedora** | Desarrolladores que quieren software actualizado y tecnologías recientes |
| **Arch Linux** | Usuarios que quieren construir su sistema desde cero y entender cada parte |
| **Debian** | Servidores y entornos que necesitan estabilidad por encima de todo |
| **CachyOS** | Gamers y usuarios que quieren rendimiento máximo del hardware |

---

**Fuentes**

- Instituto Linux. *Instalación de Linux*. institutolinux.com/instalacion-de-linux