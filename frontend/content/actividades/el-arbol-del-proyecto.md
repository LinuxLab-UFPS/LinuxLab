Antes de empezar, muévete al directorio `~/actividades/el-arbol-del-proyecto`:

```bash
cd ~/actividades/el-arbol-del-proyecto
```

El equipo de desarrollo de LinuxLab TM va a hacerse cargo de un proyecto ajeno y necesita saber qué tiene dentro antes de tocarlo. Dentro de `proyecto/` hay carpetas anidadas con configuraciones y bitácoras, y en `metricas/errores.csv` un recuento de fallos por servicio.

Vas a dejar tres datos en tres archivos, aquí mismo.

**Objetivos:**

1. Crea `configs.txt` y guarda dentro la ruta de todos los archivos terminados en `.conf` que haya bajo `proyecto/`, estén al nivel que estén. Una ruta por línea y ordenadas alfabéticamente.
2. Crea `total.txt` y escribe dentro cuántas líneas suman entre todas las bitácoras `.log` del proyecto. Solo el número total, una línea.
3. Crea `peor.txt` y escribe dentro el nombre del servicio con más errores según `metricas/errores.csv`. Solo el nombre, sin el número.

**Hint:**

Los `.conf` no están todos en la misma carpeta, así que un `ls` no los ve: hace falta el comando que busca de forma recursiva por nombre. El total de líneas no está escrito en ninguna parte, hay que localizar las bitácoras y contarlas. Y en el CSV el servicio con más errores no es ni el primero ni el último, así que conviene ordenar por la segunda columna en vez de mirarlo a ojo.
