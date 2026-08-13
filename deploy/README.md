# Despliegue de LinuxLab en el servidor de la U (Podman)

Stack completo en **Podman rootless** (4.9) con **podman-compose** (1.0.6).
Validado en el servidor: red interna con egress bloqueado, internet para
imágenes y puertos públicos `PORT_0`/`PORT_1`.

## Instalación (automatizada)

```bash
# 1. Clonar/copiar el repositorio y entrar
git clone <repo> LinuxLab && cd LinuxLab

# 2. Ejecutar el instalador (hace todo: red interna, config, build, up,
#    salud, seeds y bootstrap del admin)
bash deploy/install.sh

# 3. O con flags para no interactivo y con la URL publica del backend
bash deploy/install.sh --admin-email admin@ufps.edu.co --backend-url https://api.lab.ufps.edu.co

# 4. Sin URL publica aun, el instalador usa localhost (verificacion sin dominios)
#    y avisa que al asignarse la URL hay que re-ejecutar con --backend-url.

# 5. Antes de ejecutar por primera vez se puede revisar qué hará:
bash deploy/install.sh --dry-run
```

El instalador es **idempotente** (re-ejecutarlo actualiza config, imágenes y
seeds sin duplicar nada). La URL pública del backend se incrusta en el build
del frontend: si cambia, re-ejecutar con `--backend-url` para reconstruir.

## Coordinación con el administrador (antes del go-live)

- **Dos puertos públicos**: `PORT_0` → frontend (3001) y `PORT_1` → backend
  (3000; la API **y** el WebSocket de la terminal). Notificar al admin para
  que asigne las URLs.
- **SameSite**: la cookie de sesión es `SameSite: lax`; las URLs del frontend
  y del backend deben ser **subdominios del mismo dominio** (o una sola URL con
  proxy por path: `/` → frontend, `/api` y `/terminal` → backend). Con dominios
  distintos la terminal falla con 401.
- `NEXT_PUBLIC_BACKEND_URL` (la URL pública del backend) se incrusta en el
  build: se define en `frontend/.env.local` **antes** de ejecutar el instalador.

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

**Respaldos**: responsabilidad de la institución. LinuxLab conserva su estado
en postgres (cuentas, actividades, calificaciones) y en los volúmenes
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

- **`migrate` reintenta hasta 20 veces**: si falla, revisar `backend/.env`
  (`DATABASE_URL`) y que postgres esté arriba.
- **El entorno no crea cuentas**: revisar `podman logs linuxlab-backend`
  (worker de aprovisionamiento; los jobs se ordenan por prioridad docente →
  grupo → estudiante).
- **La terminal no abre (401)**: revisar las URLs públicas (SameSite) y que
  `frontend/.env.local` tenga la URL pública correcta (reconstruir si cambió).
- **Backend no lee `/ssh/ssh_key`**: `podman exec -it linuxlab-init chmod 644 /ssh/ssh_key`.
- **Tras un reinicio del host el stack no vuelve solo**: coordinar con el
  administrador (linger o un unit systemd a nivel sistema); el compose usa
  `restart: unless-stopped`, que en rootless depende de la sesión.

## Delta de aislamiento en rootless

| Garantía | Rootless |
|---|---|
| Permisos de filesystem (711/2750/setgid), identidad por cuenta, sin sudo | ✅ |
| Red cerrada (sin egress ni puertos publicados) | ✅ |
| `ulimit`, `TMOUT`, `pkill -u` | ✅ |
| Checker con identidad del estudiante, params por stdin | ✅ |
| `hidepid=2` | ❌ — paridad con cualquier servidor compartido de la U |
| Cgroup de CPU por usuario (10%) | ❌ → fallback `nice 10` + `ulimit -u 16` |
