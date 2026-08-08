## ¿Qué es un sistema operativo?

> *"An operating system exploits the hardware resources of one or more processors to provide a set of services to system users."*
>
> Stallings, W. *Operating Systems: Internals and Design Principles*, 9th Ed.

El sistema operativo es el intermediario entre el hardware del computador y tú. Sin él, el procesador, la memoria y el disco serían piezas inertes: nadie decidiría qué programa usa la CPU, dónde se guarda cada archivo ni cómo llega a la pantalla lo que escribes. El sistema operativo administra esos recursos y te permite usarlos sin lidiar directamente con el hardware.

## ¿Qué es Linux y dónde está?

Linux es un sistema operativo, y es probable que hoy hayas usado varios sin darte cuenta. Cada búsqueda en internet, cada video en el celular y cada pedido en línea pasan por máquinas que corren Linux:

- Más del 90% de los servidores web del mundo.
- Las 500 supercomputadoras más potentes del planeta, sin excepción.
- Android, el sistema operativo móvil más usado, construido sobre el kernel de Linux.
- La infraestructura de nube detrás de AWS, Google Cloud y Azure.

Linux empezó como el proyecto personal de un estudiante universitario y hoy sostiene buena parte de la infraestructura tecnológica global, construido de forma voluntaria por miles de programadores repartidos por el mundo.

## Los orígenes: Unix

En 1969, investigadores de los laboratorios Bell de AT&T desarrollaron **Unix**, el sistema operativo que marcó un antes y un después en la computación. Lo que lo hizo especial no fue lo que podía hacer, sino cómo estaba construido: al escribirse en lenguaje C podía adaptarse a máquinas distintas con relativa facilidad, mientras que el resto de sistemas de la época estaban atados al hardware para el que fueron escritos. Esa portabilidad lo convirtió en el favorito de universidades, centros de investigación y programadores.

Unix también introdujo conceptos que hoy damos por sentados y que verás a lo largo de este curso:

- **Sistema de archivos jerárquico:** todo organizado en un árbol de directorios que parte de una raíz.
- **Permisos de usuario:** quién puede leer, modificar o ejecutar cada archivo.
- **Procesos:** cada programa en ejecución es una unidad independiente que el sistema administra.
- **Tuberías (pipes):** la salida de un programa se convierte en la entrada de otro, encadenando operaciones.
- **Hacer una cosa y hacerla bien:** herramientas pequeñas, especializadas y combinables entre sí.

Con el tiempo, distintas organizaciones modificaron y ramificaron Unix hasta producir múltiples variantes. Hoy UNIX es una marca registrada de The Open Group, y solo el software que pasa su proceso de certificación puede llamarse oficialmente UNIX.

## El salto a Linux: Linus Torvalds (1991)

En 1991, **Linus Torvalds**, estudiante de ciencias de la computación en la Universidad de Helsinki, estaba frustrado con MINIX: un sistema tipo Unix diseñado para enseñar, con una licencia que limitaba lo que se podía hacer con él. Decidió escribir su propio kernel y el 25 de agosto lo anunció en un grupo de noticias:

```
Hello everybody out there using minix -
I'm doing a (free) operating system (just a hobby, won't be big
and professional like gnu) for 386(486) AT clones.
```

Ese "hobby" es hoy el kernel más usado del mundo, y lo que marcó la diferencia fue la licencia: Torvalds publicó el código fuente permitiendo que cualquiera lo estudiara, modificara y redistribuyera, así que programadores de todo el mundo empezaron a corregir errores y añadir funcionalidades sobre el trabajo de los demás.

Aun así, Linux no es UNIX: es **UNIX-like**. Sigue la misma filosofía, comparte los mismos conceptos y se comporta de manera similar, pero nunca ha pasado la certificación oficial de The Open Group.

## El proyecto GNU: las herramientas que completaron Linux

Un kernel por sí solo no alcanza para tener un sistema operativo usable: faltan editores, compiladores, un intérprete de comandos y utilidades del sistema. Esas piezas ya existían. En 1983, **Richard Stallman** había lanzado el proyecto GNU con la ambición de construir un sistema operativo completamente libre y, aunque nunca terminó su propio kernel, sí produjo las herramientas que acompañan a un sistema tipo Unix:

- **GCC:** el compilador de C que convierte código fuente en programas ejecutables.
- **Bash:** el intérprete de comandos que usarás en este curso.
- **Emacs:** un editor de texto extensible que sigue en uso hoy.
- **Coreutils:** las utilidades básicas del sistema (`ls`, `cp`, `mv`, `cat` y decenas más).

Cuando el kernel de Torvalds estuvo disponible, combinarlo con las herramientas de GNU produjo un sistema operativo completo y funcional. A esa combinación se le llama técnicamente **GNU/Linux**, aunque en la práctica casi todos dicen simplemente "Linux".

---

**Fuentes**

- Stallings, W. *Operating Systems: Internals and Design Principles*, 9th Ed. Pearson, 2018.
- NDG Linux Essentials. Cisco Networking Academy, 2024.
- W3Techs. *Usage statistics of operating systems for websites*, 2024.
- Top500.org. *TOP500 List*, 2024.
- Wikipedia (ES). *Historia de Linux*.
