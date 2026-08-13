#!/usr/bin/env bash
#
# LinuxLab - construir y empaquetar las imagenes (en la maquina de desarrollo).
#
# El servidor NUNCA compila (no tiene RAM para npm ci + next build): aqui se
# construyen las 3 imagenes y se empaquetan en imagenes.tar.gz, listas para
# `podman load` en el servidor.
#
# Uso:
#   bash deploy/build-local.sh                        # build + empaquetar local
#   bash deploy/build-local.sh --host usuario@ip      # + scp al servidor
#   bash deploy/build-local.sh --url https://dominio  # fijar la URL publica
#                                                    #  ANTES de compilar
#
# Flags:
#   --url <url>     URL publica del backend; se escribe en frontend/.env.local
#                   antes de compilar (se incrusta en el bundle del navegador)
#   --host <h>      scp automatico de imagenes.tar.gz al servidor
#   --key <ruta>    clave SSH privada para el scp (p. ej. /home/tu/Documentos/clave)
#   --path <ruta>   directorio remoto destino del scp (default: home)
#   -h | --help     esta ayuda
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL=""
HOST=""
KEY=""
PATH_REMOTE="~"

log()  { echo -e "\033[1;34m[build-local]\033[0m $*"; }
warn() { echo -e "\033[1;33m[build-local]\033[0m $*"; }
die()  { echo -e "\033[1;31m[build-local]\033[0m $*" >&2; exit 1; }

run() {
  local out
  out="$(eval "$*" 2>&1)" || {
    echo -e "\033[1;31m[build-local]\033[0m Fallo el paso: $*\n\n$out" >&2
    exit 1
  }
}

usage() {
  sed -n '2,20p' "$0"
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --url)  URL="${2:-}"; shift 2 ;;
    --host) HOST="${2:-}"; shift 2 ;;
    --key)  KEY="${2:-}"; shift 2 ;;
    --path) PATH_REMOTE="${2:-}"; shift 2 ;;
    -h | --help) usage ;;
    *) die "Opcion desconocida: $1 (usa --help)" ;;
  esac
done

command -v docker >/dev/null 2>&1 || die "Docker no esta instalado en esta maquina."

FRONTEND_ENV="$REPO/frontend/.env.local"
BACKEND_ENV="$REPO/backend/.env"

# ---- URL publica del backend (se incrusta en el build) ---------------------
if [ -n "$URL" ]; then
  log "Fijando NEXT_PUBLIC_BACKEND_URL=$URL en frontend/.env.local"
  [ -f "$FRONTEND_ENV" ] || cp "$REPO/deploy/frontend.build.env.example" "$FRONTEND_ENV"
  sed -i "s|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=$URL|" "$FRONTEND_ENV"
elif [ -f "$FRONTEND_ENV" ]; then
  PUB=$(grep '^NEXT_PUBLIC_BACKEND_URL=' "$FRONTEND_ENV" | cut -d= -f2)
  case "$PUB" in
    *localhost*) warn "NEXT_PUBLIC_BACKEND_URL=$PUB (localhost) se incrustara en el build; para go-live usa --url https://dominio" ;;
  esac
else
  die "No existe frontend/.env.local. Crealo a mano o usa --url."
fi

[ -f "$BACKEND_ENV" ] || warn "backend/.env no existe: la app arrancara sin Firebase (crealo antes)."

# ---- Build de las 3 imagenes ----------------------------------------------
log "Construyendo imagenes (frontend, backend, entorno)..."
run "docker build -q -t linuxlab-frontend -f $REPO/frontend/Dockerfile $REPO/frontend" && log "  OK: linuxlab-frontend"
run "docker build -q -t linuxlab-backend  -f $REPO/backend/Dockerfile  $REPO/backend"   && log "  OK: linuxlab-backend"
run "docker build -q -t linuxlab-entorno  -f $REPO/entorno/Dockerfile  $REPO/entorno"   && log "  OK: linuxlab-entorno"

# ---- Empaquetar ------------------------------------------------------------
TARBALL="$REPO/imagenes.tar.gz"
log "Empaquetando imagenes -> $TARBALL"
run "docker save linuxlab-frontend linuxlab-backend linuxlab-entorno | gzip > '$TARBALL'"
log "  Paquete listo ($(ls -lh "$TARBALL" | awk '{print $5}'))."

# ---- Transferir (opcional) -------------------------------------------------
if [ -n "$HOST" ]; then
  SCP_OPTS=""
  [ -n "$KEY" ] && SCP_OPTS="-i $KEY"
  log "Enviando al servidor: $HOST:$PATH_REMOTE"
  run "scp -q $SCP_OPTS '$TARBALL' '$HOST:$PATH_REMOTE'"
  log "Listo. En el servidor: bash deploy/deploy-server.sh"
else
  log "Listo: $TARBALL (sin --host no se transfirio)."
fi
