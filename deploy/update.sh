#!/usr/bin/env bash
#
# LinuxLab - actualizar el despliegue en un solo paso.
#
# Corre en la maquina de desarrollo (y despues en GitHub Actions): construye
# las imagenes, las empaqueta, las transfiere al servidor y aplica el cambio
# (down/up) SIN sembrar ni crear admin. No toca la configuracion del servidor
# salvo que se pase --backend-env.
#
# Uso:
#   bash deploy/update.sh                                  # usa deploy/.deploy.env
#   bash deploy/update.sh --host usuario@ip --url https://...
#
# Flags:
#   --host <h>          usuario@servidor (default: deploy/.deploy.env)
#   --ssh-port <p>      puerto SSH (default: 22)
#   --key <ruta>        clave SSH privada (default: la del ~/.ssh/config)
#   --url <url>         NEXT_PUBLIC_BACKEND_URL (se incrusta ANTES de compilar)
#   --db-password <p>   password de postgres (default: deploy/.deploy.env)
#   --backend-env <f>   archivo con el backend/.env completo: se valida (las 5
#                       claves requeridas), se transfiere al servidor y se usa
#                       en el despliegue. Sin el flag, no se toca el del server.
#   --skip-pull         no hacer git pull en el servidor
#   --push              si el main local no coincide con origin, empujarlo
#   --dry-run           muestra los pasos sin ejecutar nada
#   -h | --help         esta ayuda
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO/deploy/.deploy.env"
TARBALL="$REPO/imagenes.tar.gz"
REQUIRED_BACKEND_KEYS=(DATABASE_URL JWT_SECRET FIREBASE_PROJECT_ID FIREBASE_PRIVATE_KEY FIREBASE_CLIENT_EMAIL)

HOST="${HOST:-}"
SSH_PORT="${SSH_PORT:-22}"
KEY="${KEY:-}"
URL="${URL:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKEND_ENV="${BACKEND_ENV:-}"
PORT_0="${PORT_0:-3001}"
PORT_1="${PORT_1:-3000}"
PUSH=false
SKIP_PULL=false
DRY_RUN=false

log()  { echo -e "\033[1;34m[update]\033[0m $*"; }
warn() { echo -e "\033[1;33m[update]\033[0m $*"; }
die()  { echo -e "\033[1;31m[update]\033[0m $*" >&2; exit 1; }

usage() {
  sed -n '2,22p' "$0"
  exit 0
}

# ---- Config ----------------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --host)         HOST="${2:-}"; shift 2 ;;
    --ssh-port)     SSH_PORT="${2:-}"; shift 2 ;;
    --key)          KEY="${2:-}"; shift 2 ;;
    --url)          URL="${2:-}"; shift 2 ;;
    --db-password)  DB_PASSWORD="${2:-}"; shift 2 ;;
    --backend-env)  BACKEND_ENV="${2:-}"; shift 2 ;;
    --skip-pull)    SKIP_PULL=true; shift ;;
    --push)         PUSH=true; shift ;;
    --dry-run)      DRY_RUN=true; shift ;;
    -h | --help)    usage ;;
    *) die "Opcion desconocida: $1 (usa --help)" ;;
  esac
done

[ -n "$HOST" ] || die "Falta el host. Defínelo en deploy/.deploy.env (HOST=...) o pasa --host."
[ -n "$DB_PASSWORD" ] || die "Falta DB_PASSWORD (deploy/.deploy.env o --db-password)."

# ---- Validacion del backend/.env (si se gestiona desde fuera) ---------------
# Fallo temprano: un env incompleto no debe llegar a compilar ni al down/up.
validate_backend_env() {
  local file="$1" k
  [ -f "$file" ] || die "No existe el archivo de env del backend: $file"
  for k in "${REQUIRED_BACKEND_KEYS[@]}"; do
    grep -qE "^$k=.+" "$file" || die "--backend-env: falta la clave requerida $k en $file"
  done
}
if [ -n "$BACKEND_ENV" ]; then
  validate_backend_env "$BACKEND_ENV"
  log "backend/.env validado: $(basename "$BACKEND_ENV")"
fi

SSH_OPTS="-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new"
[ -n "$KEY" ] && SSH_OPTS="$SSH_OPTS -i $KEY"

run_local() {
  if $DRY_RUN; then log "DRY-RUN: $*"; return; fi
  local out
  out="$(eval "$*" 2>&1)" || {
    echo -e "\033[1;31m[update]\033[0m Fallo el paso: $*\n\n$out" >&2
    exit 1
  }
}

run_remote() {
  if $DRY_RUN; then log "DRY-RUN (remoto): $*"; return; fi
  local out
  out="$(ssh $SSH_OPTS -p "$SSH_PORT" "$HOST" "$*" </dev/null 2>&1)" || {
    echo -e "\033[1;31m[update]\033[0m Fallo el paso remoto: $*\n\n$out" >&2
    exit 1
  }
  echo "$out"
}

# ---- 0. Pre-checks ---------------------------------------------------------
command -v docker >/dev/null 2>&1 || die "Docker no esta instalado en esta maquina."
if ! $DRY_RUN; then
  log "Probando acceso SSH a $HOST ..."
  run_remote "true"
fi

# ---- 1. Main local al dia con origin ---------------------------------------
# El servidor hace git pull antes de aplicar: si el local no coincide con
# origin, el stack se levantaria con imagenes nuevas y scripts viejos.
if git rev-parse --git-dir >/dev/null 2>&1; then
  git fetch -q origin main 2>/dev/null || true
  LOCAL_HEAD="$(git rev-parse HEAD)"
  ORIGIN_HEAD="$(git rev-parse origin/main 2>/dev/null || echo "")"
  if [ -n "$ORIGIN_HEAD" ] && [ "$LOCAL_HEAD" != "$ORIGIN_HEAD" ]; then
    if $PUSH; then
      log "main local no coincide con origin; empujando (--push)..."
      run_local "git push origin main"
    else
      die "main local no coincide con origin/main. Empuja primero (o usa --push)."
    fi
  fi
fi

# ---- 2. URL publica del backend (se incrusta al compilar) -------------------
FRONTEND_ENV="$REPO/frontend/.env.local"
if [ -n "$URL" ]; then
  log "Fijando NEXT_PUBLIC_BACKEND_URL=$URL en frontend/.env.local"
  [ -f "$FRONTEND_ENV" ] || cp "$REPO/deploy/frontend.build.env.example" "$FRONTEND_ENV"
  sed -i "s|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=$URL|" "$FRONTEND_ENV"
elif [ ! -f "$FRONTEND_ENV" ]; then
  die "No existe frontend/.env.local. Crealo a mano, copialo de deploy/frontend.build.env.example o pasa --url."
fi

# ---- 3. Build + empaquetar -------------------------------------------------
log "Construyendo imagenes (frontend, backend, entorno)..."
run_local "docker build -q -t linuxlab-frontend -f $REPO/frontend/Dockerfile $REPO/frontend" && log "  OK: linuxlab-frontend"
run_local "docker build -q -t linuxlab-backend  -f $REPO/backend/Dockerfile  $REPO/backend"   && log "  OK: linuxlab-backend"
run_local "docker build -q -t linuxlab-entorno  -f $REPO/entorno/Dockerfile  $REPO/entorno"   && log "  OK: linuxlab-entorno"

log "Empaquetando imagenes -> $TARBALL"
run_local "docker save linuxlab-frontend linuxlab-backend linuxlab-entorno | gzip > '$TARBALL'"
log "  Paquete listo ($(ls -lh "$TARBALL" | awk '{print $5}'))."

# ---- 4. Transferir ----------------------------------------------------------
log "Enviando el paquete al servidor ($HOST)..."
SCP_OPTS="-o BatchMode=yes -o ConnectTimeout=10"
[ -n "$KEY" ] && SCP_OPTS="$SCP_OPTS -i $KEY"
run_local "scp -q $SCP_OPTS -P $SSH_PORT '$TARBALL' '$HOST:~/imagenes.tar.gz'"

# Los archivos criticos del deploy se transfieren tambien: asi el servidor no
# depende de que su repo este al dia (p. ej. antes del primer push).
log "Enviando los archivos de despliegue al servidor..."
for f in deploy/update-server.sh deploy/compose.podman.yml deploy/Caddyfile scripts/docker/init-env.sh; do
  run_local "scp -q $SCP_OPTS -P $SSH_PORT '$REPO/$f' '$HOST:~/LinuxLab/$f'"
done

# El env del backend, si se gestiona desde fuera (p. ej. CI con --backend-env).
if [ -n "$BACKEND_ENV" ]; then
  log "Enviando backend/.env al servidor (--backend-env)..."
  run_local "scp -q $SCP_OPTS -P $SSH_PORT '$BACKEND_ENV' '$HOST:~/LinuxLab/backend/.env'"
fi

# ---- 5. Repo remoto al dia --------------------------------------------------
if $SKIP_PULL; then
  log "Omitiendo git pull en el servidor (--skip-pull)."
else
  log "Actualizando el repo del servidor (git pull --ff-only)..."
  # Best effort: los archivos criticos ya se transfirieron en el paso 4.
  out="$(ssh $SSH_OPTS -p "$SSH_PORT" "$HOST" "cd ~/LinuxLab && git pull --ff-only origin main" </dev/null 2>&1)" \
    || warn "git pull fallo (continua con los archivos transferidos):\n$out"
fi

# ---- 6. Aplicar -------------------------------------------------------------
log "Aplicando la actualizacion en el servidor (down/up, sin seeds ni admin)..."
run_remote "export DB_PASSWORD='$DB_PASSWORD' PORT_0='$PORT_0' PORT_1='$PORT_1'; bash ~/LinuxLab/deploy/update-server.sh"

# ---- 7. Verificacion --------------------------------------------------------
if ! $DRY_RUN; then
  log "Verificando el despliegue..."
  out="$(ssh $SSH_OPTS -p "$SSH_PORT" "$HOST" "curl -fsS http://127.0.0.1:$PORT_1/api/health || exit 1; echo; curl -s -o /dev/null -w 'proxy: HTTP %{http_code}\n' http://localhost:$PORT_0/ || exit 1; echo; podman ps --filter name=linuxlab --format 'table {{.Names}}\t{{.Status}}'" </dev/null 2>&1)" || {
    echo -e "\033[1;31m[update]\033[0m La verificacion fallo:\n\n$out" >&2
    exit 1
  }
  echo "$out"
  log "Actualizacion completada."
fi
