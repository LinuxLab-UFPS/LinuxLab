#!/usr/bin/python3
"""Evaluador de aserciones atomicas del laboratorio.

Se ejecuta DENTRO del contenedor y CON LA IDENTIDAD DEL ESTUDIANTE
(`sudo -u <estudiante>`), nunca como root: si corriera como root, "el archivo
existe y se puede leer" seria cierto siempre y la asercion no medaria nada.

Entra un JSON por stdin y sale un JSON por stdout:

    {"checks": [{"id": "c1", "type": "directorio_existe",
                 "params": {"ruta": "/home/$usuario/practicas"}}]}

    {"results": [{"id": "c1", "passed": true, "detail": "..."}]}

Los parametros del docente viajan como datos y nunca se interpolan en una
shell. Toda ruta se resuelve con realpath y tiene que caer dentro del home del
propio estudiante, de modo que un enlace simbolico al trabajo de un compañero
no sirva para aprobar.
"""

import grp
import json
import os
import pwd
import signal
import stat
import sys

# Ninguna asercion deberia tardar: un bucle de enlaces o un archivo enorme se
# cortan antes de colgar la evaluacion.
TIMEOUT_SECONDS = 10
MAX_FILE_BYTES = 2 * 1024 * 1024

USER_TOKEN = "$usuario"


class CheckError(Exception):
    """Falla esperada: se reporta como aserción no cumplida, no como error."""


def me():
    return pwd.getpwuid(os.getuid())


def resolve(raw, home):
    """Convierte la ruta del docente en una ruta real dentro del home.

    `/home/$usuario/x` y `x` terminan en el mismo sitio. Cualquier cosa que
    apunte fuera del home del estudiante se rechaza, incluidos los `..` y los
    enlaces que salten a otra cuenta.
    """
    if not raw or not raw.strip():
        raise CheckError("La ruta está vacía")

    path = raw.strip().replace(USER_TOKEN, me().pw_name)

    prefix = "/home/" + me().pw_name
    if path == prefix:
        path = home
    elif path.startswith(prefix + "/"):
        # El docente escribe el home simbolico; el real cuelga del curso.
        path = os.path.join(home, path[len(prefix) + 1:])
    elif not path.startswith("/"):
        path = os.path.join(home, path)

    real = os.path.realpath(path)
    home_real = os.path.realpath(home)
    if real != home_real and not real.startswith(home_real + os.sep):
        raise CheckError("La ruta queda fuera de tu carpeta personal")
    return real


def owned_by_me(path):
    return os.stat(path).st_uid == os.getuid()


def display_name(path):
    """Nombre legible de la ruta resuelta: el ultimo segmento, para insertarlo
    en los mensajes de retroalimentacion. Si no hay nombre, un sustantivo
    generico."""
    name = os.path.basename(path)
    return name or "el elemento"


def natural_join(items):
    """Une una lista en espanol: 'a', 'b y c', 'a, b y c'."""
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} y {items[1]}"
    return f"{', '.join(items[:-1])} y {items[-1]}"


def perms_deltas(expected, actual):
    """Compara dos modos octales (3 digitos) y devuelve (faltan, sobran): las
    listas de permisos que faltan o que sobran, expresadas como 'X para <rol>'."""
    BITS = {"4": "lectura", "2": "escritura", "1": "ejecución"}
    ROLES = ["el propietario", "el grupo", "otros"]
    faltan, sobran = [], []
    for i in range(3):
        e = int(expected[i])
        a = int(actual[i])
        for bit, label in BITS.items():
            b = int(bit)
            if e & b and not (a & b):
                faltan.append(f"{label} para {ROLES[i]}")
            elif a & b and not (e & b):
                sobran.append(f"{label} para {ROLES[i]}")
    return faltan, sobran


def check_directorio_existe(params, home):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.exists(path):
        raise CheckError(f"Se esperaba que existiera el directorio '{name}'. No existe")
    if not os.path.isdir(path):
        raise CheckError(f"Se esperaba un directorio en '{name}'. Existe, pero es un archivo")
    if not owned_by_me(path):
        raise CheckError(f"El directorio '{name}' existe, pero no pertenece a {me().pw_name}")
    return f"El directorio '{name}' existe y pertenece a {me().pw_name}"


def check_archivo_existe(params, home):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.exists(path):
        raise CheckError(f"Se esperaba que existiera el archivo '{name}'. No existe")
    if os.path.isdir(path):
        raise CheckError(f"Se esperaba un archivo en '{name}'. Existe, pero es un directorio")
    if not owned_by_me(path):
        raise CheckError(f"El archivo '{name}' existe, pero no pertenece a {me().pw_name}")
    return f"El archivo '{name}' existe y pertenece a {me().pw_name}"


def check_archivo_no_existe(params, home):
    """Para las actividades de borrar: lo que se comprueba es la ausencia."""
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if os.path.exists(path):
        raise CheckError(f"Se esperaba que '{name}' ya no existiera. Todavía existe")
    return f"El archivo '{name}' ya no existe, como se esperaba"


def check_permisos_son(params, home):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.exists(path):
        raise CheckError(f"Se esperaban permisos en '{name}'. El archivo no existe")
    expected = (params.get("modo") or "").strip()
    if not expected.isdigit() or not 3 <= len(expected) <= 4:
        raise CheckError("El modo esperado no es un octal válido")
    actual = oct(stat.S_IMODE(os.stat(path).st_mode))[2:].zfill(len(expected))
    expected_padded = expected.zfill(len(actual))
    if actual != expected_padded:
        faltan, sobran = perms_deltas(expected_padded, actual)
        partes = []
        if faltan:
            partes.append(("falta" if len(faltan) == 1 else "faltan") + " " + natural_join(faltan))
        if sobran:
            partes.append(("sobra" if len(sobran) == 1 else "sobran") + " " + natural_join(sobran))
        raise CheckError(f"Para '{name}' " + " y ".join(partes) + ".")
    return f"Los permisos de '{name}' son correctos: {actual}."


def check_propietario_es(params, home):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.exists(path):
        raise CheckError(f"Se esperaba revisar el propietario de '{name}'. El archivo no existe")
    expected = (params.get("usuario") or "").strip().replace(USER_TOKEN, me().pw_name)
    owner = pwd.getpwuid(os.stat(path).st_uid).pw_name
    if owner != expected:
        raise CheckError(
            f"Se esperaba que el propietario de '{name}' fuera '{expected}'. "
            f"El propietario actual es '{owner}'"
        )
    return f"El propietario de '{name}' es correcto: '{owner}'."


def lineas_utiles(path):
    """Las lineas con algo escrito. Las vacias no cuentan: si contaran, cinco
    veces Enter cumpliria cualquier requisito de cantidad."""
    if os.path.getsize(path) > MAX_FILE_BYTES:
        raise CheckError("El archivo es demasiado grande para revisarlo")
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        return [line.strip() for line in fh.read().splitlines() if line.strip()]


def check_archivo_es(params, home):
    """El archivo tiene exactamente este contenido, linea por linea y en orden.

    `archivo_contiene` no sirve cuando el orden es parte del ejercicio: con ella,
    las mismas lineas puestas al reves aprobarian igual. Se comparan las lineas
    con contenido, sin espacios al final, para que un salto de linea de mas no
    tumbe un trabajo correcto.
    """
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.isfile(path):
        raise CheckError(f"Se esperaba revisar '{name}'. No existe o no es un archivo")

    esperadas = [l.rstrip() for l in (params.get("valor") or "").splitlines() if l.strip()]
    if not esperadas:
        raise CheckError("No se indico cual es el contenido esperado")

    obtenidas = lineas_utiles(path)
    if len(obtenidas) != len(esperadas):
        raise CheckError(
            f"Se esperaba que '{name}' tuviera exactamente {len(esperadas)} líneas con "
            f"contenido. Tiene {len(obtenidas)}"
        )
    for i, (tuya, esperada) in enumerate(zip(obtenidas, esperadas), start=1):
        if tuya != esperada:
            raise CheckError(
                f"Se esperaba que la línea {i} de '{name}' fuera '{esperada}'. "
                f"La línea {i} es '{tuya}'"
            )
    return f"El contenido de '{name}' es exactamente el esperado."


def check_minimo_lineas(params, home):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.isfile(path):
        raise CheckError(f"Se esperaba revisar '{name}'. No existe o no es un archivo")
    try:
        minimo = int(params.get("cantidad", 0))
    except (TypeError, ValueError):
        raise CheckError("La cantidad de lineas esperada no es un numero")
    lineas = lineas_utiles(path)
    if len(lineas) < minimo:
        raise CheckError(
            f"Se esperaban al menos {minimo} líneas con contenido en '{name}'. "
            f"El archivo tiene {len(lineas)}"
        )
    return f"El archivo '{name}' tiene suficientes líneas ({len(lineas)} líneas, mínimo {minimo})."


def check_ultima_linea_es(params, home):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.isfile(path):
        raise CheckError(f"Se esperaba revisar '{name}'. No existe o no es un archivo")
    esperado = (params.get("valor") or "").strip()
    if not esperado:
        raise CheckError("No se indico que debia ir en la ultima linea")
    lineas = lineas_utiles(path)
    if not lineas:
        raise CheckError(f"Se esperaba que la última línea de '{name}' fuera '{esperado}'. El archivo está vacío")
    if lineas[-1] != esperado:
        raise CheckError(
            f"Se esperaba que la última línea de '{name}' fuera '{esperado}'. "
            f"La última línea es '{lineas[-1]}'"
        )
    return f"La última línea de '{name}' es '{esperado}', como se esperaba."


def check_archivo_contiene(params, home):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path)
    if not os.path.isfile(path):
        raise CheckError(f"Se esperaba revisar '{name}'. No existe o no es un archivo")
    needle = params.get("patron") or ""
    if not needle:
        raise CheckError("No se indicó qué buscar")
    if os.path.getsize(path) > MAX_FILE_BYTES:
        raise CheckError("El archivo es demasiado grande para revisarlo")
    # UTF-8 explicito: si el contenedor arrancara sin locale, Python leeria en
    # ASCII y un archivo con acentos o emoji no coincidiria nunca con su patron.
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if needle in line:
                return f"El archivo '{name}' contiene el texto '{needle}', como se esperaba."
    raise CheckError(
        f"Se esperaba que '{name}' contuviera el texto '{needle}'. El archivo no contiene lo esperado"
    )


CHECKS = {
    "directorio_existe": check_directorio_existe,
    "archivo_existe": check_archivo_existe,
    "archivo_no_existe": check_archivo_no_existe,
    "permisos_son": check_permisos_son,
    "propietario_es": check_propietario_es,
    "archivo_contiene": check_archivo_contiene,
    "minimo_lineas": check_minimo_lineas,
    "archivo_es": check_archivo_es,
    "ultima_linea_es": check_ultima_linea_es,
}


def run(check, home):
    fn = CHECKS.get(check.get("type"))
    if fn is None:
        return {"id": check.get("id"), "passed": False, "detail": "Tipo de aserción desconocido"}
    try:
        return {"id": check.get("id"), "passed": True, "detail": fn(check.get("params") or {}, home)}
    except CheckError as err:
        return {"id": check.get("id"), "passed": False, "detail": str(err)}
    except PermissionError:
        return {"id": check.get("id"), "passed": False, "detail": "No tienes permiso sobre esa ruta"}
    except OSError as err:
        return {"id": check.get("id"), "passed": False, "detail": f"No se pudo revisar: {err.strerror}"}


def main():
    signal.signal(signal.SIGALRM, lambda *_: sys.exit("timeout"))
    signal.alarm(TIMEOUT_SECONDS)

    payload = json.load(sys.stdin)
    home = me().pw_dir
    results = [run(check, home) for check in payload.get("checks", [])]
    json.dump({"user": me().pw_name, "home": home, "results": results}, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
