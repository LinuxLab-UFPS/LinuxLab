## Manos a la obra

Hasta aquí has visto cómo se organiza el sistema de archivos y cómo moverte por él. Ahora te toca crear tu propia estructura, y el laboratorio va a comprobar que lo hiciste.

Tu carpeta personal dentro del laboratorio es tuya: nadie más entra ahí, y todo lo que crees queda entre tus archivos. Es donde vas a trabajar durante el curso, así que vale la pena ordenarla desde el principio.

## Crear un directorio

El comando para crear directorios es `mkdir`, de *make directory*. Recibe el nombre del directorio que quieres crear:

```bash
mkdir practicas
```

Eso crea `practicas` dentro del directorio donde estés parado. Si quieres asegurarte de dónde estás, `pwd` te lo dice, y `ls` te muestra lo que hay.

Para crear un directorio dentro de otro que aún no existe, la opción `-p` crea toda la cadena de una vez:

```bash
mkdir -p practicas/tema-03
```

Sin `-p`, ese comando fallaría si `practicas` no existiera todavía.

## Tu turno

Crea un directorio llamado `practicas` en tu carpeta personal y, dentro de él, otro llamado `tema-03`. Cuando termines, presiona el botón para que el laboratorio revise tu entorno.

<!-- EJERCICIO: crear-directorio-practicas -->

Si algo falla, el detalle te dice exactamente qué falta. Puedes intentarlo tantas veces como quieras.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
