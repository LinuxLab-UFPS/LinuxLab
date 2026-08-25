Un script no es más que un archivo con comandos dentro. Este es el más corto que hace algo comprobable.

```bash
mkdir -p ~/actividades/tu-primer-guion
cd ~/actividades/tu-primer-guion
```

## Lo que hay que hacer

Escribe un script llamado `saludo.sh` que al ejecutarse deje un archivo `salida.txt` cuya **última línea** sea tu código estudiantil.

Para que cuente, el script necesita tres cosas:

| | |
|---|---|
| Cabecera | La primera línea tiene que declarar con qué se interpreta el archivo |
| Permisos | Lectura y ejecución para todos, escritura solo para ti |
| Que se ejecute | `salida.txt` lo tiene que crear el script al correr, no tú a mano |

Esa última fila es la que importa: crear el archivo por tu cuenta deja el script sin probar, y escribir el script sin ejecutarlo no crea nada. Hacen falta los dos.
