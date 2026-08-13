#!/usr/bin/env bash
#
# LinuxLab - desplegar en el servidor (Podman rootless).
#
# Carga las imagenes empaquetadas por build-local.sh, baja lo existente y
# levanta el stack completo, espera la salud, siembra el temario y crea el
# admin. El servidor nunca compila: las imagenes vienen construidas de fuera.
#
# Uso:
#   bash deploy/deploy-server.sh                                # todo
#   bash deploy/deploy-server.sh --admin-email admin@ufps.edu.co
#   bash deploy/deploy-server.sh --skip-load                    # imagenes ya cargadas
#
# Flags:
#   --admin-email <correo>   administrador inicial (si no, se pregunta)
#   --admin-name  <nombre>   nombre del administrador
#   --skip-seeds             no sembrar las actividades del temario
#   --image-file <ruta>      ruta del tar.gz (default: $HOME/imagenes.tar.gz)
#   --skip-load              saltar podman load (imagenes ya cargadas)
#   --dry-run                muestra los pasos sin ejecutar nada
#   -h | --help              esta ayuda
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="linuxlab"
COMPOSE="-p $PROJECT -f $REPO/deploy/compose.podman.yml"
INTERNAL_NET="linuxlab_internal"
IMAGES=(linuxlab-frontend linuxlab-backend linuxlab-entorno)

ADMIN_EMAIL=""
ADMIN_NAME=""
SKIP_SEEDS=false
SKIP_LOAD=false
IMAGE_FILE="${IMAGE_FILE:-$HOME/imagenes.tar.gz}"
DRY_RUN=false

log()  { echo -e "\033[1;34m[deploy-server]\033[0m $*"; }
warn() { echo -e "\033[1;33m[deploy-server]\033[0m $*"; }
die()  { echo -e "\033[1;31m[deploy-server]\033[0m $*" >&2; exit 1; }

usage() {
  sed -n '2,24p' "$0"
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --admin-email) ADMIN_EMAIL="${2:-}"; shift 2 ;;
    --admin-name)  ADMIN_NAME="${2:-}"; shift 2 ;;
    --skip-seeds)  SKIP_SEEDS=true; shift ;;
    --image-file)  IMAGE_FILE="${2:-}"; shift 2 ;;
    --skip-load)   SKIP_LOAD=true; shift ;;
    --dry-run)     DRY_RUN=true; shift ;;
    -h | --help)   usage ;;
    *) die "Opcion desconocida: $1 (usa --help)" ;;
  esac
done

run() {
  if $DRY_RUN; then log "DRY-RUN: $*"; return; fi
  local out
  out="$(eval "$*" 2>&1)" || {
    echo -e "\033[1;31m[deploy-server]\033[0m Fallo el paso: $*\n\n$out" >&2
    exit 1
  }
}

# ---- 0. Pre-checks ---------------------------------------------------------
command -v podman >/dev/null 2>&1 || die "Podman no esta instalado."
command -v podman-compose >/dev/null 2>&1 || die "podman-compose no esta instalado."
[ -f "$REPO/deploy/compose.podman.yml" ] || die "No se encuentra deploy/compose.podman.yml"

log "Repo: $REPO"
log "podman-compose: $(podman-compose --version 2>/dev/null | head -1 || echo '?')"

# ---- 1. Config (antes de tocar el stack) -----------------------------------
BACKEND_ENV="$REPO/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  log "Creando backend/.env desde el ejemplo..."
  run "cp $REPO/deploy/backend.env.example $BACKEND_ENV"
  JWT="$(openssl rand -hex 32)"
  log "JWT_SECRET generado."
  run "sed -i 's|^JWT_SECRET=.*|JWT_SECRET=$JWT|' $BACKEND_ENV"
fi

if grep -qE "^FIREBASE_PROJECT_ID=(\s*)$|^FIREBASE_CLIENT_EMAIL=(\s*)$" "$BACKEND_ENV"; then
  warn "backend/.env tiene Firebase vacio; sin credenciales el login no funcionara."
  if ! $DRY_RUN; then
    read -r -p "Edita backend/.env (FIREBASE_*) y escribe 's' cuando este listo: " ok
    [ "${ok:-n}" = "s" ] || die "Completa backend/.env con Firebase y vuelve a ejecutar."
  fi
fi

if [ ! -f "$REPO/frontend/.env.local" ]; then
  warn "No existe frontend/.env.local en este repo. Se fija en la maquina de build (build-local.sh --url); el bundle ya trae la URL incrustada."
fi

# ---- 2. Cargar imagenes ----------------------------------------------------
if $SKIP_LOAD; then
  log "Omitiendo podman load (--skip-load)."
else
  [ -f "$IMAGE_FILE" ] || die "No se encuentra $IMAGE_FILE. Ejecuta deploy/build-local.sh (con --host) o usa --skip-load si ya cargaste las imagenes."
  log "Cargando imagenes desde $IMAGE_FILE ..."
  case "$IMAGE_FILE" in
    *.gz) run "gunzip -c '$IMAGE_FILE' | podman load" ;;
    *)    run "podman load -i '$IMAGE_FILE'" ;;
  esac
fi

# ---- 3. Verificar los 3 tags -----------------------------------------------
for img in "${IMAGES[@]}"; do
  if podman image exists "$img:latest"; then
    log "Imagen $img:latest OK"
  else
    die "Falta la imagen $img:latest. Ejecuta deploy/build-local.sh y carga el tar (o revisa los tags con podman images)."
  fi
done

# ---- 4. Red interna aislada -----------------------------------------------
if podman network inspect "$INTERNAL_NET" >/dev/null 2>&1; then
  log "Red interna '$INTERNAL_NET' ya existe."
else
  log "Creando red interna aislada '$INTERNAL_NET' (--internal)..."
  run "podman network create --internal $INTERNAL_NET"
fi

# ---- 5. Bajar lo existente -------------------------------------------------
# down antes de up: recrea el conjunto completo con las imagenes recien
# cargadas y evita el bloqueo de dependencias de podman-compose (--requires).
# Los volumenes (pgdata, homes, claves) persisten; migrate e init son
# idempotentes en cada up.
log "Bajando el stack existente (los volumenes persisten)..."
run "podman-compose $COMPOSE down"

# ---- 6. Up -----------------------------------------------------------------
log "Levantando el stack..."
run "podman-compose $COMPOSE up -d"

# ---- 7. Espera de salud ----------------------------------------------------
if ! $DRY_RUN; then
  PORT="${PORT_1:-3000}"
  log "Esperando que el backend responda en :$PORT/api/health..."
  ok=0
  for i in $(seq 1 30); do
    if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
      log "Backend listo."
      ok=1
      break
    fi
    sleep 5
  done
  [ "$ok" -eq 1 ] || warn "El backend no respondio en 150s (revisa podman logs linuxlab-backend)."
fi

# ---- 8. Seeds --------------------------------------------------------------
if $SKIP_SEEDS; then
  log "Omitiendo seeds (--skip-seeds)."
else
  log "Sembrando actividades del temario..."
  for seed in seed-actividad-directorios seed-actividad-universidad seed-actividad-comodines seed-actividad-mensaje seed-comprobacion-ficha seed-comprobacion-logo; do
    run "podman exec linuxlab-backend node prisma/$seed.js"
    log "  OK: $seed"
  done
fi

# ---- 9. Bootstrap del admin ------------------------------------------------
if ! $DRY_RUN && [ -z "$ADMIN_EMAIL" ]; then
  read -r -p "Correo del administrador inicial (Enter para omitir): " ADMIN_EMAIL
fi
if [ -n "$ADMIN_EMAIL" ]; then
  [ -n "$ADMIN_NAME" ] || ADMIN_NAME="${ADMIN_EMAIL%@*}"
  log "Creando administrador $ADMIN_EMAIL ..."
  run "podman cp $REPO/deploy/bootstrap-admin.js linuxlab-backend:/app/bootstrap-admin.js"
  run "podman exec linuxlab-backend node bootstrap-admin.js '$ADMIN_EMAIL' '$ADMIN_NAME'"
else
  log "Sin admin por ahora: usa deploy/bootstrap-admin.js cuando quieras."
fi

# ---- 10. Resumen -----------------------------------------------------------
log "Listo. Contenedores del stack:"
podman ps --filter "name=linuxlab" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
log "Logs: podman-compose $COMPOSE logs -f"
log "Pendiente: coordinar con el admin las URLs publicas (PORT_0 frontend, PORT_1 backend) y que sean HTTPS (la cookie de sesion es secure en produccion)."
