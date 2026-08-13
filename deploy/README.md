# Despliegue de LinuxLab en el servidor de la U (Podman)

Stack completo en **Podman rootless** (4.9) con **podman-compose** (1.0.6).
Las imágenes se construyen **fuera del servidor** (no tiene RAM para el build)
y se cargan con `podman load`. El servidor nunca compila.

## Instalación — 2 scripts, sin comandos sueltos

Siempre se envía el **paquete completo** de las 3 imágenes, y el servidor hace
`down`/`up` para aplicar: baja lo existente (los volúmenes persisten) y recrea
todo con las imágenes recién cargadas.

```bash
# TU MAQUINA (donde hay RAM): construye, empaqueta y (opcional) transfiere
bash deploy/build-local.sh --host usuario@servidor

# SERVIDOR: carga, baja lo viejo, levanta, salud, seeds y admin
bash deploy/deploy-server.sh --admin-email admin@ufps.edu.co
```

**Cada vez que cambie la URL pública** (go-live):
```bash
# TU MAQUINA: fija la URL ANTES de compilar (se incrusta en el bundle) y envía
bash deploy/build-local.sh --url https://api.lab.ufps.edu.co --host usuario@servidor
# SERVIDOR: recarga el paquete y aplica con down/up
bash deploy/deploy-server.sh
```

Ambos son **idempotentes** (re-ejecutables sin duplicar nada).

## Coordinación con el administrador (antes del go-live)

- **HTTPS obligatorio**: en producción la cookie de sesión es `secure`
  (`NODE_ENV=production`), y ningún navegador guarda cookies `secure` por
  `http://`. Las URLs que asigne el admin deben ser `https`. La verificación
  local con `http://localhost:PORT_0` sí funciona (el navegador trata
  localhost como contexto seguro).
- **Un solo puerto público**: `PORT_0`. Lo ocupa el contenedor `proxy`
  (Caddy, `deploy/Caddyfile`), que reparte por ruta: `/api` y el WebSocket de
  la terminal van al backend, y todo lo demás al frontend. El admin solo tiene
  que asignar una URL, la del frontend, y ésa sirve para todo.
- **`NEXT_PUBLIC_BACKEND_URL` = esa misma URL.** Al quedar todo en el mismo
  origen, CORS no interviene y la cookie `SameSite: lax` viaja sin condiciones.
- **`PORT_1` deja de ser público**: el backend se publica en `127.0.0.1` para
  que `deploy-server.sh` pueda consultar `/api/health`, pero desde fuera del
  servidor ya no existe.
- **El proxy de la U tiene que dejar pasar el upgrade de WebSocket** hacia
  `PORT_0`. Es lo único que depende de ellos: sin eso el login y las
  actividades funcionan, pero la terminal no conecta.
- **Ojo con `/terminal`**: es a la vez la página de Next y la ruta del
  WebSocket del backend. El `Caddyfile` los separa por la cabecera de upgrade,
  que solo trae el socket. Cualquier proxy que se ponga delante tiene que
  respetar eso.

## Config en el servidor

- `backend/.env` → se crea desde el ejemplo con `deploy-server.sh` (genera el
  `JWT_SECRET` solo); completar Firebase y `CORS_ORIGIN`.
- `frontend/.env.local` → **se crea en la máquina de build** (está en
  `.gitignore`): `NEXT_PUBLIC_FIREBASE_*` (SDK web) + `NEXT_PUBLIC_BACKEND_URL`
  (fijada por `build-local.sh --url`).
- `export DB_PASSWORD=<clave>` antes de `deploy-server.sh` (el compose la lee
  del entorno; debe coincidir con la de `DATABASE_URL`).
- Red interna: `deploy-server.sh` la crea con `--internal` si no existe.

## Memoria (presupuesto del servidor: 1 GB)

| Servicio | Límite |
|---|---|
| `entorno` | 384 MB |
| `backend` | 192 MB |
| `postgres` | 192 MB |
| `frontend` | 96 MB |
| `proxy` | 64 MB |
| **Total** | **928 MB** (margen ~96 MB para el host) |

## Operación diaria

```bash
podman ps                                              # estado
podman-compose -p linuxlab -f deploy/compose.podman.yml logs -f   # logs
podman logs -f linuxlab-backend                        # logs de un servicio
podman restart linuxlab-entorno                        # reiniciar un servicio
podman-compose -p linuxlab -f deploy/compose.podman.yml down   # detener
podman-compose -p linuxlab -f deploy/compose.podman.yml up -d  # levantar
podman volume ls | grep linuxlab                       # volúmenes de data
```

**Respaldos**: responsabilidad de la institución. El estado vive en postgres
(cuentas, actividades, calificaciones) y en los volúmenes
`linuxlab_entorno_home` y `linuxlab_entorno_etc`; ante una pérdida de
volúmenes, el reconcile reconstruye las cuentas del entorno desde la base.

## Checklist de verificación en el servidor

| Verificación | Señal |
|---|---|
| Egress bloqueado | `podman run --rm --network linuxlab_internal alpine:3 sh -c "wget -q -T 5 http://example.com && echo SALIDA_HAY \|\| echo SIN_EGRESS"` → `SIN_EGRESS` |
| Entorno/postgres sin puertos | `podman ps --format "{{.Names}} {{.Ports}}"` → sin mapeos en `linuxlab-entorno`/`linuxlab-postgres` |
| Permisos de filesystem | En el entorno: `/home` 711, homes `2750 estudiante:grp_xxx`, dir de grupo `2751 docente:grp_xxx`, setgid |
| Límites por sesión | Como estudiante: `ulimit -u` 16, `ulimit -f` 15360, `ulimit -v` 262144, `TMOUT` 900 |
| Checker como estudiante | Abrir una actividad y validar: el resultado refleja el entorno del estudiante |
| Terminal end-to-end | Login → Terminal → comandos → actividad → "Comprobar" → nota parcial |

## Solución de problemas

- **Seeds fallan con "Can't reach database server"**: `DATABASE_URL` en
  `backend/.env` **sin comillas** (podman `--env-file` no las procesa como
  docker-compose); verificar con `podman exec linuxlab-backend env | grep DATABASE_URL`.
- **`migrate` reintenta hasta 20 veces**: si falla, revisar `backend/.env`
  (`DATABASE_URL` y `DB_PASSWORD` deben coincidir) y que postgres esté arriba.
- **El entorno no crea cuentas**: `podman logs linuxlab-backend` (worker de
  aprovisionamiento; los jobs se ordenan por prioridad docente → grupo →
  estudiante).
- **La terminal no abre (401)**: revisar HTTPS/URLs (cookie `secure` +
  `SameSite: lax`) y que `NEXT_PUBLIC_BACKEND_URL` se haya fijado con
  `--url` antes del build (reconstruir con `build-local.sh`).
- **Backend no lee `/ssh/ssh_key`**: `podman exec -it linuxlab-init chmod 644 /ssh/ssh_key`.
- **Tras un reinicio del host el stack no vuelve solo**: coordinar con el
  administrador (linger o un unit systemd a nivel sistema).

## Delta de aislamiento en rootless

| Garantía | Rootless |
|---|---|
| Permisos de filesystem (711/2750/setgid), identidad por cuenta, sin sudo | ✅ |
| Red cerrada (sin egress ni puertos publicados) | ✅ |
| `ulimit`, `TMOUT`, `pkill -u` | ✅ |
| Checker con identidad del estudiante, params por stdin | ✅ |
| `hidepid=2` | ❌ — paridad con cualquier servidor compartido de la U |
| Cgroup de CPU por usuario (10%) | ❌ → fallback `nice 10` + `ulimit -u 16` |
