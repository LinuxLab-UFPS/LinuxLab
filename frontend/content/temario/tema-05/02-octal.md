El tema anterior terminó con `stat` imprimiendo dos formas del mismo permiso:

```
-rw-rw-r--  664  notas.txt
```

Ese `664` no es un código aparte. Cada dígito resume un bloque de tres letras, y sale de sumar los permisos que estén puestos: `r` vale `4`, `w` vale `2` y `x` vale `1` (NDG, 2024).

```
rw-  = 4 + 2     = 6
rw-  = 4 + 2     = 6
r--  = 4         = 4     ->  664
```

La suma nunca es ambigua, porque cada permiso vale una potencia de dos distinta y cada resultado del `0` al `7` sale de una sola combinación. Por eso el dígito se traduce de vuelta a letras sin dudar:

```
rwx = 7      r-x = 5      r-- = 4      --- = 0
```

Tres letras que valen sí o no dan ocho combinaciones, y los dígitos del `0` al `7` son exactamente ocho. De ahí que los permisos se escriban en base 8 y no en decimal (Free Software Foundation, 2026).

## El cero de delante

Algunas salidas muestran cuatro dígitos en lugar de tres:

```bash
stat -c "%A  (%04a)  %n" notas.txt
```

```
-rw-rw-r--  (0664)  notas.txt
```

Ese cero inicial no es un permiso más: marca que el número está escrito en octal, la misma convención que usa `umask`. Cuando ese dígito no es cero corresponde a los permisos especiales, que quedan fuera de este tema.

## Los valores que se repiten

En la práctica aparecen casi siempre los mismos, porque responden a situaciones que se repiten (DevOps Daily, 2025):

| Octal | Permisos | Para qué |
|---|---|---|
| `644` | `rw-r--r--` | Un archivo normal, que el dueño edita y los demás solo leen |
| `600` | `rw-------` | Un archivo privado, que nadie más abre |
| `755` | `rwxr-xr-x` | Un programa o un directorio, que todos usan y solo el dueño modifica |
| `700` | `rwx------` | Un directorio privado |
| `640` | `rw-r-----` | Un archivo que comparte el grupo pero no el resto |

Conviene tener presente que `644` y `755` no son intercambiables. El `x` que sobra en `755` marca un archivo de texto como ejecutable sin serlo, y el `x` que falta en `644` deja un directorio inservible. El motivo se ve en el tema de permisos sobre directorios.


## Resumen

| Concepto | Qué es |
|---|---|
| `r` | Vale `4` |
| `w` | Vale `2` |
| `x` | Vale `1` |
| Un dígito | La suma de los permisos puestos en su bloque |
| Tres dígitos | El archivo entero: dueño, grupo y otros |
| `stat -c "%A %a %n" archivo` | Muestra los permisos en letras y en octal |
| El `0` inicial | Marca que el número está escrito en octal |

---

**Fuentes**

- DevOps Daily. (2025). *Linux file system hierarchy*. https://devops-daily.com/guides/introduction-to-linux/04-file-system-hierarchy
- Free Software Foundation. (2026). *GNU coreutils manual* (versión 9.11). https://www.gnu.org/software/coreutils/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
