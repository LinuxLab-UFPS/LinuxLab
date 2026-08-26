Antes de empezar, crea el directorio y muévete a él:

```bash
mkdir -p ~/actividades/foto-del-sistema
cd ~/actividades/foto-del-sistema
```

Un servicio se cayó y el equipo pide la foto del momento: qué había corriendo y con qué señal se cerró. Vas a dejar esos datos en tres archivos, dentro de este directorio.

**Objetivos:**

1. Crea `procesos.txt` y guarda dentro la lista de los procesos de tu propia cuenta, con el PID y el estado de cada uno. Tiene que salir del comando, no escrito a mano.
2. Crea `senal-9.txt` y escribe dentro el nombre de la señal número 9. Solo el nombre, una línea, nada más.
3. Crea `senal-15.txt` y escribe dentro el nombre de la señal número 15, igual que el anterior.

**Hint:**

Para lo primero, el comando que lista procesos acepta filtrar por usuario y elegir qué columnas muestra. Para los nombres, `kill` tiene una opción que traduce un número de señal a su nombre: úsala y copia lo que devuelve tal cual, sin añadirle el prefijo `SIG` por tu cuenta.

En este laboratorio solo ves tus propios procesos, así que la lista será corta.
