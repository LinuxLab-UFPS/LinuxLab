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

(Hint: Se puede hacer nombrando los nueve archivos uno por uno, pero el tema de comodines existe justamente para no tener que hacerlo).

Un patrón de más se lleva por delante archivos que todavía hacían falta, y eso ya no se deshace.
