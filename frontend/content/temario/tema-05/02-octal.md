## De nueve letras a tres dígitos

Los permisos que muestra `ls -l` son nueve casillas agrupadas de tres en tres, una terna para el dueño, otra para el grupo y otra para los demás. Dentro de cada terna, cada permiso solamente puede estar puesto o no puesto.

```
-rw-r--r--
 ├─┘├─┘├─┘
 │  │  └── otros
 │  └───── grupo
 └──────── dueño
```

Tres casillas que valen sí o no dan ocho combinaciones posibles, ni una más. Por eso cada bloque cabe en un único dígito del `0` al `7`, y por eso los permisos se escriben en octal.

## Qué es la notación octal

Un número octal está escrito en base 8, de modo que sus dígitos van del `0` al `7` y no existe el `8` ni el `9`. Un dígito octal representa exactamente tres bits, y tres bits son justo lo que ocupa un bloque de permisos (Free Software Foundation, 2026).

Esa correspondencia es la razón de que Linux use octal para los permisos y no decimal. No es una convención arbitraria, es que las dos cosas tienen el mismo tamaño.

| Bits | Octal | Permisos |
|---|---|---|
| `000` | `0` | `---` |
| `001` | `1` | `--x` |
| `010` | `2` | `-w-` |
| `011` | `3` | `-wx` |
| `100` | `4` | `r--` |
| `101` | `5` | `r-x` |
| `110` | `6` | `rw-` |
| `111` | `7` | `rwx` |

## El valor de cada permiso

En esa tabla cada permiso ocupa siempre la misma posición, y de ahí sale su valor:

| Permiso | Bit | Valor |
|---|---|---|
| `r` lectura | el primero | `4` |
| `w` escritura | el segundo | `2` |
| `x` ejecución | el tercero | `1` |

Son las tres potencias de dos que caben en tres bits, `4`, `2` y `1`. Para obtener el dígito de un bloque se suman los permisos que estén puestos (NDG, 2024).

```
rwx  = 4 + 2 + 1 = 7
rw-  = 4 + 2     = 6
r-x  = 4 +     1 = 5
r--  = 4         = 4
---  =             0
```

La suma nunca es ambigua. Como cada permiso vale una potencia de dos distinta, cada resultado del `0` al `7` sale de una sola combinación, y por eso el dígito se puede traducir de vuelta a letras sin dudar.

## Leer un permiso completo

Con eso, cualquier salida de `ls -l` se convierte en tres dígitos leyendo de izquierda a derecha:

```
-rw-r--r--
 rw-  r--  r--
  6    4    4     ->  644
```

```
-rwxr-xr-x
 rwx  r-x  r-x
  7    5    5     ->  755
```

`stat` ahorra la cuenta, porque muestra las dos formas a la vez:

```bash
stat -c "%A  %a  %n" notas.txt saludo.sh
```

```
-rw-r--r--  644  notas.txt
-rwxr-xr-x  755  saludo.sh
```

## El cero de delante

Algunas salidas del sistema muestran cuatro dígitos en lugar de tres:

```bash
stat -c "%A  (%04a)  %n" notas.txt
```

```
-rw-r--r--  (0644)  notas.txt
```

Ese cero inicial no es un permiso más. Es la marca que indica que el número está escrito en octal, la misma convención que usa `umask` al mostrar su valor. Cuando ese dígito no es cero corresponde a los permisos especiales, que quedan fuera de este módulo.

## Los valores que se repiten

En la práctica aparecen casi siempre los mismos, porque responden a situaciones que se repiten (DevOps Daily, 2025):

| Octal | Permisos | Para qué |
|---|---|---|
| `644` | `rw-r--r--` | Un archivo normal, que el dueño edita y los demás solo leen |
| `600` | `rw-------` | Un archivo privado, que nadie más abre |
| `755` | `rwxr-xr-x` | Un programa o un directorio, que todos usan y solo el dueño modifica |
| `700` | `rwx------` | Un directorio privado |
| `640` | `rw-r-----` | Un archivo que comparte el grupo pero no el resto |

Conviene tener presente que `644` y `755` no son intercambiables. El `x` que sobra en `755` marca un archivo de texto como ejecutable sin serlo, y el `x` que falta en `644` deja un directorio inservible. El motivo se ve en el subtema de permisos sobre directorios.

## Resumen

| Concepto | Qué es |
|---|---|
| Base 8 | Dígitos del `0` al `7`, sin `8` ni `9` |
| Un dígito octal | Tres bits, o sea un bloque de permisos completo |
| `4` | Lectura |
| `2` | Escritura |
| `1` | Ejecución |
| Dígito de un bloque | La suma de los permisos puestos |
| `644` | `rw-r--r--` |
| `755` | `rwxr-xr-x` |
| El `0` inicial | Marca que el número está en octal |

---

**Fuentes**

- DevOps Daily. (2025). *Linux file system hierarchy*. https://devops-daily.com/guides/introduction-to-linux/04-file-system-hierarchy
- Free Software Foundation. (2026). *GNU coreutils manual* (versión 9.11). https://www.gnu.org/software/coreutils/manual/
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
