Un directorio compartido no funciona solo con abrirlo al grupo. Si cada archivo que nace dentro se queda con el grupo de quien lo creó, el resto del equipo acaba sin poder tocarlo.

Tu cuenta pertenece a dos grupos: el primario, que se llama como tú, y el del curso. `id` los muestra los dos, y el del curso es el que empieza por `grp_`.

```bash
mkdir -p ~/actividades/la-carpeta-del-equipo
cd ~/actividades/la-carpeta-del-equipo
id
```

## Lo que hay que hacer

| Objeto | Lo que se espera de él |
|---|---|
| `equipo/` | Del grupo del curso. Tú y el grupo entráis y trabajáis dentro; los de fuera no pueden ni entrar |
| `equipo/` | Con setgid puesto, para que lo que se cree dentro herede el grupo del directorio |
| `equipo/acta.txt` | Un archivo creado **dentro** de la carpeta, ya con el setgid puesto |
| `prueba.txt` | El listado largo de ese archivo, donde se vea qué grupo heredó |

El orden importa: si creas el acta antes de poner el setgid, saldrá con tu grupo primario y la prueba no dirá lo que tiene que decir. El bit se pone con un cuarto dígito delante de los tres de siempre.
