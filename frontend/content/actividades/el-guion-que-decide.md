Tres bitácoras y un umbral. El script tiene que recorrerlas, contar y decidir por sí solo.

```bash
cd ~/actividades/el-guion-que-decide
ls datos/
```

```
alfa.log  beta.log  gamma.log  leeme.txt
```

## Lo que hay que hacer

Escribe `reporte.sh`, con cabecera y permiso de ejecución, que recorra los `.log` de `datos/` y escriba un informe en `reporte.txt` con esta forma:

```
alfa.log: 12
beta.log: 30
gamma.log: 8
TOTAL: 50
REVISAR
```

Una línea por bitácora con su nombre y cuántas líneas tiene, después el total, y al final la decisión: `REVISAR` si el total pasa de 40, `OK` si no llega.

Los números del ejemplo son los de este árbol, así que sirven para comprobar que vas bien, pero tienen que salir de contar los archivos y no de copiarlos. El `leeme.txt` no cuenta: el patrón solo alcanza a los `.log`.

Hace falta un ciclo para recorrer los archivos y un condicional para la última línea. Un script que escriba siempre lo mismo no pasa la comprobación.
