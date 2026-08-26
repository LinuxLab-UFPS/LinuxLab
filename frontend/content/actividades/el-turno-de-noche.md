Antes de empezar, crea el directorio y muévete a él:

```bash
mkdir -p ~/actividades/el-turno-de-noche
cd ~/actividades/el-turno-de-noche
```

Turno de noche en LinuxLab TM: se dejan varias tareas largas corriendo en segundo plano, se apunta qué quedó abierto y se cierra lo que ya no hace falta.

**Objetivos:**

1. Lanza **tres** tareas en segundo plano. Sirve cualquier cosa que tarde, por ejemplo `sleep 300`.
2. Crea `trabajos.txt` y guarda dentro la lista de trabajos de la terminal, con las tres tareas dentro. Tiene que salir del comando, no escrita a mano.
3. Cierra **una sola** de las tres, por su número de trabajo.
4. Crea `restantes.txt` y escribe dentro cuántas siguen corriendo. Solo el número, una línea.

**Hint:**

Hazlo todo en la misma terminal: los trabajos en segundo plano pertenecen a la sesión donde nacieron, y desde otra no se ven ni se pueden cerrar.

El número de trabajo no es el PID: es el que sale entre corchetes al lanzar la tarea, y para cerrarla hay que pasárselo a `kill` con un `%` delante. El comando que lista los trabajos también acepta una opción para mostrar solo los que siguen corriendo.
