#!/usr/bin/python3
"""Evaluador de aserciones atomicas del laboratorio.

Se ejecuta DENTRO del contenedor y CON LA IDENTIDAD DEL ESTUDIANTE
(`sudo -u <estudiante>`), nunca como root: si corriera como root, "el archivo
existe y se puede leer" seria cierto siempre y la asercion no medaria nada.

Entra un JSON por stdin y sale un JSON por stdout:

    {"workdir": "actividades/<carpeta>",        // opcional
     "checks": [{"id": "c1", "type": "directorio_existe",
                 "params": {"ruta": "/home/$usuario/practicas"}}]}

    {"results": [{"id": "c1", "passed": true, "detail": "..."}]}

Con `workdir` (la carpeta de trabajo de la actividad, relativa al home) los
mensajes muestran la ruta tal como la escribio el docente en la asercion; sin
el, la ruta se muestra relativa al home del estudiante.

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
        raise CheckError(
            "La ruta que pide el enunciado queda fuera de tu carpeta personal: "
            "todo tu trabajo debe vivir dentro de tu home."
        )
    return real


def owned_by_me(path):
    return os.stat(path).st_uid == os.getuid()


def display_name(path, home, base=""):
    """Ruta legible para los mensajes de retroalimentacion.

    Relativa al home del estudiante y, cuando vive dentro de la carpeta de
    trabajo de la actividad, relativa a ella (el mismo camino que escribio el
    docente en la asercion). Asi dos checks que apuntan a archivos con el
    mismo nombre en carpetas distintas no producen mensajes identicos que se
    contradigan entre si.
    """
    rel = os.path.relpath(path, home)
    if rel == ".":
        return "tu carpeta personal"
    base = (base or "").strip().strip("/")
    if base and (rel == base or rel.startswith(base + os.sep)):
        inner = rel[len(base):].lstrip("/")
        # La ruta es la propia carpeta de la actividad: mejor el camino completo.
        if inner:
            return inner
    return rel


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


def check_directorio_existe(params, home, base=""):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.exists(path):
        raise CheckError(
            f"Busqué el directorio '{name}' en tu carpeta de trabajo, pero todavía no existe. "
            "Créalo con mkdir y vuelve a comprobar."
        )
    if not os.path.isdir(path):
        raise CheckError(
            f"Encontré algo llamado '{name}', pero es un archivo: el enunciado pide un "
            "directorio. Revisa si lo creaste con touch en lugar de mkdir."
        )
    if not owned_by_me(path):
        raise CheckError(
            f"El directorio '{name}' existe, pero pertenece a otra cuenta: debe ser tuyo. "
            "Verifica en qué carpeta lo creaste y con qué usuario trabajas."
        )
    return f"¡Muy bien! El directorio '{name}' existe y te pertenece."


def check_archivo_existe(params, home, base=""):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.exists(path):
        raise CheckError(
            f"Busqué el archivo '{name}' en tu carpeta de trabajo, pero todavía no existe. "
            "Puedes crearlo con touch o con tu editor de texto, y luego volver a comprobar."
        )
    if os.path.isdir(path):
        raise CheckError(
            f"Encontré algo llamado '{name}', pero es un directorio: el enunciado pide un "
            "archivo. Revisa el nombre que le diste."
        )
    if not owned_by_me(path):
        raise CheckError(
            f"El archivo '{name}' existe, pero pertenece a otra cuenta: debe ser tuyo. "
            "Verifica en qué carpeta lo creaste."
        )
    return f"¡Perfecto! El archivo '{name}' existe y te pertenece."


def check_archivo_no_existe(params, home, base=""):
    """Para las actividades de borrar: lo que se comprueba es la ausencia."""
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if os.path.exists(path):
        raise CheckError(
            f"'{name}' todavía está en tu carpeta. El enunciado pide que lo hayas eliminado: "
            "prueba con rm y vuelve a comprobar."
        )
    return f"Listo: '{name}' ya no está en tu carpeta, tal como pedía el enunciado."


def check_permisos_son(params, home, base=""):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.exists(path):
        raise CheckError(
            f"Quería revisar los permisos de '{name}', pero todavía no existe. Créalo "
            "primero y luego aplica los permisos con chmod."
        )
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
        raise CheckError(
            f"Casi lo tienes: '{name}' tiene ahora permisos {actual}, y se esperaban "
            f"{expected_padded} — " + " y ".join(partes) + ". Ajusta con chmod y vuelve a comprobar."
        )
    return f"¡Exacto! Los permisos de '{name}' son justamente los que pedía el enunciado."


def check_propietario_es(params, home, base=""):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.exists(path):
        raise CheckError(
            f"Quería revisar el propietario de '{name}', pero todavía no existe. "
            "Créalo primero y luego ajusta la propiedad con chown."
        )
    expected = (params.get("usuario") or "").strip().replace(USER_TOKEN, me().pw_name)
    owner = pwd.getpwuid(os.stat(path).st_uid).pw_name
    if owner != expected:
        raise CheckError(
            f"El propietario de '{name}' no es el que pide el enunciado: ahora es "
            f"'{owner}' y debería ser '{expected}'. Revisa cómo cambiarlo con chown."
        )
    return f"El propietario de '{name}' es el correcto: '{owner}'. Bien aplicado el chown."


def lineas_utiles(path):
    """Las lineas con algo escrito. Las vacias no cuentan: si contaran, cinco
    veces Enter cumpliria cualquier requisito de cantidad."""
    if os.path.getsize(path) > MAX_FILE_BYTES:
        raise CheckError("El archivo es demasiado grande para revisarlo")
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        return [line.strip() for line in fh.read().splitlines() if line.strip()]


def check_archivo_es(params, home, base=""):
    """El archivo tiene exactamente este contenido, linea por linea y en orden.

    `archivo_contiene` no sirve cuando el orden es parte del ejercicio: con ella,
    las mismas lineas puestas al reves aprobarian igual. Se comparan las lineas
    con contenido, sin espacios al final, para que un salto de linea de mas no
    tumbe un trabajo correcto.
    """
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.isfile(path):
        raise CheckError(f"Se esperaba revisar '{name}'. No existe o no es un archivo")

    esperadas = [l.rstrip() for l in (params.get("valor") or "").splitlines() if l.strip()]
    if not esperadas:
        raise CheckError("No se indico cual es el contenido esperado")

    obtenidas = lineas_utiles(path)
    if len(obtenidas) != len(esperadas):
        sobran = len(obtenidas) > len(esperadas)
        raise CheckError(
            f"'{name}' tiene {len(obtenidas)} líneas con contenido y se esperaban "
            f"{len(esperadas)}. Revisa si "
            + ("te sobra alguna línea." if sobran else "te falta alguna línea.")
        )
    for i, (tuya, esperada) in enumerate(zip(obtenidas, esperadas), start=1):
        if tuya != esperada:
            raise CheckError(
                f"Casi: la línea {i} de '{name}' no coincide con el enunciado. "
                f"Ahí escribiste '{tuya}'. Revisa esa línea y ajústala."
            )
    return f"El contenido de '{name}' coincide exactamente con lo que pedía el enunciado. ¡Buen trabajo!"


def check_minimo_lineas(params, home, base=""):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.isfile(path):
        raise CheckError(
            f"Quería contar las líneas de '{name}', pero todavía no existe. "
            "Créalo y escribe el contenido que pide el enunciado."
        )
    try:
        minimo = int(params.get("cantidad", 0))
    except (TypeError, ValueError):
        raise CheckError("La cantidad de lineas esperada no es un numero")
    lineas = lineas_utiles(path)
    if len(lineas) < minimo:
        raise CheckError(
            f"'{name}' tiene {len(lineas)} línea(s) con contenido, pero el enunciado pide "
            f"al menos {minimo}. Añade el contenido que falta y vuelve a comprobar."
        )
    return f"'{name}' cumple el mínimo de líneas: tiene {len(lineas)} con contenido."


def check_ultima_linea_es(params, home, base=""):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.isfile(path):
        raise CheckError(
            f"Quería revisar la última línea de '{name}', pero todavía no existe. "
            "Créalo y escribe lo que pide el enunciado."
        )
    esperado = (params.get("valor") or "").strip()
    if not esperado:
        raise CheckError("No se indico que debia ir en la ultima linea")
    lineas = lineas_utiles(path)
    if not lineas:
        raise CheckError(
            f"'{name}' está vacío: no hay última línea que revisar. "
            "Escribe primero el contenido que pide el enunciado."
        )
    if lineas[-1] != esperado:
        raise CheckError(
            f"La última línea de '{name}' no es la que pide el enunciado: dice "
            f"'{lineas[-1]}'. Revisa el final del archivo."
        )
    return f"La última línea de '{name}' es exactamente la que pedía el enunciado."


def check_archivo_contiene(params, home, base=""):
    path = resolve(params.get("ruta", ""), home)
    name = display_name(path, home, base)
    if not os.path.isfile(path):
        raise CheckError(
            f"Quería revisar el contenido de '{name}', pero todavía no existe. "
            "Créalo y escribe el texto que pide el enunciado."
        )
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
                return f"Encontré en '{name}' el texto que pedía el enunciado. ¡Bien!"
    raise CheckError(
        f"Revisé '{name}' de principio a fin y no encontré el texto que pide el "
        "enunciado. Verifica lo que escribiste (cuida mayúsculas, tildes y espacios)."
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


def run(check, home, base=""):
    fn = CHECKS.get(check.get("type"))
    if fn is None:
        return {"id": check.get("id"), "passed": False, "detail": "Tipo de aserción desconocido"}
    try:
        return {"id": check.get("id"), "passed": True, "detail": fn(check.get("params") or {}, home, base)}
    except CheckError as err:
        return {"id": check.get("id"), "passed": False, "detail": str(err)}
    except PermissionError:
        return {"id": check.get("id"), "passed": False, "detail": "No tienes permiso para revisar esa ruta: el chequeo corre con tu propio usuario. Ajusta los permisos e inténtalo de nuevo."}
    except OSError as err:
        return {"id": check.get("id"), "passed": False, "detail": f"No pude revisar la ruta: {err.strerror}. Inténtalo de nuevo; si persiste, avisa a tu docente."}


def main():
    signal.signal(signal.SIGALRM, lambda *_: sys.exit("timeout"))
    signal.alarm(TIMEOUT_SECONDS)

    payload = json.load(sys.stdin)
    home = me().pw_dir
    # Carpeta de trabajo de la actividad (relativa al home), si el backend la
    # manda: permite que los mensajes muestren la ruta tal como la escribio el
    # docente en la asercion, en vez del camino completo desde el home.
    base = payload.get("workdir") or ""
    results = [run(check, home, base) for check in payload.get("checks", [])]
    json.dump({"user": me().pw_name, "home": home, "results": results}, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
