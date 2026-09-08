Acabas de entrar a trabajar como auxiliar de sistemas en una pequeña empresa. El empleado anterior dejó el servidor hecho un desastre durante las vacaciones, y tu jefe necesita todo organizado antes del lunes. Nadie le entiende a la estructura que él usaba, así que te pidió que lo ordenaras desde cero con una estructura nueva.

Lo único que sabes es lo que te dijo tu jefe antes de irse:

> "Las fotos del equipo no pueden perderse, los contratos y presupuestos van juntos, y los archivos temporales hay que borrarlos todos. Lo viejo que sea importante lo mete en respaldos."

Este es el estado en el que encontraste el directorio `expediente-empleado/`:

```
expediente-empleado/
├── temporal/
│   ├── cache_001.tmp
│   ├── cache_002.tmp
│   ├── cache_003.tmp
│   └── registro.bak
├── mezclado/
│   ├── foto_perfil.jpg
│   ├── foto_equipo.jpg
│   ├── presupuesto.xlsx
│   ├── notas_reunion.txt
│   ├── borrador.txt
│   └── contrato.pdf
├── RESPALDO_VIEJO/
│   └── datos_2024.csv
└── LEEME.txt
```

**Objetivos:**

1. Crea la estructura `archivos/` con tres subdirectorios: `fotos`, `documentos` y `respaldos`.
2. Mueve todos los archivos de imagen (`.jpg`) a `archivos/fotos/`.
3. Mueve los documentos (`.txt`, `.pdf`, `.xlsx`) a `archivos/documentos/`.
4. Copia el respaldo viejo completo dentro de `archivos/respaldos/` con `cp -r`. Ojo: `cp` duplica, no mueve — la copia queda en `respaldos/` y el `RESPALDO_VIEJO` original sigue en la raíz.
5. Después del paso 4, toma el `datos_2024.csv` del `RESPALDO_VIEJO` **original** (no del de la copia) y muévelo ya renombrado en un solo `mv`: `mv RESPALDO_VIEJO/datos_2024.csv archivos/documentos/informe_final.csv`. El orden importa: al mover el original, el `RESPALDO_VIEJO` queda vacío, mientras la copia del paso 4 conserva su `datos_2024.csv`.
6. Elimina todos los archivos temporales (`.tmp` y `.bak`) del directorio `temporal/`.
7. Elimina el `borrador.txt` de su nueva ubicación en `documentos/`: no sirve, era solo un borrador.
8. Elimina los directorios que quedaron vacíos (el `temporal/`, el `mezclado/` y el `RESPALDO_VIEJO` original) con el comando adecuado.
9. Verifica con `ls -laR archivos/` que todo quedó en su lugar.

**Estructura final esperada:**

```
expediente-empleado/
├── archivos/
│   ├── fotos/
│   │   ├── foto_perfil.jpg
│   │   └── foto_equipo.jpg
│   ├── documentos/
│   │   ├── presupuesto.xlsx
│   │   ├── notas_reunion.txt
│   │   ├── contrato.pdf
│   │   └── informe_final.csv
│   └── respaldos/
│       └── RESPALDO_VIEJO/
│           └── datos_2024.csv
└── LEEME.txt
```

**Hints:**

- Los comodines le permiten operar sobre muchos archivos de una vez: `*.jpg`, `*.tmp`.
- El orden es parte del ejercicio: primero la copia con `cp -r` (paso 4); después el `mv` sobre el original (paso 5).
- `rmdir` solo elimina directorios que están vacíos; si tienen contenido, use `rm -r`.
- `cp -r` copia directorios con todo lo que llevan dentro.
- `mv` sirve tanto para mover como para renombrar.
- Antes de borrar algo, puede usar `ls` con el comodín para confirmar qué va a afectar.
