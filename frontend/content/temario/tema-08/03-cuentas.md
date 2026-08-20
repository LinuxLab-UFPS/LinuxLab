## Administrar cuentas y grupos

Los comandos de este subtema modifican `/etc/passwd`, `/etc/group` y `/etc/shadow`, así que **todos requieren privilegios de administrador**. La cuenta del laboratorio no los tiene: ejecutarlos aquí devuelve un error de permisos, y eso es lo correcto.

Se estudian igual por dos razones. Aparecen en cualquier documentación y en cualquier tutorial, así que hay que saber leerlos; y explican de dónde salen las cuentas con las que se ha trabajado hasta ahora.

## Cómo se ejecuta un comando privilegiado

No se entra como `root` para trabajar. Lo habitual es `sudo`, que ejecuta **un solo comando** con privilegios y deja registro de quién lo hizo (DevOps Daily, 2025):

```bash
sudo useradd laura_pena
```

Quién puede usar `sudo` y para qué está escrito en `/etc/sudoers`. Ese archivo no se edita con un editor cualquiera: se usa `visudo`, que comprueba la sintaxis antes de guardar. Un error de sintaxis ahí puede dejar el sistema sin nadie capaz de administrarlo.

Una cuenta puede consultar qué tiene concedido sin ser administradora:

```bash
sudo -l
```

```
Sorry, user andres_torres may not run sudo on lab-01.
```

Esa respuesta es la esperada en este laboratorio.

## Crear una cuenta

`useradd` crea la cuenta. Sin opciones hace lo mínimo, así que en la práctica siempre lleva algunas:

```bash
sudo useradd -m -s /bin/bash -c "Laura Peña" laura_pena
```

| Opción | Efecto |
|---|---|
| `-m` | Crea el directorio personal |
| `-s` | Fija el shell de inicio |
| `-c` | Rellena el campo de comentario, normalmente el nombre completo |
| `-u` | Impone un UID concreto |
| `-g` | Define el grupo primario |
| `-G` | Añade a grupos secundarios, separados por comas |

Recién creada, **la cuenta no tiene contraseña válida y no puede entrar**. El campo correspondiente de `/etc/shadow` queda con un `!`. Hace falta un segundo paso:

```bash
sudo passwd laura_pena
```

Sin argumento, `passwd` cambia la contraseña de quien lo ejecuta, y eso sí lo puede hacer cualquier usuario con su propia cuenta.

Con `-m`, los archivos del directorio esqueleto se copian dentro del directorio personal (Shadow Project, 2026). Ese directorio es `/etc/skel`, y de él salen los `.bashrc` y demás archivos de configuración con los que aparece cualquier cuenta recién hecha; la cuenta nueva queda además como dueña de esas copias.

```bash
ls -a /etc/skel
```

```
.  ..  .bash_logout  .bashrc  .profile
```

## Modificar una cuenta

`usermod` cambia lo que `useradd` dejó puesto, con las mismas opciones. Y tiene la trampa más conocida de todo el tema:

```bash
sudo usermod -aG proyecto laura_pena
```

La `-a` significa *append*, añadir. **Sin ella, `-G` no añade: reemplaza.** Usarla sola obliga a listar todos los grupos a los que la cuenta deba pertenecer, y olvidarlo saca al usuario de todos sus grupos suplementarios anteriores (NDG, 2024). Este comando, tan parecido al anterior, deja a la cuenta únicamente en `proyecto`:

```bash
sudo usermod -G proyecto laura_pena
```

No avisa ni pide confirmación. Es un error fácil de cometer y difícil de detectar, porque la cuenta sigue funcionando y solo falla al intentar entrar en archivos a los que antes llegaba. La regla es simple: **con `-G` siempre `-a`**, salvo que la intención sea justamente vaciar la lista.

Otras dos opciones útiles:

```bash
sudo usermod -L laura_pena
sudo usermod -U laura_pena
```

`-L` bloquea la cuenta y `-U` la desbloquea. Bloquear es a menudo mejor que borrar: impide entrar pero conserva la cuenta y sus archivos con dueño.

## Borrar una cuenta

```bash
sudo userdel laura_pena
```

Borra la cuenta pero **deja su directorio personal**. Con `-r` se lleva también el directorio y el correo:

```bash
sudo userdel -r laura_pena
```

Los archivos que esa cuenta tuviera fuera de su directorio personal no desaparecen: se quedan apuntando a un UID que ya no tiene nombre, y `ls -l` los muestra con el número.

## Grupos

Las mismas tres operaciones, con nombres paralelos:

```bash
sudo groupadd proyecto
sudo groupmod -n practicas proyecto
sudo groupdel practicas
```

`groupadd` admite `-g` para imponer un GID concreto, igual que `-u` en `useradd`. Sin esa opción el sistema toma el siguiente número libre.

Y `groupdel` tiene una restricción que conviene conocer antes de tropezar con ella: **no borra un grupo que sea el primario de alguna cuenta**. Hay que cambiar antes el grupo primario de esas cuentas, o borrarlas.

`groupmod` tiene dos opciones y la diferencia entre ellas es grande:

- **`-n` cambia el nombre.** No rompe nada: los archivos pertenecen a GID, no a nombres de grupo, así que todos sus miembros conservan el acceso.
- **`-g` cambia el GID.** Sí rompe. Los archivos siguen apuntando al número viejo, que ya no corresponde a ningún grupo, y pasan a llamarse **archivos huérfanos**.

Esos archivos se localizan con `find`, ya conocido del módulo de búsqueda:

```bash
find /home -nogroup
```

Para quitar a alguien de un grupo sin tocar los demás está `gpasswd`:

```bash
sudo gpasswd -d laura_pena proyecto
```

## Lo que sí se puede probar aquí

Ninguno de los comandos anteriores, pero sí su resultado. Todas las cuentas del laboratorio se crearon exactamente así, y la huella queda a la vista con lo del subtema anterior:

```bash
getent passwd andres_torres
getent group grp_cec1648c
id andres_torres
```

Leer esas tres salidas y reconocer qué opción de `useradd` produjo cada campo es el ejercicio real de este subtema.

---

**Fuentes**

- DevOps Daily. (2025). *User and group management*. https://devops-daily.com/guides/introduction-to-linux/06-user-management
- NDG. (2024). *NDG Linux Essentials* [Curso en línea]. Cisco Networking Academy. https://www.netdevgroup.com/online/courses/open-source/linux-essentials
- Shadow Project. (2026). *Shadow utilities* (versión 4.20.2). https://github.com/shadow-maint/shadow
