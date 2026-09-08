# Operación del servidor

Guía corta para reaccionar cuando algo falla en producción, escrita a partir del
incidente del 8 de septiembre de 2026.

## Reiniciar un servicio

**No uses `podman restart` sobre el backend, el entorno o el proxy.** Falla con
este error:

```
Error: some dependencies of container ... are not started: ...
container state improper
```

`migrate` e `init` son contenedores de un solo uso: hacen su trabajo al arrancar
el stack y terminan. Quedan en `Exited`, que es lo correcto, pero `podman
restart` exige que las dependencias estén en marcha y se niega a continuar.

Usa Compose, que sí entiende que esos contenedores terminan:

```bash
cd ~/LinuxLab
podman-compose up -d backend        # solo el backend
podman-compose up -d                # todo el stack, respetando el orden
```

Para forzar la recreación de un servicio concreto:

```bash
podman rm -f linuxlab-backend
podman-compose up -d backend
```

## Diagnóstico rápido

```bash
podman ps                                   # ¿quién está unhealthy?
podman logs --tail 60 linuxlab-backend      # el error concreto
podman healthcheck run linuxlab-backend     # por qué está unhealthy
free -h && df -h                            # memoria y disco
sudo dmesg -T | grep -i "out of memory"     # ¿mató el kernel algo?
```

## Recoger evidencia de un incidente

Los logs de contenedor se pierden si algo se recrea, así que esto va **antes**
de tocar nada:

```bash
mkdir -p ~/incidente-$(date +%F) && cd ~/incidente-$(date +%F)
for c in linuxlab-backend linuxlab-postgres linuxlab-entorno linuxlab-proxy; do
  podman logs --timestamps "$c" > "$c.log" 2>&1
done
podman ps -a > estado.txt
sudo dmesg -T | grep -iE "oom|killed process" > kernel-oom.txt 2>&1
tar -czf ~/incidente-$(date +%F).tar.gz .
```

## Qué pasó el 8 de septiembre de 2026

Postgres recibió un apagado limpio a las 15:48:29 UTC y volvió un segundo
después. No fue una caída por carga: los checkpoints eran mínimos y no hubo
OOM.

El backend perdió la conexión y **no se recuperó**. La causa: el `Pool` de `pg`
no tenía manejador del evento `error`, así que la desconexión de un cliente
inactivo dejaba el pool inservible. Se corrigió en
`backend/prisma/client.js`.

Además, `/api/health` devolvía `ok` sin consultar la base, de modo que el
contenedor parecía sano mientras no servía. Ahora consulta la base y devuelve
503 cuando no responde, y el backend tiene healthcheck en el compose.
