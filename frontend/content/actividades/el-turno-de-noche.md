Turno de noche: se dejan varias tareas largas corriendo en segundo plano, se apunta qué quedó abierto y se cierra lo que ya no hace falta.

```bash
mkdir -p ~/actividades/el-turno-de-noche
cd ~/actividades/el-turno-de-noche
```

## Lo que hay que hacer

1. Deja **tres** tareas corriendo en segundo plano. Sirve cualquier cosa que tarde, por ejemplo `sleep 300`.
2. Guarda en `trabajos.txt` la lista de trabajos de la terminal, con las tres dentro.
3. Cierra **una sola** por su número de trabajo.
4. Cuenta las que siguen abiertas y escribe en `restantes.txt` únicamente ese número.

El número de trabajo no es el PID: es el que sale entre corchetes al lanzarlas, y se le pasa a `kill` con un `%` delante.

No dejes las otras dos corriendo cuando termines. Y hazlo todo en la misma terminal, porque los trabajos en segundo plano pertenecen a la sesión donde nacieron y no se ven desde otra.
