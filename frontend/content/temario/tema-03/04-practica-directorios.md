## Manos a la obra

Hasta aquí se ha visto cómo se organiza el sistema de archivos y cómo recorrerlo. Esta lección termina creando una estructura propia, y el laboratorio comprueba el resultado.

La carpeta personal dentro del laboratorio es privada: nadie más entra ahí. Es el lugar de trabajo durante todo el curso, así que conviene ordenarla desde el principio.

## Crear un directorio

El comando para crear directorios es `mkdir`, de *make directory*. Recibe el nombre del directorio a crear:

```bash
mkdir practicas
```

Eso crea `practicas` dentro del directorio actual. `pwd` confirma cuál es ese directorio y `ls` muestra lo que contiene (NDG, 2024).

Para crear un directorio dentro de otro que aún no existe, la opción `-p` crea toda la cadena de una vez (Shotts, 2026):

```bash
mkdir -p practicas/tema-03
```

Sin `-p`, ese comando fallaría si `practicas` no existiera todavía.

## Tu turno

Crea un directorio llamado `practicas` en tu carpeta personal y, dentro de él, otro llamado `tema-03`. Cuando termines, presiona el botón para que el laboratorio revise tu entorno.

<!-- EJERCICIO: crear-directorio-practicas -->

Si algo falla, el detalle indica exactamente qué falta. Se puede intentar tantas veces como haga falta.

---

**Fuentes**

- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
