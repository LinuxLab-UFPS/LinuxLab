Este es el logo que hay que armar:

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

Está repartido en trozos dentro de `~/actividades/mensaje-oculto`, en cuatro archivos de cien líneas cada uno:

```bash
cd ~/actividades/mensaje-oculto
```

```
bloque-a.txt  bloque-b.txt  bloque-c.txt  bloque-d.txt
```

Casi todo lo que contienen es relleno. Entre ese ruido, cada archivo guarda una parte del dibujo.

## Lo que hay que hacer

Reunir los cuatro trozos en un archivo nuevo llamado `logo.txt`, dentro de esa misma carpeta, y añadir el código estudiantil como última línea.

Saber cómo termina no es lo que resuelve el ejercicio: el carácter que forma el dibujo no está en el teclado, así que hay que sacarlo de los archivos con `head` o `tail` y juntarlo en el orden correcto.

Tres cosas complican el asunto:

1. **Los trozos no están en el mismo sitio.** Unos viven al principio del archivo y otros al final.
2. **No todos ocupan lo mismo.** Hay que contar cuántas líneas tiene cada uno.
3. **El nombre del archivo no dice qué trozo lleva.** El orden de las letras no es el orden alfabético de los archivos.

## Cuando esté armado

El logo tiene que quedar exactamente como se ve arriba. Si las piezas van en otro orden, las líneas serán las correctas pero el dibujo no saldrá, y la comprobación lo nota.

La última línea es el código estudiantil, sin nada más.
