<!-- IMAGE-DARK: logo-linuxlab-dark.png | logo LinuxLab tema oscuro -->
<!-- IMAGE-LIGHT: logo-linuxlab-light.png | logo LinuxLab tema claro -->

<span class="lesson-highlight">**¡Bienvenid@ a LinuxLab!** Te damos la bienvenida a tu nuevo centro de aprendizaje Linux. Aquí vas a descubrir cómo funciona el sistema que mueve internet, los servidores de casi todo y el teléfono que tienes en el bolsillo. La meta es que salgas conociendo como manejar la terminal, entendiendo el sistema por dentro y con las bases para automatizar lo que desees con scripts. ¡Vamos pa lante!</span>

## ¿Qué es un sistema operativo?

> *"An operating system exploits the hardware resources of one or more processors to provide a set of services to system users."*
>
> — Stallings, W. *Operating Systems: Internals and Design Principles*, 9th Ed.

El sistema operativo es el intermediario entre el hardware del computador y tú. Sin él, el procesador, la memoria y el disco serían piezas inertes. El sistema operativo los administra y te permite usarlos sin lidiar directamente con el hardware.

## ¿Qué es Linux y dónde está?

Linux es un sistema operativo. Pero no uno cualquiera.

Cada vez que haces una búsqueda en internet, ves un video en tu celular o haces un pedido en línea, es muy probable que Linux esté trabajando detrás de escena. No lo ves, pero está ahí.

Algunos datos concretos:

- Más del **90% de los servidores web** del mundo corren Linux. *(W3Techs, 2024)*
- El **100% de las 500 supercomputadoras más potentes** del planeta usan Linux. *(Top500.org)*
- **Android**, el sistema operativo móvil más usado del mundo, está basado en el kernel de Linux.
- La mayoría de la infraestructura en la nube — AWS, Google Cloud, Azure — corre sobre Linux.

Linux representa algo poco común en tecnología: un proyecto que comenzó como hobby de un estudiante universitario y se convirtió en la base de la infraestructura tecnológica global. Un todo que es mucho mayor que la suma de sus partes, construido voluntariamente por algunas de las mentes más brillantes del planeta.

## Los orígenes: Unix

Para entender Linux, hay que retroceder a los años 70.

En 1969, investigadores de los laboratorios Bell de AT&T desarrollaron **Unix**, un sistema operativo que marcó un antes y un después en la historia de la computación. Lo que lo hizo especial no fue solo lo que podía hacer, sino *cómo estaba construido*.

Unix fue escrito en **lenguaje C**, una decisión que lo hizo extraordinariamente portátil. Mientras otros sistemas operativos de la época estaban atados al hardware específico para el que fueron escritos, Unix podía adaptarse a diferentes máquinas con relativa facilidad. Eso lo convirtió rápidamente en el favorito de universidades, centros de investigación y programadores.

Unix también introdujo conceptos que hoy damos por sentados y que verás a lo largo de este curso:

- El **sistema de archivos jerárquico**: todo organizado en un árbol de directorios que parte desde una raíz.
- Los **permisos de usuario**: controlar quién puede leer, modificar o ejecutar cada archivo.
- Los **procesos**: cada programa en ejecución es una unidad independiente que el sistema administra.
- Las **tuberías (pipes)**: la salida de un programa puede convertirse en la entrada de otro, encadenando operaciones.
- La filosofía de **"hacer una cosa y hacerla bien"**: herramientas pequeñas, especializadas y combinables entre sí.

Con el tiempo, Unix fue modificado y ramificado por distintas organizaciones hasta dar lugar a múltiples variantes. Hoy, **UNIX es una marca registrada** propiedad de The Open Group, y solo el software que pasa su proceso de certificación puede llamarse oficialmente UNIX.

## El salto a Linux: Linus Torvalds (1991)

En 1991, **Linus Torvalds**, un estudiante finlandés de ciencias de la computación en la Universidad de Helsinki, estaba frustrado con MINIX: un sistema operativo similar a Unix diseñado para uso educativo, pero con una licencia que limitaba lo que se podía hacer con él.

Torvalds decidió construir su propio kernel. Lo que comenzó como un proyecto personal tomó forma pública el 25 de agosto de 1991, cuando publicó este mensaje en un grupo de noticias en internet:

```
Hello everybody out there using minix —
I'm doing a (free) operating system (just a hobby, won't be big
and professional like gnu) for 386(486) AT clones.
```

La ironía es evidente hoy: ese "hobby" que "no iba a ser grande" se convirtió en el kernel más usado del mundo.

Torvalds publicó el código fuente con una licencia que permitía a cualquier persona estudiarlo, modificarlo y redistribuirlo libremente. Eso lo cambió todo. Programadores de todo el mundo comenzaron a contribuir, corregir errores y añadir funcionalidades.

Una aclaración importante: Linux es **UNIX-like**: sigue la misma filosofía, comparte los mismos conceptos y se comporta de manera similar, pero nunca ha pasado el proceso de certificación oficial de The Open Group. Linux no es UNIX. Es algo propio.

## El proyecto GNU: las herramientas que completaron Linux

Un kernel solo no es suficiente para tener un sistema operativo usable. Se necesitan editores, compiladores, intérpretes de comandos y utilidades del sistema.

En 1983, **Richard Stallman** había lanzado el proyecto GNU con la ambición de construir un sistema operativo completamente libre. Aunque el objetivo original era enorme, el proyecto GNU resultó mucho más efectivo construyendo las **herramientas** que acompañan a un sistema tipo Unix:

- **GCC**: el compilador de C que convierte código fuente en programas ejecutables.
- **Bash**: el intérprete de comandos que usarás en este curso.
- **Emacs**: un editor de texto extensible que sigue en uso hoy.
- **Coreutils**: las utilidades básicas del sistema (`ls`, `cp`, `mv`, `cat` y decenas más).

Cuando el kernel de Torvalds estuvo disponible, los programadores pudieron combinarlo con las herramientas del proyecto GNU para obtener un sistema operativo completo y funcional. A esa combinación se le llama técnicamente **GNU/Linux**, aunque en la práctica se usa simplemente "Linux".

## Dato curioso: ¿De dónde viene Tux?

<!-- IMAGE: tux-evolution.png | las tres versiones históricas de Tux -->

**Tux**, el pingüino gordito que representa a Linux, fue creado por Larry Ewing en 1996. Su nombre combina **T**orvalds y **U**ni**X**. Pero la razón de elegir un pingüino es mejor aún: Linus Torvalds contó que fue mordido por un pingüino en un zoológico y quedó con una obsesión por ellos. Así que cuando llegó el momento de elegir la mascota, la decisión se le hizo fácil. El diseño ha tenido variaciones a lo largo de los años, pero el pingüino redondo y contento sigue siendo el mismo de toda la vida.

---

**Fuentes**

- Stallings, W. *Operating Systems: Internals and Design Principles*, 9th Ed. Pearson, 2018.
- NDG Linux Essentials. Cisco Networking Academy, 2024.
- W3Techs. *Usage statistics of operating systems for websites*, 2024.
- Top500.org. *TOP500 List*, 2024.
- Wikipedia (ES). *Historia de Linux*.
