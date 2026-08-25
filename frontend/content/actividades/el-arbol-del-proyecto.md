Llega un proyecto ajeno y hay que hacerse una idea de qué tiene dentro antes de tocarlo:

```bash
cd ~/actividades/el-arbol-del-proyecto
ls
```

```
metricas/  proyecto/
```

## Lo que hay que hacer

Tres preguntas, y cada una se responde mejor con una herramienta distinta.

| Archivo | Qué tiene que quedar dentro |
|---|---|
| `configs.txt` | La ruta de todos los archivos `.conf` que haya bajo `proyecto/`, estén al nivel que estén, una por línea y en orden |
| `total.txt` | Cuántas líneas suman entre todas las bitácoras `.log` del proyecto. Solo el número |
| `peor.txt` | El nombre del servicio con más errores según `metricas/errores.csv`. Solo el nombre |

Los `.conf` no están todos en la misma carpeta, así que un `ls` no los ve. El total de líneas no está escrito en ninguna parte: hay que localizar las bitácoras y sumarlas. Y en el CSV el peor servicio no es ni el primero ni el último, que es justo para lo que sirve ordenar por la columna del número.
