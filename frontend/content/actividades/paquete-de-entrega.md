Antes de empezar, muévete al directorio `~/actividades/paquete-de-entrega`:

```bash
cd ~/actividades/paquete-de-entrega
```

Terminaste el informe y hay que mandarlo en un solo archivo. Dentro de la carpeta tienes:

```
borrador.tmp  informe/
```

**Objetivos:**

1. Comprime la carpeta `informe/` entera en un archivo llamado `entrega.tar.gz`, aquí mismo. El paquete tiene que llevar dentro la carpeta con sus archivos, no los archivos sueltos.
2. Crea `contenido.txt` y guarda dentro la lista de lo que va dentro del paquete. No la escribas a mano: tiene que salir de leer el propio paquete.
3. Crea una carpeta `revision/` y extrae ahí dentro `entrega.tar.gz`, sin tocar el `informe/` original.
4. Borra `borrador.tmp`, que no va en la entrega.

**Hint:**

Los tres nombres son los que se piden, tal cual: `entrega.tar.gz`, `contenido.txt` y `revision/`.

El mismo comando de empaquetado sirve para las tres cosas cambiando una letra: una para crear el paquete, otra para listar lo que hay dentro sin extraerlo y otra para extraerlo. Como el archivo va comprimido, hace falta añadir además la opción del gzip. Y para extraer dentro de otra carpeta hay una opción que indica el directorio de destino, en lugar de entrar ahí primero.
