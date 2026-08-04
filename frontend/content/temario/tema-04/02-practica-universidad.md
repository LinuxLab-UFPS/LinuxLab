## Construye una universidad

Ya sabes crear directorios, moverte entre ellos y crear archivos. Esta actividad junta las tres cosas en una sola estructura, que es como se trabaja de verdad: nadie crea un directorio suelto, se arma un árbol que tenga sentido.

Vas a montar la estructura de una universidad dentro de tu carpeta personal. Un directorio para la universidad, uno por cada facultad, y dentro de cada facultad el archivo con su pensum.

Así debe quedar:

```
universidad
├── ingenieria
│   └── pensum.txt
├── enfermeria
│   └── pensum.txt
└── arquitectura
    └── pensum.txt
```

## Lo que tienes que hacer

1. Crea el directorio `universidad` en tu carpeta personal.
2. Dentro de él, crea `ingenieria`, `enfermeria` y `arquitectura`.
3. Dentro de cada una de las tres, crea un archivo llamado `pensum.txt`.

Los nombres van en minúscula y sin tildes, tal como aparecen arriba. Recuerda que Linux distingue mayúsculas de minúsculas: `Ingenieria` no es lo mismo que `ingenieria`.

Puedes hacerlo comando por comando, o aprovechar lo que ya sabes para ahorrarte pasos. `mkdir -p` crea rutas anidadas de una sola vez, y `touch` acepta varios archivos en un mismo comando.

<!-- EJERCICIO: universidad-facultades -->

Cada punto se revisa por separado, así que si algo falla el detalle te dice cuál. Puedes corregir y volver a comprobar las veces que necesites.

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
