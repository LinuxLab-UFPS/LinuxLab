Esta actividad trabaja sobre una carpeta preparada por el laboratorio, no sobre los archivos personales. Nada de lo que ocurra ahí dentro afecta al resto del directorio, y el botón de reiniciar devuelve el árbol a su estado inicial las veces que haga falta.

El punto de partida está en `~/.actividades/limpieza-con-comodines` y contiene nueve archivos de tres tipos:

```
informe.txt   notas.txt     resumen.txt
captura1.png  captura2.png  diagrama.png
temporal.tmp  cache.tmp     sesion.tmp
documentos/
```

## Lo que hay que hacer

1. Eliminar todos los archivos con extensión `.tmp`.
2. Mover los `.txt` dentro de `documentos`.
3. Dejar los `.png` donde están.

Los comodines son lo que hace esto viable sin escribir nueve nombres. `rm *.tmp` alcanza a los tres temporales de una sola orden, y `mv *.txt documentos/` traslada los tres apuntes.

Conviene recordar quién expande el patrón: el shell, antes de que el comando lo vea. `ls *.tmp` muestra exactamente la lista que recibirá `rm`, así que comprobar primero cuesta una orden y evita un borrado de más.

Un patrón demasiado amplio se nota en el resultado. `rm *` deja la carpeta vacía, y entre lo que se lleva están los `.png` que debían quedarse.
