#!/bin/bash
# `tree` acotado al home de quien lo ejecuta.
#
# La leccion de navegacion lo usa para que el estudiante vea la forma del arbol
# que acaba de construir. Suelto, sin embargo, es un recorredor: `tree /` pasea
# por el contenedor entero y `tree /home` enumera las cuentas de los demas. Los
# permisos ya impiden LEER el trabajo ajeno, pero no impiden el paseo ni el
# gasto de recorrerlo.
#
# Vive en /usr/local/bin, que precede a /usr/bin en el PATH, asi que es este el
# que se ejecuta cuando se teclea `tree`. Las opciones se pasan intactas al
# binario real; lo unico que se revisa son las rutas.

set -u

REAL=/usr/bin/tree
HOME_REAL=$(realpath -q "$HOME" 2>/dev/null) || HOME_REAL="$HOME"

fuera() {
  echo "tree: '$1' queda fuera de tu carpeta personal" >&2
  echo "Solo puedes recorrer lo que hay dentro de $HOME." >&2
  exit 1
}

# Las rutas son los argumentos que no empiezan por guion. `tree` acepta opciones
# con valor (-L 2, -P patron), asi que el valor que sigue a una de esas no es una
# ruta y no se comprueba: si se comprobara, `tree -L 2` fallaria por "2".
CON_VALOR="LPIL"
rutas=()
esperando_valor=0

for arg in "$@"; do
  if [ "$esperando_valor" -eq 1 ]; then
    esperando_valor=0
    continue
  fi
  case "$arg" in
    --) continue ;;
    -*)
      # Opcion corta cuya ultima letra consume el siguiente argumento.
      ultima="${arg: -1}"
      case "$CON_VALOR" in
        *"$ultima"*) [ "${#arg}" -eq 2 ] && esperando_valor=1 ;;
      esac
      ;;
    *) rutas+=("$arg") ;;
  esac
done

# Sin ruta, `tree` recorre el directorio actual: se comprueba ese.
[ "${#rutas[@]}" -eq 0 ] && rutas=(".")

for ruta in "${rutas[@]}"; do
  # Se resuelve primero y se juzga despues, igual que en el checker: asi un `..`
  # o un enlace simbolico a otra cuenta no sirven de atajo hacia fuera.
  real=$(realpath -q "$ruta" 2>/dev/null) || fuera "$ruta"
  [ "$real" = "$HOME_REAL" ] && continue
  case "$real" in
    "$HOME_REAL"/*) ;;
    *) fuera "$ruta" ;;
  esac
done

exec "$REAL" "$@"
