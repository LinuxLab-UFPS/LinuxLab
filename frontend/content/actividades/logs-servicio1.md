Antes de empezar, muévete al directorio `~/actividades/logs-servicio1`:

```bash
cd ~/actividades/logs-servicio1
```

Cada semana que pasa te vas dando cuenta de que en LinuxLab TM los servicios y proyectos suelen tener muchos fallos en producción y tienden a caerse. Seguro por el abuso de IA sin ingeniería real detrás.

Se te ha asignado la tarea de revisar los últimos tres logs del servicio1, que están en `registros`, y buscar en ellos los siguientes datos.

**Objetivos:**

1. Crear el archivo `hallazgo.txt` y poner dentro la única línea de las 95 que empieza por `ERROR`, tal cual está escrita.
2. Crear el archivo `cuenta.txt` y poner dentro cuántas líneas de aviso hay en total entre los tres días. Solo el número.

**Hint:**

Hay una manera de buscar el hallazgo en los tres archivos al mismo tiempo con una opción de `grep`. La encuentras en las lecciones.
