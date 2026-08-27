Dentro de `datos/` hay tres bitácoras y un archivo suelto. Hace falta un script que las recorra, cuente sus líneas y decida por sí solo si el total merece revisión.

**Objetivos:**

1. Crea un archivo llamado `reporte.sh`, con su primera línea declarando el intérprete, y dale permisos de lectura y ejecución para todos y de escritura solo para ti.
2. Dentro del script, recorre con un ciclo las bitácoras `.log` de `datos/` y, por cada una, escribe en `reporte.txt` una línea con su nombre, dos puntos y cuántas líneas tiene.
3. Debajo de esas líneas, escribe el total sumado con el formato `TOTAL: <número>`.
4. Cierra con un condicional que escriba `REVISAR` si el total pasa de 40, y `OK` si no llega.
5. Ejecuta el script, para que sea él quien genere `reporte.txt`.

Con los archivos de este directorio, `reporte.txt` tiene que quedar exactamente así:

```
alfa.log: 12
beta.log: 30
gamma.log: 8
TOTAL: 50
REVISAR
```

**Hint:**

Los números del ejemplo son los de este árbol, así que sirven para comprobar que vas bien, pero tienen que salir de contar los archivos y no de copiarlos: si el contenido cambia, el script debe seguir acertando.

El `leeme.txt` no cuenta, y el patrón que recorre los `.log` ya lo deja fuera solo. Para que en la línea salga `alfa.log` y no `datos/alfa.log` hay un comando que se queda con el último tramo de una ruta. Y ojo con el archivo de salida: si el script se ejecuta dos veces y las líneas se van añadiendo, quedará repetido.
