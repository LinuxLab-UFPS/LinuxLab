Antes de empezar, muévete al directorio `~/actividades/mensaje-oculto`:

```bash
cd ~/actividades/mensaje-oculto
```

Aburrido en tu trabajo nuevo en LL TM, te acuerdas de tu época universitaria y de los juegos que te inventabas para pasar el rato entre clases. Uno de esos era «armar el logo», donde se partía en cuatro piezas el logo de la UFPS y se escondía en cuatro archivos distintos.

El logo en cuestión:

```
███████████████████
█                 █
█ █ █ ███ ███ ███ █
█ █ █ █   █ █ █   █
█ █ █ ██  ███ ███ █
█ █ █ █   █     █ █
█ ███ █   █   ███ █
█                 █
███████████████████
```

Te propones jugar de nuevo para ver si puedes romper tu tiempo récord. El logo está repartido en cuatro archivos de cien líneas cada uno:

```
bloque-a.txt  bloque-b.txt  bloque-c.txt  bloque-d.txt
```

**Objetivos:**

Sacar los trozos usando `head` y `tail`, juntarlos en un archivo nuevo llamado `logo.txt` dentro de esa misma carpeta, y añadir tu código estudiantil como última línea.

**Hints:**

Los trozos no están en el mismo sitio: unos viven al principio del archivo y otros al final. No todos ocupan lo mismo, así que hay que contar cuántas líneas tiene cada uno. El nombre del archivo no dice qué trozo lleva, y el orden de las letras no es el orden alfabético de los archivos.
