Tres días de bitácoras del mismo servicio, y en algún punto de la semana hubo un fallo grave:

```bash
cd ~/actividades/rastro-en-los-registros
wc -l registros/*.log
```

```
  40 registros/lunes.log
  30 registros/martes.log
  25 registros/miercoles.log
  95 total
```

## Lo que hay que hacer

| Archivo | Qué tiene que quedar dentro |
|---|---|
| `hallazgo.txt` | La única línea de las 95 que empieza por `ERROR`, tal cual está escrita |
| `cuenta.txt` | Cuántas líneas de aviso hay en total, contando los tres días. Solo el número |

Dos detalles que deciden si sale a la primera. Cuando `grep` busca en varios archivos pone el nombre del archivo delante de cada línea, y aquí eso sobra: la opción `-h` lo quita. Y el recuento es de los **tres** días juntos, así que contar sobre un solo archivo da un número que no es.
