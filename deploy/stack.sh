# LinuxLab - pasos comunes para levantar el stack en el servidor.
#
# Lo cargan deploy-server.sh y update-server.sh con `source`, despues de
# definir REPO, COMPOSE, DRY_RUN y las funciones log, warn, die, run e intentar.
# Asi los dos scripts arrancan el stack en el mismo orden y no se separan.
#
# Por que este orden. migrate e init son de una sola pasada. Antes los
# servicios permanentes dependian de ellos en el compose, y podman-compose
# 1.0.6 convierte esas dependencias en `--requires`. Podman 4.9 no logra
# arrancar un contenedor que requiere otro ya detenido, asi que cuando el
# frontend murio por memoria en noviembre no volvio a levantarse solo. Ahora
# nadie depende de ellos y se ejecutan aqui, antes de los permanentes.

PERMANENTES_BASE="postgres seaweedfs"
PERMANENTES_APP="entorno backend frontend proxy"

# El frontend solo necesita JWT_SECRET en tiempo de ejecucion. Se copia esa
# linea de backend/.env, que es la fuente de verdad, para que el frontend no
# reciba la base de datos, Firebase, SMTP ni S3.
generar_frontend_env() {
  local origen="$REPO/backend/.env"
  local destino="$REPO/deploy/frontend.env"
  if $DRY_RUN; then log "DRY-RUN: generar $destino desde $origen (solo JWT_SECRET)"; return; fi
  grep -E '^JWT_SECRET=.+' "$origen" > "$destino.tmp" \
    || die "backend/.env no tiene JWT_SECRET; no se puede generar deploy/frontend.env."
  chmod 600 "$destino.tmp"
  mv "$destino.tmp" "$destino"
  log "deploy/frontend.env generado (solo JWT_SECRET)."
}

# Espera a que un contenedor de una pasada termine. Devuelve 0 si salio con
# codigo 0 y 1 si fallo o no termino a tiempo.
esperar_una_pasada() {
  local nombre="$1" intentos="${2:-60}" estado
  if $DRY_RUN; then log "DRY-RUN: esperar a que $nombre termine"; return 0; fi
  for _ in $(seq 1 "$intentos"); do
    estado="$(podman inspect -f '{{.State.Status}}:{{.State.ExitCode}}' "$nombre" 2>/dev/null || echo 'ausente:')"
    case "$estado" in
      exited:0) return 0 ;;
      exited:*) warn "$nombre termino con error ($estado). Revisa: podman logs $nombre"; return 1 ;;
    esac
    sleep 5
  done
  warn "$nombre no termino a tiempo. Revisa: podman logs $nombre"
  return 1
}

# Retira los contenedores del proyecto que el compose ya no declara, como el
# linuxlab-frontend-old que quedo tras el OOM de noviembre. Un contenedor asi
# rompe el despliegue entero por dos lados. Si depende de otros (`--requires`),
# Podman no deja borrar esos otros, asi que el `down` no los quita y el `up`
# choca con sus nombres. Y si trae la configuracion vieja, podman-compose ve una
# huella distinta y en cada `up` intenta recrear el stack. En el despliegue de
# noviembre eso dejo el backend, el frontend y el proxy sin levantar.
#
# Antes de borrarlo se guarda entero: su contenido como imagen
# (`<nombre>-respaldo`) y su configuracion en ~/linuxlab-respaldos. Si hiciera
# falta, se puede volver a crear desde ahi.
retirar_huerfanos() {
  local compose="$REPO/deploy/compose.podman.yml" esperados candidatos nombre marca destino
  esperados="$(awk '$1 == "container_name:" { print $2 }' "$compose")"
  candidatos="$(
    {
      podman ps -a --filter "label=io.podman.compose.project=$PROJECT" --format '{{.Names}}'
      podman ps -a --filter "name=^$PROJECT-" --format '{{.Names}}'
    } 2>/dev/null | sort -u
  )"
  marca="$(date +%Y%m%d-%H%M%S)"
  destino="${RESPALDOS_DIR:-$HOME/linuxlab-respaldos}"
  for nombre in $candidatos; do
    if printf '%s\n' "$esperados" | grep -qxF "$nombre"; then continue; fi
    warn "Contenedor $nombre fuera del compose: se respalda y se retira."
    if $DRY_RUN; then log "DRY-RUN: respaldar y borrar $nombre"; continue; fi
    mkdir -p "$destino"
    podman inspect "$nombre" > "$destino/$nombre-$marca.json" \
      || die "No se pudo guardar la configuracion de $nombre; no se borra nada."
    run "podman commit $nombre $nombre-respaldo:$marca"
    run "podman rm -f $nombre"
    log "  $nombre respaldado (imagen $nombre-respaldo:$marca y $destino/$nombre-$marca.json) y retirado."
  done
}

# Baja el stack y lo vuelve a levantar por etapas. Deja MIGRADO=1 si las
# migraciones terminaron bien, que es lo que mira el paso de las semillas.
levantar_stack() {
  MIGRADO=0

  retirar_huerfanos

  log "Bajando el stack existente (los volumenes persisten)..."
  run "podman-compose $COMPOSE down"

  generar_frontend_env

  log "Levantando la base de datos y el almacenamiento..."
  run "podman-compose $COMPOSE up -d $PERMANENTES_BASE"

  log "Ejecutando init y migrate (una sola pasada)..."
  run "podman-compose $COMPOSE up -d init migrate"
  esperar_una_pasada linuxlab-init 24 \
    || die "init fallo: sin claves SSH el backend no puede entrar al entorno."
  if esperar_una_pasada linuxlab-migrate 60; then
    MIGRADO=1
  else
    warn "Las migraciones no terminaron bien; el resto se levanta igual y se omiten las semillas."
  fi

  log "Levantando el entorno, el backend, el frontend y el proxy..."
  run "podman-compose $COMPOSE up -d $PERMANENTES_APP"

  # podman-compose 1.0.6 puede ignorar pids_limit; se aplica sobre el
  # contenedor ya creado.
  intentar "podman update --pids-limit 512 linuxlab-entorno" \
    || warn "No se pudo aplicar pids_limit a linuxlab-entorno (el techo de procesos queda en los ulimits)."
}

# Arranque tras un reinicio del servidor. podman-restart.service levanta los
# contenedores con restart: always al iniciar la sesion del usuario, y el
# linger hace que esa sesion exista sin que nadie entre por SSH. Si el
# servidor no lo permite, se avisa y el despliegue sigue.
asegurar_arranque_automatico() {
  if $DRY_RUN; then log "DRY-RUN: habilitar podman-restart.service y linger"; return; fi
  if [ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" != "yes" ]; then
    intentar "loginctl enable-linger $USER" \
      || warn "No se pudo activar linger para $USER. Pide al administrador: sudo loginctl enable-linger $USER"
  fi
  if intentar "systemctl --user enable podman-restart.service"; then
    log "Arranque automatico tras reinicio: podman-restart.service habilitado."
  else
    warn "No se pudo habilitar podman-restart.service. Tras un reinicio del servidor habra que levantar el stack a mano."
  fi
}
