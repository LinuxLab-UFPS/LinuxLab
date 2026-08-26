Antes de empezar, muévete al directorio `~/actividades/el-guion-que-decide`:

```bash
cd ~/actividades/el-guion-que-decide
```

Dentro de `datos/` hay tres bitácoras y un archivo suelto. Hace falta un script que las recorra, cuente sus líneas y decida por sí solo si el total merece revisión.

**Objetivo:**

Escribe `reporte.sh`, con cabecera y permiso de ejecución, que genere `reporte.txt` con esta forma:

```
alfa.log: 12
beta.log: 30
gamma.log: 8
TOTAL: 50
REVISAR
```

Una línea por bitácora con su nombre y cuántas líneas tiene, después el total, y al final la decisión: `REVISAR` si el total pasa de 40, `OK` si no llega.

**Hint:**

Los números del ejemplo son los de este árbol, así que sirven para comprobar que vas bien, pero tienen que salir de contar los archivos y no de copiarlos. El `leeme.txt` no cuenta: el patrón solo alcanza a los `.log`. Hace falta un ciclo para recorrer los archivos y un condicional para la última línea.
