#!/usr/bin/env bash
#
# LinuxLab - actualizar el stack en el servidor (Podman rootless).
#
# Solo actualiza: carga el paquete de imagenes, baja lo existente y levanta el
# stack completo con las imagenes nuevas. No siembra, no crea admin y no toca
# la configuracion (backend/.env y volumenes persisten tal como estan).
#
# Uso:
#   bash deploy/update-server.sh                                # desde el repo
#   bash deploy/update-server.sh --skip-load                    # ya cargadas
#
# Flags:
#   --image-file <ruta>   ruta del tar.gz (default: $HOME/imagenes.tar.gz)
#   --skip-load           saltar podman load (imagenes ya cargadas)
#   --dry-run             muestra los pasos sin ejecutar nada
#   -h | --help           esta ayuda
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="linuxlab"
COMPOSE="-p $PROJECT -f $REPO/deploy/compose.podman.yml"
INTERNAL_NET="linuxlab_internal"
IMAGES=(linuxlab-frontend linuxlab-backend linuxlab-entorno)

SKIP_LOAD=false
IMAGE_FILE="${IMAGE_FILE:-$HOME/imagenes.tar.gz}"
DRY_RUN=false

log()  { echo -e "\033[1;34m[update-server]\033[0m $*"; }
warn() { echo -e "\033[1;33m[update-server]\033[0m $*"; }
die()  { echo -e "\033[1;31m[update-server]\033[0m $*" >&2; exit 1; }

usage() {
  sed -n '2,15p' "$0"
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --image-file) IMAGE_FILE="${2:-}"; shift 2 ;;
    --skip-load)  SKIP_LOAD=true; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    -h | --help)  usage ;;
    *) die "Opcion desconocida: $1 (usa --help)" ;;
  esac
done

run() {
  if $DRY_RUN; then log "DRY-RUN: $*"; return; fi
  local out
  out="$(eval "$*" 2>&1)" || {
    echo -e "\033[1;31m[update-server]\033[0m Fallo el paso: $*\n\n$out" >&2
    exit 1
  }
}

# ---- 0. Pre-checks ---------------------------------------------------------
command -v podman >/dev/null 2>&1 || die "Podman no esta instalado."
command -v podman-compose >/dev/null 2>&1 || die "podman-compose no esta instalado."
[ -f "$REPO/deploy/compose.podman.yml" ] || die "No se encuentra $REPO/deploy/compose.podman.yml (ejecutar desde el repo)."

# ---- 0.1 Validacion del backend/.env ---------------------------------------
# Red de seguridad: un env incompleto/roto no debe llegar al down/up.
BACKEND_ENV="$REPO/backend/.env"
[ -f "$BACKEND_ENV" ] || die "No existe $BACKEND_ENV. Sin el env del backend no se aplica nada (crealo desde deploy/backend.env.example)."
for key in DATABASE_URL JWT_SECRET FIREBASE_PROJECT_ID FIREBASE_PRIVATE_KEY FIREBASE_CLIENT_EMAIL; do
  grep -qE "^$key=.+" "$BACKEND_ENV" || die "backend/.env sin la clave requerida: $key (corrige el archivo o usa update.sh --backend-env)."
done
log "backend/.env OK (claves requeridas presentes)."

# ---- 1. Cargar imagenes ----------------------------------------------------
if $SKIP_LOAD; then
  log "Omitiendo podman load (--skip-load)."
else
  [ -f "$IMAGE_FILE" ] || die "No se encuentra $IMAGE_FILE (ejecuta deploy/update.sh o usa --skip-load)."
  log "Cargando imagenes desde $IMAGE_FILE ..."
  case "$IMAGE_FILE" in
    *.gz) run "gunzip -c '$IMAGE_FILE' | podman load" ;;
    *)    run "podman load -i '$IMAGE_FILE'" ;;
  esac
fi

# ---- 2. Verificar los 3 tags -----------------------------------------------
for img in "${IMAGES[@]}"; do
  if podman image exists "$img:latest"; then
    log "Imagen $img:latest OK"
  else
    die "Falta la imagen $img:latest (carga el paquete y vuelve a ejecutar)."
  fi
done

# ---- 3. Red interna aislada ------------------------------------------------
if podman network inspect "$INTERNAL_NET" >/dev/null 2>&1; then
  log "Red interna '$INTERNAL_NET' ya existe."
else
  log "Creando red interna aislada '$INTERNAL_NET' (--internal)..."
  run "podman network create --internal $INTERNAL_NET"
fi

# ---- 4. Bajar lo existente -------------------------------------------------
# down antes de up: recrea el conjunto completo con las imagenes recien
# cargadas y evita el bloqueo de dependencias de podman-compose (--requires).
# Los volumenes (pgdata, homes, claves) persisten; migrate e init son
# idempotentes en cada up.
log "Bajando el stack existente (los volumenes persisten)..."
run "podman-compose $COMPOSE down"

# ---- 5. Up -----------------------------------------------------------------
log "Levantando el stack..."
run "podman-compose $COMPOSE up -d"

# ---- 6. Espera de salud ----------------------------------------------------
if ! $DRY_RUN; then
  PORT="${PORT_1:-3000}"
  log "Esperando que el backend responda en 127.0.0.1:$PORT/api/health..."
  ok=0
  for i in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
      log "Backend listo."
      ok=1
      break
    fi
    sleep 5
  done
  [ "$ok" -eq 1 ] || warn "El backend no respondio en 150s (revisa podman logs linuxlab-backend)."
fi

# ---- 7. Resumen ------------------------------------------------------------
log "Actualizacion aplicada. Contenedores:"
podman ps --filter "name=linuxlab" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
