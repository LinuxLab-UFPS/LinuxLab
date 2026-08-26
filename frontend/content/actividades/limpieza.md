Antes de empezar, muévete al directorio `~/actividades/limpieza`:

```bash
cd ~/actividades/limpieza
```

Para tu primera tarea como nuevo empleado de LinuxLab TM, Consultor de Desarrollo, se te pidió hacer limpieza de unos archivos en una esquina olvidada del servidor. No sabían qué más ponerte a hacer.

Como eres casi Ingeniero de Sistemas, estudiante de la respetada UFPS, decides hacerlo como se debe: en el menor número de pasos posible, con comodines.

Estructura del directorio a limpiar:

```
informe.txt   notas.txt     resumen.txt
captura1.png  captura2.png  diagrama.png
temporal.tmp  cache.tmp     sesion.tmp
documentos/   imagenes/
```

**Objetivos:**

1. Eliminar todos los archivos con extensión `.tmp`.
2. Mover los `.txt` dentro de `documentos`.
3. Mover los `.png` dentro de `imagenes`.

**Hint:**

Se puede hacer nombrando los nueve archivos uno por uno, pero el tema de comodines existe justamente para no tener que hacerlo.
