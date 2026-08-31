El equipo necesita una carpeta compartida. Abrirla al grupo no basta: si cada archivo que nace dentro se queda con el grupo de quien lo creó, el resto acaba sin poder tocarlo. Para eso existe el setgid, que hace que lo creado dentro herede el grupo del directorio.

Tu cuenta pertenece a dos grupos: el **primario**, que se llama igual que tu usuario, y el **del curso**, que empieza por `grp_` y es el que necesitas aquí.

Para verlos, lo primero de todo:

```bash
id
```

```
uid=1004(tu_usuario) gid=1004(tu_usuario) groups=1004(tu_usuario),1006(grp_cec1648c)
```

El de la izquierda es el primario y el que empieza por `grp_` es el del curso. El tuyo lleva otras letras y otros números, así que cópialo de tu propia salida.

**Objetivos:**

1. Crea el directorio `equipo` y pásalo al grupo del curso, el que empieza por `grp_`.
2. Déjale estos permisos: tú y el grupo pueden leer, escribir y entrar; los de fuera no pueden nada. Y además el setgid puesto.
3. Crea dentro `equipo/acta.txt`, **después** de haber puesto el setgid.
4. Crea `prueba.txt` en el directorio de la actividad (fuera de `equipo`) y guarda dentro el listado largo de `equipo/acta.txt`, donde se vea qué grupo heredó.

**Hint:**

El orden importa: si creas el acta antes de poner el setgid, saldrá con tu grupo primario y la prueba no dirá lo que tiene que decir.

Para cambiar el grupo de un directorio hay un comando propio, distinto del que cambia permisos. El setgid se pone añadiendo un cuarto dígito delante de los tres de siempre; cuál es lo dice la lección de trabajo en grupo. También se puede poner en forma simbólica, sin tocar el resto de permisos.
