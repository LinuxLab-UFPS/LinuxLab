## ¿Qué es un sistema operativo?

El sistema operativo es el intermediario entre el hardware del computador y la persona que lo usa. Administra los recursos de la máquina y ofrece sobre ellos un conjunto de servicios (Stallings, 2018; Silberschatz et al., 2021). Sin él, el procesador, la memoria y el disco serían piezas inertes, porque nadie decidiría qué programa usa la CPU, dónde se guarda cada archivo ni cómo llega a la pantalla el texto escrito.

## ¿Qué es Linux y dónde está?

Linux es un sistema operativo, y es probable que hoy hayas usado varios sin darte cuenta. Cada búsqueda en internet, cada video en el celular y cada pedido en línea pasan por máquinas que corren Linux:

- Más del 90% de los servidores web del mundo (W3Techs, 2024).
- Las 500 supercomputadoras más potentes del planeta, sin excepción (TOP500, 2024).
- Android, el sistema operativo móvil más usado, construido sobre el Kernel de Linux.
- La infraestructura de nube detrás de AWS, Google Cloud y Azure.

Linux empezó como el proyecto personal de un estudiante universitario y hoy sostiene buena parte de la infraestructura tecnológica global, construido de forma voluntaria por programadores repartidos por el mundo (NDG, 2024).

## Los orígenes: Unix

En 1969, investigadores de los laboratorios Bell de AT&T desarrollaron **Unix**, el sistema operativo que marcó un antes y un después en la computación. Lo que lo hizo especial no fue lo que podía hacer, sino cómo estaba construido. Al escribirse en lenguaje C podía adaptarse a máquinas distintas con relativa facilidad, mientras que el resto de sistemas de la época estaban atados al hardware para el que fueron escritos. Esa portabilidad lo convirtió en el favorito de universidades, centros de investigación y programadores.

Unix también introdujo conceptos que hoy se dan por sentados y que reaparecen a lo largo de este laboratorio:

- **Sistema de archivos jerárquico:** todo organizado en un árbol de directorios que parte de una raíz.
- **Permisos de usuario:** quién puede leer, modificar o ejecutar cada archivo.
- **Procesos:** cada programa en ejecución es una unidad independiente que el sistema administra.
- **Tuberías (pipes):** la salida de un programa se convierte en la entrada de otro, encadenando operaciones.
- **Hacer una cosa y hacerla bien:** herramientas pequeñas, especializadas y combinables entre sí.

Con el tiempo, distintas organizaciones modificaron y ramificaron Unix hasta producir múltiples variantes. Hoy UNIX es a la vez una marca registrada y una especificación de The Open Group, y solo el software que supera su programa de certificación recibe licencia para usar el nombre (The Open Group, 2024).

## El salto a Linux: Linus Torvalds (1991)

En 1991, **Linus Torvalds**, estudiante de ciencias de la computación en la Universidad de Helsinki, estaba frustrado con MINIX, un sistema tipo Unix diseñado para enseñar, con una licencia que limitaba lo que se podía hacer con él y cuyo autor no quería convertirlo en un sistema operativo completo. Decidió escribir su propio Kernel y el 25 de agosto lo anunció en un grupo de noticias:

```
Hello everybody out there using minix -
I'm doing a (free) operating system (just a hobby, won't be big
and professional like gnu) for 386(486) AT clones.
```

Ese "hobby" es hoy el Kernel más usado del mundo, y lo que marcó la diferencia fue la licencia. Torvalds publicó el código fuente permitiendo que cualquiera lo estudiara, modificara y redistribuyera, así que programadores de todo el mundo empezaron a corregir errores y añadir funcionalidades sobre el trabajo de los demás.

Aun así, Linux no es UNIX, sino **UNIX-like**. Cumple los requisitos de la especificación y se comporta de manera similar, pero nunca ha pasado la certificación de The Open Group.

## El proyecto GNU: las herramientas que completaron Linux

Un Kernel por sí solo no alcanza para tener un sistema operativo usable. Faltan editores, compiladores, un intérprete de comandos y utilidades del sistema. Esas piezas ya existían. En 1983, **Richard Stallman** había lanzado el proyecto GNU con la ambición de construir un sistema operativo completamente libre. Nunca terminó su propio Kernel, pero sí resultó mucho más eficaz produciendo las herramientas que acompañan a un sistema tipo Unix:

- **GCC:** el compilador de C que convierte código fuente en programas ejecutables.
- **Bash:** el intérprete de comandos que usarás en este laboratorio.
- **Emacs:** un editor de texto extensible que sigue en uso hoy.
- **Coreutils:** las utilidades básicas del sistema (`ls`, `cp`, `mv`, `cat` y decenas más).

Como el código de GNU era libre, los programadores de Linux pudieron incorporar esas herramientas y completar el sistema. A esa combinación se le llama técnicamente **GNU/Linux**, y es a lo que se refiere casi todo el mundo cuando dice simplemente "Linux", aunque el nombre a secas designa solo el Kernel.

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Silberschatz, A., Galvin, P. B. y Gagne, G. (2021). *Operating system concepts* (10.ª ed.). Wiley.
- Stallings, W. (2018). *Operating systems: Internals and design principles* (9.ª ed.). Pearson.
- The Open Group. (2024). *Single UNIX Specification, version 5, 2024 edition*. https://www.opengroup.org/unix
- TOP500. (2024). *TOP500 list*. https://www.top500.org/
- W3Techs. (2024). *Usage statistics of operating systems for websites*. https://w3techs.com/
