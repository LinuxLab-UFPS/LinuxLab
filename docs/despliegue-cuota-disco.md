# Acotar el disco del entorno

**Proyecto:** LinuxLab UFPS
**Aplica a:** el servidor donde se despliega el contenedor `entorno`

---

## 1. El problema

El servidor de despliegue tiene **1 GB**. La imagen del entorno ocupa **361 MB**, así que quedan unos **660 MB** para los directorios personales de todos los estudiantes.

Hoy nada impide que uno solo los consuma enteros. Medido en el contenedor: escribir 20 MB tarda **0,016 segundos**, y aunque `ulimit -f` limita cada archivo a 15 MB, no limita cuántos. **45 archivos llenan el disco**, y eso es un bucle de una línea.

Cuando el disco se llena no cae únicamente ese estudiante: falla el aprovisionamiento de cuentas, nadie puede guardar y el checker empieza a devolver errores de escritura. Sin cota, es cuestión de tiempo.

## 2. La solución

Los directorios personales pasan a vivir dentro de una **imagen ext4 de tamaño fijo**, montada en el host y entregada al contenedor como bind mount.

Cuando esa imagen se llena, se llena ella. El disco del servidor no se entera.

No cambia ninguna línea de la aplicación: ni el checker, ni el gateway, ni el aprovisionamiento. Es una decisión sobre cómo se monta el disco.

**Tamaño recomendado: 500 MB.** Con la imagen del entorno en 361 MB, el total queda en 861 MB y deja margen para logs y para el propio Docker. Con 600 MB el margen desaparece.

## 3. Procedimiento

Todo se ejecuta como root en el servidor de despliegue.

### 3.1 Crear la imagen

```bash
mkdir -p /var/lib/linuxlab
```

En un host con **btrfs**, hay que desactivar copy-on-write en el directorio *antes* de crear el archivo. Un archivo grande con escrituras aleatorias dentro se fragmenta muchísimo sobre un sistema CoW:

```bash
chattr +C /var/lib/linuxlab
```

```bash
truncate -s 500M /var/lib/linuxlab/homes.img
mkfs.ext4 -O quota -F /var/lib/linuxlab/homes.img
```

`-O quota` activa la característica de cuotas del sistema de archivos. No impone ningún límite todavía, pero deja la puerta abierta al límite por estudiante (§6) sin tener que reformatear.

### 3.2 Montarla al arranque

Con una unidad de systemd, que se encarga del dispositivo loop sin necesidad de `losetup` a mano. El nombre del archivo **debe** corresponder a la ruta de montaje con guiones.

`/etc/systemd/system/var-lib-linuxlab-homes.mount`:

```ini
[Unit]
Description=Directorios personales del entorno LinuxLab
Before=docker.service

[Mount]
What=/var/lib/linuxlab/homes.img
Where=/var/lib/linuxlab/homes
Type=ext4
Options=loop,usrquota

[Install]
WantedBy=multi-user.target
```

```bash
mkdir -p /var/lib/linuxlab/homes
systemctl daemon-reload
systemctl enable --now var-lib-linuxlab-homes.mount
df -h /var/lib/linuxlab/homes
```

`Before=docker.service` es lo que evita que Docker levante el contenedor sobre un directorio vacío si el montaje aún no ocurrió.

### 3.3 Migrar lo que ya existe

Hacerlo **cuanto antes**: hoy los directorios personales pesan 48 KB en total. Con el trabajo de un semestre dentro, esta migración es otra conversación.

```bash
docker compose stop entorno
docker run --rm \
  -v linuxlab_entorno_home:/origen \
  -v /var/lib/linuxlab/homes:/destino \
  alpine sh -c 'cp -a /origen/. /destino/'
```

`cp -a` conserva dueño, grupo y permisos, que es de lo que depende el aislamiento entre estudiantes.

### 3.4 Cambiar el compose

```yaml
  entorno:
    volumes:
      - ssh_keys:/ssh:ro
      - /var/lib/linuxlab/homes:/home     # antes: entorno_home:/home
      - entorno_etc:/var/lib/linuxlab
```

El volumen `entorno_etc` (el registro de cuentas) **no se toca**: es minúsculo y no lo puede llenar nadie.

Quitar `entorno_home` de la lista de volúmenes al final del archivo sólo después de verificar.

### 3.5 Verificar

```bash
docker compose up -d entorno
docker compose exec entorno df -h /home
```

Debe informar 500 M. Comprobar además que las cuentas siguen ahí y que un estudiante conserva su directorio:

```bash
docker compose exec entorno ls -la /home
```

## 4. Vuelta atrás

El volumen `linuxlab_entorno_home` sigue intacto durante todo el proceso. Si algo sale mal, se revierte la línea del compose y se levanta de nuevo: los datos originales están donde estaban.

Sólo borrarlo cuando el montaje nuevo lleve tiempo funcionando.

## 5. Qué se pierde

El cambio no es gratis. Lo que se cede a cambio del tope:

**Elasticidad.** Hoy los directorios crecen hasta donde dé el disco. Con la imagen, 500 MB es un techo duro. Ampliarlo se puede en caliente (`truncate` para agrandar el archivo, `losetup -c` para releer el tamaño y `resize2fs`), pero es una operación deliberada, no algo que ocurra solo.

**Las ventajas de btrfs sobre esos archivos.** Si el host usa btrfs, hoy cada archivo de cada estudiante se beneficia de instantáneas y compresión. Dentro de la imagen, btrfs ve un único archivo opaco de 500 MB: no hay instantánea por archivo ni deduplicación. Y con `chattr +C` se renuncia además a las sumas de verificación de datos de btrfs sobre ese archivo.

**Un punto de fallo concentrado.** Hoy un archivo corrupto afecta a un archivo. Con la imagen, una corrupción en el archivo equivocado puede llevarse el sistema de archivos completo de los directorios personales. Esto obliga a tener copia de seguridad de verdad, no a confiar en que el disco aguante.

**Copias de seguridad más torpes.** Ya no se puede recorrer los archivos de un estudiante desde el host sin montar la imagen, ni hacer una copia incremental archivo por archivo con la misma facilidad. `rsync` sobre la imagen transfiere sólo los bloques cambiados, pero deja de ser una copia legible directamente.

**Un paso más en el arranque.** Si la unidad de systemd falla, el contenedor no encuentra los directorios. Es un modo de fallo nuevo que antes no existía, y por eso `Before=docker.service` no es opcional.

**Lo que se gana**, además del tope: ext4 sí admite cuotas por usuario y btrfs no las hace por usuario sino por subvolumen. El límite por estudiante deja de ser imposible y pasa a ser trabajo pendiente.

## 6. Lo que este cambio no resuelve

Acota el daño al laboratorio, no lo reparte entre estudiantes. **Un estudiante puede seguir llenando los 500 MB y dejar a la clase sin poder guardar.** El servidor sobrevive; la clase no.

Para eso hacen falta cuotas por usuario, que la característica `-O quota` del paso 3.1 ya deja preparadas:

```bash
quotacheck -cum /var/lib/linuxlab/homes
quotaon -v /var/lib/linuxlab/homes
setquota -u 1051 20M 25M 0 0 /var/lib/linuxlab/homes
```

Los UID del contenedor son los mismos del host (no hay reasignación de espacios de usuario), así que `setquota` desde el host aplica al estudiante correcto. Falta que el aprovisionamiento llame a `setquota` al crear cada cuenta, y eso sí es trabajo en el backend.

Mientras tanto, un vigilante que revise el uso por directorio y avise cubre el hueco sin tocar la infraestructura.

## 7. Sin acceso de root en el servidor

Si el despliegue no permite montar nada, no hay tope posible: queda únicamente el vigilante, asumiendo que el laboratorio puede llenarse aunque el servidor sobreviva. Es una mitigación, no una solución.
