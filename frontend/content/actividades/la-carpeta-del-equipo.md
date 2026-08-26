Antes de empezar, crea el directorio y muévete a él:

```bash
mkdir -p ~/actividades/la-carpeta-del-equipo
cd ~/actividades/la-carpeta-del-equipo
id
```

El equipo necesita una carpeta compartida. Abrirla al grupo no basta: si cada archivo que nace dentro se queda con el grupo de quien lo creó, el resto acaba sin poder tocarlo.

Tu cuenta pertenece a dos grupos: el primario, que se llama como tú, y el del curso. `id` muestra los dos, y el del curso es el que empieza por `grp_`.

**Objetivos:**

| Objeto | Lo que se espera de él |
|---|---|
| `equipo/` | Del grupo del curso. Tú y el grupo pueden entrar y trabajar dentro; los de fuera no pueden ni entrar. |
| `equipo/` | Con setgid puesto, para que lo que se cree dentro herede el grupo del directorio. |
| `equipo/acta.txt` | Un archivo creado dentro de la carpeta, ya con el setgid puesto. |
| `prueba.txt` | El listado largo de ese archivo, donde se vea qué grupo heredó. |

**Hint:**

El orden importa: si creas el acta antes de poner el setgid, saldrá con tu grupo primario y la prueba no dirá lo que tiene que decir. El bit se pone con un cuarto dígito delante de los tres de siempre.
