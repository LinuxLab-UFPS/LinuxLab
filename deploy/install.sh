#!/usr/bin/env bash
#
# LinuxLab - instalacion en Podman (servidor de la U)
#
# Automatiza: red interna aislada, config, build, up, espera de salud, seeds
# y bootstrap del administrador inicial. Se ejecuta en el servidor:
#
#   bash deploy/install.sh
#
# Flags:
#   --admin-email <correo>   administrador inicial (si no, se pregunta)
#   --admin-name  <nombre>   nombre del administrador
#   --backend-url <url>      URL publica del backend para el build del frontend
#                            (si no se da y no hay config, usa localhost)
#   --skip-seeds             no sembrar las actividades del temario
#   --no-build               no reconstruir imagenes (solo up)
#   --dry-run                muestra los pasos sin ejecutar nada
#   -h | --help              esta ayuda
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="linuxlab"
COMPOSE="-p $PROJECT -f $REPO/deploy/compose.podman.yml"
INTERNAL_NET="linuxlab_internal"

ADMIN_EMAIL=""
ADMIN_NAME=""
BACKEND_URL=""
SKIP_SEEDS=false
NO_BUILD=false
DRY_RUN=false

log()  { echo -e "\033[1;34m[linuxlab]\033[0m $*"; }
warn() { echo -e "\033[1;33m[linuxlab]\033[0m $*"; }
die()  { echo -e "\033[1;31m[linuxlab]\033[0m $*" >&2; exit 1; }

usage() { sed -n '2,18p' "$0"; exit 0; }

while [ $# -gt 0 ]; do
  case "$1" in
    --admin-email) ADMIN_EMAIL="${2:-}"; shift 2 ;;
    --admin-name)  ADMIN_NAME="${2:-}"; shift 2 ;;
    --backend-url) BACKEND_URL="${2:-}"; shift 2 ;;
    --skip-seeds)  SKIP_SEEDS=true; shift ;;
    --no-build)    NO_BUILD=true; shift ;;
    --dry-run)     DRY_RUN=true; shift ;;
    -h | --help)   usage ;;
    *) die "Opcion desconocida: $1 (usa --help)" ;;
  esac
done

run() {
  if $DRY_RUN; then log "DRY-RUN: $*"; else eval "$*"; fi
}

# ---- 0. Pre-checks ---------------------------------------------------------
command -v podman >/dev/null 2>&1 || die "Podman no esta instalado."
command -v podman-compose >/dev/null 2>&1 || die "podman-compose no esta instalado."
[ -f "$REPO/deploy/compose.podman.yml" ] || die "No se encuentra deploy/compose.podman.yml"

log "Repo: $REPO"
log "Podman: $(podman --version 2>/dev/null || echo '?')"
log "podman-compose: $(podman-compose --version 2>/dev/null | head -1 || echo '?')"

# ---- 1. Red interna aislada -----------------------------------------------
if podman network inspect "$INTERNAL_NET" >/dev/null 2>&1; then
  log "Red interna '$INTERNAL_NET' ya existe."
else
  log "Creando red interna aislada '$INTERNAL_NET' (--internal)..."
  run "podman network create --internal $INTERNAL_NET"
fi

# ---- 2. Config -------------------------------------------------------------
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

FRONTEND_ENV="$REPO/frontend/.env.local"

# Preferencia de la URL del backend (se incrusta en el build del frontend):
#   1. --backend-url <url>     (cuando el admin asigne la URL publica)
#   2. la que ya tenga frontend/.env.local (si no es la de ejemplo)
#   3. fallback: localhost con el puerto publico (verificacion sin dominios)
if [ -n "$BACKEND_URL" ]; then
  log "URL publica del backend: $BACKEND_URL"
  if [ ! -f "$FRONTEND_ENV" ]; then
    run "cp $REPO/deploy/frontend.build.env.example $FRONTEND_ENV"
  fi
  run "sed -i 's|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL|' $FRONTEND_ENV"
elif [ -f "$FRONTEND_ENV" ]; then
  PUB=$(grep '^NEXT_PUBLIC_BACKEND_URL=' "$FRONTEND_ENV" | cut -d= -f2)
  if [ -z "$PUB" ] || [ "$PUB" = "https://api.lab.ufps.edu.co" ]; then
    warn "frontend/.env.local sin URL valida: usando localhost temporal."
    run "sed -i 's|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=http://localhost:${PORT_1:-3000}|' $FRONTEND_ENV"
  else
    log "URL del frontend ya configurada: $PUB"
  fi
else
  warn "Sin URL publica: usando localhost temporal (verificacion sin dominios)."
  run "cp $REPO/deploy/frontend.build.env.example $FRONTEND_ENV"
  run "sed -i 's|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=http://localhost:${PORT_1:-3000}|' $FRONTEND_ENV"
fi

if [ -z "$BACKEND_URL" ] && grep -q "^NEXT_PUBLIC_BACKEND_URL=http://localhost" "$FRONTEND_ENV"; then
  warn "URL temporal localhost: cuando el admin asigne la URL publica, re-ejecuta con --backend-url <url> para reconstruir el frontend."
fi

# ---- 3. Build --------------------------------------------------------------
if $NO_BUILD; then
  log "Omitiendo build (--no-build)."
else
  log "Construyendo imagenes (primera vez puede tardar)..."
  run "podman-compose $COMPOSE build"
fi

# ---- 4. Up -----------------------------------------------------------------
log "Levantando el stack..."
run "podman-compose $COMPOSE up -d"

# ---- 5. Espera de salud ----------------------------------------------------
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
  [ "$ok" -eq 1 ] || warn "El backend no respondio en 150s (puede estar reintentando postgres; revisa podman logs linuxlab-backend)."
fi

# ---- 6. Seeds --------------------------------------------------------------
if $SKIP_SEEDS; then
  log "Omitiendo seeds (--skip-seeds)."
else
  log "Sembrando actividades del temario..."
  for seed in seed-actividad-directorios seed-actividad-universidad seed-actividad-comodines seed-actividad-mensaje seed-comprobacion-ficha seed-comprobacion-logo; do
    run "podman exec linuxlab-backend node prisma/$seed.js"
  done
fi

# ---- 7. Bootstrap del admin ------------------------------------------------
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

# ---- 8. Resumen ------------------------------------------------------------
log "Listo. Contenedores del stack:"
podman ps --filter "name=linuxlab" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
log "Logs: podman-compose $COMPOSE logs -f"
log "Pendiente: coordinar con el admin las URLs publicas (PORT_0 frontend, PORT_1 backend)."
