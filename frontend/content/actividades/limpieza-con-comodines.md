Esta actividad trabaja sobre una carpeta preparada por el laboratorio, no sobre los archivos personales. Nada de lo que ocurra ahí dentro afecta al resto del directorio, y el botón de reiniciar devuelve el árbol a su estado inicial las veces que haga falta.

El punto de partida está en `~/actividades/limpieza-con-comodines`:

```bash
cd ~/actividades/limpieza-con-comodines
```

Dentro hay nueve archivos de tres tipos:

```
informe.txt   notas.txt     resumen.txt
captura1.png  captura2.png  diagrama.png
temporal.tmp  cache.tmp     sesion.tmp
documentos/   imagenes/
```

## Lo que hay que hacer

1. Eliminar todos los archivos con extensión `.tmp`.
2. Mover los `.txt` dentro de `documentos`.
3. Mover los `.png` dentro de `imagenes`.

Se puede hacer nombrando los nueve archivos uno por uno, pero el tema de comodines existe justamente para no tener que hacerlo.

Conviene recordar quién expande el patrón: el shell, antes de que el comando lo vea. Cualquier patrón se puede comprobar con `ls` antes de usarlo en algo que borre, porque lo que `ls` muestra es exactamente lo que va a recibir el otro comando.

Un patrón demasiado amplio se nota tarde. Si la carpeta queda vacía, entre lo que se fue estaban los `.png` que todavía había que mover, y desde ahí no hay vuelta atrás salvo reiniciar los archivos.
