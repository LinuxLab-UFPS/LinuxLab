## Dos formas de hablarle al sistema

Hay dos maneras de interactuar con un sistema operativo, y Linux ofrece las dos.

La **interfaz gráfica (GUI)** son ventanas, íconos y menús: el sistema responde a tus clics. Es lo que conoce cualquiera que venga de Windows o macOS: el explorador de archivos, el navegador, el reproductor de música. Todo visual, todo clickeable.

La **interfaz de línea de comandos (CLI)** es texto puro: escribes lo que quieres hacer y el sistema lo ejecuta. La diferencia de fondo está ahí: cuando haces clic en un ícono, es el computador el que te está diciendo qué puedes hacer; cuando escribes un comando, eres tú quien le dice al computador qué tiene que hacer.

<!-- ILLUSTRATION: gui-cli -->

## Linux no es solo una pantalla negra

Persiste el cliché de que Linux es una terminal negra con texto verde y que usarlo significa renunciar a cualquier cosa que se parezca a una interfaz normal. Linux tiene escritorios gráficos completos: barra de tareas, explorador de archivos, notificaciones y todo lo que esperarías de un sistema moderno. Cualquier persona puede instalarlo y usarlo desde el primer día sin tocar una terminal, y hay opciones que se parecen bastante a Windows, otras más minimalistas y otras pensadas para computadores con pocos recursos.

Un **entorno de escritorio** es esa capa visual del sistema: las ventanas, el panel, los íconos del escritorio, el menú de aplicaciones. No es parte del kernel, sino software independiente que se instala encima, y en Linux eliges cuál usar o lo cambias después. Esa flexibilidad no existe en Windows ni en macOS, donde la interfaz la define la empresa y no se toca.

### Qué hace un entorno de escritorio

Detrás de lo que ves hay varias piezas, cada una encargada de una parte del trabajo:

- **Gestor de ventanas:** dibuja los bordes y las barras de título, y se encarga de mover, redimensionar, minimizar y apilar ventanas. También maneja los escritorios virtuales.
- **Panel o barra de tareas:** muestra las aplicaciones abiertas, el reloj y la bandeja del sistema, y te deja saltar de una ventana a otra.
- **Menú de aplicaciones:** el lanzador desde donde abres los programas instalados, casi siempre con un buscador.
- **Explorador de archivos:** recorrer carpetas, copiar, mover y renombrar con el ratón, sin escribir rutas.
- **Centro de configuración:** pantalla, teclado, sonido, red, tema y cuentas de usuario en un solo lugar.
- **Notificaciones:** los avisos del sistema y de las aplicaciones, más los indicadores de batería, volumen y conexión.

Nada de eso es parte del sistema operativo en sí. Puedes desinstalar el entorno completo y el sistema sigue funcionando; simplemente arranca en modo texto.

### GNOME y KDE Plasma

Los dos entornos más usados en Linux resuelven el mismo problema con filosofías opuestas.

<!-- ILLUSTRATION: gnome-kde -->

**GNOME** apuesta por decidir por ti. Una barra superior, el escritorio limpio sin íconos, y todo (aplicaciones abiertas, buscador, escritorios virtuales) detrás de la vista de Actividades que se abre con la tecla Super. Hay pocas opciones a la vista porque la idea es que no tengas que configurar nada para trabajar. Viene por defecto en Ubuntu, Fedora Workstation y Debian.

**KDE Plasma** apuesta por lo contrario: que decidas tú. Barra de tareas abajo con su menú de aplicaciones, íconos y widgets sobre el escritorio, y un panel de preferencias donde se puede cambiar prácticamente cualquier cosa, desde el comportamiento de las ventanas hasta el tamaño de cada elemento. A quien viene de Windows le resulta familiar de entrada. Viene por defecto en Kubuntu, Fedora KDE y CachyOS.

| | GNOME | KDE Plasma |
|---|---|---|
| **Filosofía** | Un solo camino, bien definido | Todo configurable, tú eliges |
| **Panel** | Barra superior y vista de Actividades | Barra de tareas abajo con menú |
| **Escritorio** | Limpio, sin íconos por defecto | Íconos y widgets |
| **Personalización** | Con extensiones y GNOME Tweaks | Integrada en Preferencias del sistema |
| **Librerías gráficas** | GTK | Qt |

No son los únicos. **XFCE** y **LXQt** están pensados para equipos con pocos recursos, y **Cinnamon**, el de Linux Mint, busca ser familiar para quien llega desde Windows. Incluso puedes instalar varios en el mismo sistema y elegir cuál usar al iniciar sesión.

Lo importante no es qué entornos existen, sino que **en Linux la interfaz gráfica y el sistema operativo son cosas separadas**. El sistema funciona aunque no haya pantalla: en servidores, Linux corre sin entorno gráfico porque no lo necesita, y eso lo hace más eficiente, más seguro y más flexible.

## Por qué aprender CLI aunque haya interfaz gráfica

Para el uso del día a día la interfaz gráfica funciona perfecto, pero tiene límites. Para administrar un servidor, automatizar tareas, manejar archivos en cantidad o entender de verdad qué está haciendo el sistema, la línea de comandos no tiene competencia: una sola línea en la terminal reemplaza varios minutos de clics navegando menús, y hay cosas que directamente no se pueden hacer desde la interfaz gráfica.

La otra ventaja es que los comandos son los mismos en todas partes. El escritorio de Ubuntu se ve diferente al de Fedora, que se ve diferente al de Arch, pero la terminal es idéntica en las tres: lo que aprendas aquí te sirve en cualquier distribución.

En LinuxLab vas a trabajar desde la terminal. No porque la interfaz gráfica no exista, sino porque dominar la terminal es lo que te da control real sobre el sistema.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Wikipedia (ES). *Entornos de escritorio en Linux*.
- The GNOME Project. *GNOME Desktop*. gnome.org
- KDE. *Plasma Desktop*. kde.org/plasma-desktop
