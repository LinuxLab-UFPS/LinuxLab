## Tu primer script

Un script es un archivo de texto con una lista de comandos dentro. El shell lo lee y los ejecuta uno detrás de otro, igual que si se hubieran tecleado en la terminal (Shotts, 2026). Todo lo que se ha aprendido hasta aquí sirve dentro de un script, y por eso este módulo va al final: no enseña comandos nuevos, enseña a guardarlos.

Sirve para lo que se repite. Una secuencia de cinco comandos que hay que repetir cada semana se escribe una vez y se ejecuta con un nombre.

## Escribir el archivo

Se crea con el editor del módulo cuatro. El nombre suele acabar en `.sh`, aunque no es obligatorio:

```bash
vi saludo.sh
```

Dentro van tres cosas:

```
#!/bin/bash
# Mi primer script
echo "Hola desde un script"
```

La primera línea es el **shebang**, y no es un comentario aunque empiece por `#`. Los dos caracteres `#!` le dicen al sistema qué programa debe interpretar el archivo (Free Software Foundation, 2025). Para Bash se escribe `#!/bin/bash`, y hay otros: `#!/bin/sh` para un shell más básico, `#!/usr/bin/python3` para Python.

La segunda es un comentario de verdad. Todo lo que va después de `#` se ignora, y sirve para explicar qué hace el script a quien lo abra dentro de seis meses.

La tercera es un comando corriente.

## Darle permiso de ejecución

Un archivo de texto recién creado no se puede ejecutar. Es la protección del módulo cinco funcionando:

```bash
ls -l saludo.sh
./saludo.sh
```

```
-rw-rw-r-- 1 andres_torres grp_cec1648c 59 Aug 24 15:26 saludo.sh
bash: ./saludo.sh: Permission denied
```

Falta el permiso `x`, y se concede con `chmod`:

```bash
chmod +x saludo.sh
ls -l saludo.sh
```

```
-rwxrwxr-x 1 andres_torres grp_cec1648c 59 Aug 24 15:26 saludo.sh
```

Ahí está la `x` en los tres bloques. Para dejarlo solo al alcance del dueño, `chmod 700` en lugar de `+x`.

## Ejecutarlo

Con el permiso puesto, el script ya corre:

```bash
./saludo.sh
```

```
Hola desde un script
```

Ese `./` del principio no es decorativo. Escribiendo solo el nombre, el shell no lo encuentra:

```bash
saludo.sh
```

```
bash: saludo.sh: command not found
```

Cuando se teclea un nombre a secas, el shell lo busca en los directorios de la variable `PATH`, y el directorio actual no está en esa lista. El `./` significa «aquí», y le indica exactamente dónde mirar.

Hay una segunda forma, que no necesita permiso de ejecución porque no se ejecuta el archivo sino que se le pasa a Bash como argumento:

```bash
bash saludo.sh
```

```
Hola desde un script
```

Es cómoda para probar mientras se escribe, pero un script terminado se deja ejecutable y se llama con `./`.

## Resumen

| Comando | Efecto |
|---|---|
| `#!/bin/bash` | Shebang: qué programa interpreta el archivo |
| `# texto` | Comentario, se ignora al ejecutar |
| `chmod +x script.sh` | Le da permiso de ejecución |
| `./script.sh` | Lo ejecuta desde el directorio actual |
| `bash script.sh` | Lo ejecuta sin necesidad del permiso `x` |

---

**Fuentes**

- Free Software Foundation. (2025). *Bash reference manual* (edición 5.3). https://www.gnu.org/software/bash/manual/bash.html
- Shotts, W. (2026). *The Linux command line* (3.ª ed.). No Starch Press. https://linuxcommand.org/tlcl.php
