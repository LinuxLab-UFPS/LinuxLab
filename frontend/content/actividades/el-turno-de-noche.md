Antes de empezar, crea el directorio y muévete a él:

```bash
mkdir -p ~/actividades/el-turno-de-noche
cd ~/actividades/el-turno-de-noche
```

Turno de noche en LinuxLab TM: se dejan varias tareas largas corriendo en segundo plano, se apunta qué quedó abierto y se cierra lo que ya no hace falta.

**Objetivos:**

1. Deja **tres** tareas corriendo en segundo plano. Sirve cualquier cosa que tarde, por ejemplo `sleep 300`.
2. Guarda en `trabajos.txt` la lista de trabajos de la terminal, con las tres dentro.
3. Cierra **una sola** por su número de trabajo.
4. Cuenta las que siguen abiertas y escribe en `restantes.txt` únicamente ese número.

**Hint:**

El número de trabajo no es el PID: es el que sale entre corchetes al lanzarlas, y se le pasa a `kill` con un `%` delante. Hazlo todo en la misma terminal, porque los trabajos en segundo plano pertenecen a la sesión donde nacieron.
