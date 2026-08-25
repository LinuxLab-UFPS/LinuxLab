Cuando algo se cae en un servidor, lo primero que piden es la foto del momento: qué estaba corriendo y con qué se cerró. Aquí se practica dejar esa constancia por escrito.

```bash
mkdir -p ~/actividades/foto-del-sistema
cd ~/actividades/foto-del-sistema
```

## Lo que hay que hacer

| Archivo | Qué tiene que quedar dentro |
|---|---|
| `procesos.txt` | La lista de los procesos de tu cuenta, con su PID y su estado |
| `senal-9.txt` | Cómo se llama la señal número 9. Solo el nombre |
| `senal-15.txt` | Cómo se llama la señal número 15. Solo el nombre |

Los nombres no hay que recitarlos de memoria: `kill` tiene una opción que traduce un número de señal a su nombre. Devuélvelos tal cual salen de ahí, sin añadirles el prefijo `SIG` por tu cuenta.

En este laboratorio solo ves tus propios procesos, así que la lista será corta. Es lo correcto: `/proc` está montado para que nadie vea los procesos de los demás.
