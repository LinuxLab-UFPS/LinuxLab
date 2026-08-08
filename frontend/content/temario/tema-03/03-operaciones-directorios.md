## Operaciones con directorios

Un directorio no es un archivo cualquiera: es un contenedor, y las operaciones que lo afectan actúan sobre todo lo que tiene dentro. Por eso los comandos que crean, copian y eliminan directorios tienen opciones propias que no aparecen al trabajar con archivos sueltos.

## Opciones de mkdir

En su forma más simple, `mkdir` recibe el nombre del directorio a crear:

```bash
mkdir proyectos
```

La opción `-p` (*parents*) crea toda la cadena de directorios intermedios que haga falta:

```bash
mkdir -p proyectos/linux/practicas
```

Sin `-p`, el comando falla si `proyectos` o `proyectos/linux` no existen todavía. `mkdir` no inventa niveles intermedios por su cuenta.

`-p` tiene un segundo efecto: no da error si el directorio ya existe. Eso lo hace seguro dentro de scripts que se ejecutan varias veces.

```bash
mkdir proyectos
```

```
mkdir: cannot create directory 'proyectos': File exists
```

```bash
mkdir -p proyectos
```

La segunda orden termina sin mensajes.

La opción `-v` (*verbose*) informa de cada directorio creado, útil cuando `-p` genera varios de una vez:

```bash
mkdir -pv informes/2026/enero
```

```
mkdir: created directory 'informes'
mkdir: created directory 'informes/2026'
mkdir: created directory 'informes/2026/enero'
```

También admite varios nombres en una sola orden:

```bash
mkdir enero febrero marzo
```

## Clonar un directorio

`cp` (*copy*) duplica archivos, pero ante un directorio se detiene:

```bash
cp proyectos respaldo
```

```
cp: -r not specified; omitting directory 'proyectos'
```

Copiar un directorio implica copiar su contenido completo, y eso hay que pedirlo de forma explícita con `-r` (*recursive*):

```bash
cp -r proyectos respaldo
```

El resultado es un duplicado independiente. Modificar `respaldo` no afecta a `proyectos`.

El comportamiento cambia según exista o no el destino. Si `respaldo` no existe, se crea como copia de `proyectos`. Si ya existe, `proyectos` se copia **dentro** de él, quedando `respaldo/proyectos`. Es la causa más frecuente de copias anidadas por accidente.

## Eliminar un directorio

Existen dos comandos para eliminar directorios, y la diferencia entre ellos es una red de seguridad.

`rmdir` elimina un directorio únicamente si está vacío:

```bash
rmdir informes/2026/enero
```

Si contiene algo, se niega:

```
rmdir: failed to remove 'proyectos': Directory not empty
```

Esa negativa es la utilidad del comando. `rmdir` sirve para limpiar estructuras vacías sin riesgo de arrastrar contenido que todavía importa.

Para eliminar un directorio con todo lo que hay dentro se usa `rm` con `-r`:

```bash
rm -r proyectos
```

`rm -r` no distingue entre un directorio vacío y uno con años de trabajo dentro, y en Linux no existe papelera de reciclaje: lo eliminado no se recupera. Antes de ejecutarlo conviene listar la ruta con `ls` para confirmar que es la correcta.

La combinación `-rf` añade `-f` (*force*), que suprime toda confirmación y no informa de errores. Es habitual en scripts, donde nadie está mirando la pantalla para responder, y es también la orden que más destrozos ha causado en la historia de Unix.

## Resumen

| Comando | Efecto | Cuándo falla |
|---|---|---|
| `mkdir nombre` | Crea un directorio | Si ya existe o falta un nivel intermedio |
| `mkdir -p ruta/anidada` | Crea la cadena completa | No falla si ya existe |
| `cp -r origen destino` | Duplica el directorio y su contenido | Sin `-r`, omite el directorio |
| `rmdir nombre` | Elimina el directorio | Si contiene algo |
| `rm -r nombre` | Elimina el directorio y su contenido | Sin `-r`, omite el directorio |

---

**Fuentes**

- NDG Linux Essentials. Cisco Networking Academy, 2024.
- Shotts, W. *The Linux Command Line*, 2nd Ed. No Starch Press, 2019. linuxcommand.org
- GNU Coreutils Manual. gnu.org/software/coreutils/manual
