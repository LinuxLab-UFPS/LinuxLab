Antes de empezar, muévete al directorio `~/actividades/el-arbol-del-proyecto`:

```bash
cd ~/actividades/el-arbol-del-proyecto
```

El equipo de desarrollo de LinuxLab TM va a hacerse cargo de un proyecto ajeno y necesita saber qué tiene dentro antes de tocarlo. Te piden tres datos.

**Objetivos:**

| Archivo | Qué tiene que quedar dentro |
|---|---|
| `configs.txt` | La ruta de todos los archivos `.conf` que haya bajo `proyecto/`, estén al nivel que estén. Una por línea y en orden. |
| `total.txt` | Cuántas líneas suman entre todas las bitácoras `.log` del proyecto. Solo el número. |
| `peor.txt` | El nombre del servicio con más errores según `metricas/errores.csv`. Solo el nombre. |

**Hint:**

Los `.conf` no están todos en la misma carpeta, así que un `ls` no los ve. El total de líneas no está escrito en ninguna parte: hay que localizar las bitácoras y sumarlas. En el CSV, el servicio con más errores no es ni el primero ni el último.
