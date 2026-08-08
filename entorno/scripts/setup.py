#!/usr/bin/python3
"""Arma el directorio de trabajo de una actividad.

Se ejecuta DENTRO del contenedor y CON LA IDENTIDAD DEL ESTUDIANTE
(`sudo -u <estudiante>`), igual que el checker. Recibe un JSON por stdin con la
descripcion del arbol y lo materializa dentro de la carpeta de la actividad:

    {"slug": "comodines", "force": false,
     "dirs": ["archivo"],
     "files": [{"path": "informe.txt", "content": "..."},
               {"path": "largo.txt", "lines": 1000, "fill": "registro",
                "at": {"1": "primera linea de verdad"}}]}

    {"ok": true, "root": "/home/.../actividades/comodines", "creados": 4}

Con `force` en falso no toca nada si la carpeta ya existe: eso es lo que permite
preparar el arbol al abrir la actividad sin borrar lo que el estudiante llevaba
hecho. El boton de recargar manda `force` y ahi si se rehace entero.

Va aparte del checker a proposito. El checker solo lee, y darle permiso de
escritura para ahorrarse un archivo significaria que un fallo suyo pueda
estropear el trabajo que esta evaluando. Aqui se escribe, alli se mide.

El arbol llega como DATOS, nunca como ordenes: se reciben rutas y contenidos, y
este programa decide que hacer con ellos. Si el docente pudiera mandar comandos,
se perderia la garantia que sostiene todo lo demas.
"""

import json
import os
import random
import pwd
import shutil
import signal
import sys

TIMEOUT_SECONDS = 20

#: Todo lo de las actividades cuelga de aqui, dentro del home del estudiante.
#: A la vista y no oculto: el estudiante tiene que encontrarlo con un `ls`, y un
#: nombre con punto delante lo dejaba invisible justo para quien debe usarlo.
BASE = "actividades"

#: Topes para que una actividad mal escrita no llene el disco de nadie.
MAX_ARCHIVOS = 200
MAX_BYTES_ARCHIVO = 512 * 1024
MAX_BYTES_TOTAL = 4 * 1024 * 1024
MAX_LINEAS = 5000

#: Nombres de actividad y rutas admitidos. Sin `..`, sin rutas absolutas.
SLUG_OK = set("abcdefghijklmnopqrstuvwxyz0123456789-")
RUTA_OK = SLUG_OK | set("._/ABCDEFGHIJKLMNOPQRSTUVWXYZ")


class SetupError(Exception):
    """Falla que se reporta al backend, no un error de programa."""


def home():
    return pwd.getpwuid(os.getuid()).pw_dir


def valida_slug(slug):
    if not slug or not set(slug) <= SLUG_OK:
        raise SetupError("El nombre de la actividad no es valido")
    return slug


def dentro(raiz, relativa):
    """Resuelve una ruta relativa y comprueba que no se salga de la carpeta.

    Mismo criterio que el checker: se resuelve primero y se juzga despues, para
    que un `..` o un enlace simbolico no sirvan de atajo hacia fuera.
    """
    if not relativa or not set(relativa) <= RUTA_OK:
        raise SetupError(f"Ruta no valida: {relativa!r}")
    if relativa.startswith("/"):
        raise SetupError("Las rutas de una actividad son relativas")

    destino = os.path.realpath(os.path.join(raiz, relativa))
    raiz_real = os.path.realpath(raiz)
    if destino != raiz_real and not destino.startswith(raiz_real + os.sep):
        raise SetupError(f"La ruta queda fuera de la actividad: {relativa}")
    return destino


def texto_de(archivo):
    """El contenido de un archivo, literal o generado.

    Un archivo de mil lineas no cabe razonablemente en la semilla, asi que se
    describe: cuantas lineas, con que rellenarlas y que poner en las posiciones
    que importan. `at` va indexado desde 1, como las cuenta el estudiante.
    """
    if "content" in archivo:
        contenido = archivo["content"]
        if not isinstance(contenido, str):
            raise SetupError("El contenido de un archivo tiene que ser texto")
        return contenido

    try:
        total = int(archivo.get("lines", 0))
    except (TypeError, ValueError):
        raise SetupError("El numero de lineas no es un numero")
    if not 0 < total <= MAX_LINEAS:
        raise SetupError(f"Las lineas de un archivo van de 1 a {MAX_LINEAS}")

    relleno = archivo.get("fill", "linea")
    if not isinstance(relleno, str):
        raise SetupError("El relleno tiene que ser texto")

    puestas = archivo.get("at") or {}
    lineas = [f"{relleno} {n:04d}" for n in range(1, total + 1)]
    for posicion, valor in puestas.items():
        try:
            i = int(posicion)
        except (TypeError, ValueError):
            raise SetupError(f"Posicion no valida: {posicion!r}")
        if not 1 <= i <= total:
            raise SetupError(f"La posicion {i} queda fuera del archivo")
        if not isinstance(valor, str):
            raise SetupError("Lo que se pone en una linea tiene que ser texto")
        lineas[i - 1] = valor

    return "\n".join(lineas) + "\n"


def reparte(spec):
    """Reparte unos bloques entre unos archivos, al azar.

    Se baraja aqui y no en la semilla para que cada estudiante reciba un reparto
    distinto, y para que recargar la actividad la vuelva a mezclar: quien se
    aprende que "el bloque de arriba esta en el archivo a" no ha aprendido nada.

    Sigue siendo declarativo. La semilla dice que bloques hay y en cuantos
    archivos van; donde cae cada uno lo decide este programa.
    """
    plan = spec.get("shuffle")
    if not plan:
        return []

    nombres = list(plan.get("files") or [])
    bloques = [list(b) for b in (plan.get("blocks") or [])]
    if len(nombres) != len(bloques):
        raise SetupError("Hay que dar tantos archivos como bloques")
    if not nombres:
        return []

    total = int(plan.get("lines", 100))
    if not 0 < total <= MAX_LINEAS:
        raise SetupError(f"Las lineas de un archivo van de 1 a {MAX_LINEAS}")
    if any(len(b) > total for b in bloques):
        raise SetupError("Un bloque no cabe en el archivo")

    random.shuffle(bloques)

    archivos = []
    for nombre, bloque in zip(nombres, bloques):
        # Al principio o al final, tambien al azar: asi unos piden `head` y
        # otros `tail`, y no siempre los mismos.
        if random.choice((True, False)):
            at = {str(i + 1): l for i, l in enumerate(bloque)}
        else:
            at = {str(total - len(bloque) + 1 + i): l for i, l in enumerate(bloque)}
        archivos.append({"path": nombre, "lines": total, "fill": plan.get("fill", "linea"), "at": at})
    return archivos


def construye(spec):
    raiz = os.path.join(home(), BASE, valida_slug(spec.get("slug", "")))

    # Sin `force`, una carpeta que ya existe se deja intacta. Abrir la actividad
    # no puede borrar el trabajo a medias de quien vuelve a ella.
    if os.path.exists(raiz):
        if not spec.get("force"):
            return {"ok": True, "root": raiz, "creados": 0, "yaEstaba": True}
        shutil.rmtree(raiz)
    os.makedirs(raiz, mode=0o700, exist_ok=True)

    archivos = list(spec.get("files") or []) + reparte(spec)
    if len(archivos) > MAX_ARCHIVOS:
        raise SetupError(f"La actividad pide {len(archivos)} archivos, el tope es {MAX_ARCHIVOS}")

    creados = 0
    total = 0

    for carpeta in spec.get("dirs") or []:
        os.makedirs(dentro(raiz, carpeta), mode=0o700, exist_ok=True)
        creados += 1

    for archivo in archivos:
        destino = dentro(raiz, archivo.get("path", ""))
        contenido = texto_de(archivo)

        datos = contenido.encode("utf-8")
        if len(datos) > MAX_BYTES_ARCHIVO:
            raise SetupError(f"{archivo.get('path')} pasa del tope por archivo")
        total += len(datos)
        if total > MAX_BYTES_TOTAL:
            raise SetupError("La actividad pasa del tope de tamaño total")

        os.makedirs(os.path.dirname(destino), mode=0o700, exist_ok=True)
        with open(destino, "w", encoding="utf-8") as fh:
            fh.write(contenido)
        creados += 1

    return {"ok": True, "root": raiz, "creados": creados}


def main():
    signal.signal(signal.SIGALRM, lambda *_: sys.exit("timeout"))
    signal.alarm(TIMEOUT_SECONDS)

    try:
        resultado = construye(json.load(sys.stdin))
    except SetupError as err:
        resultado = {"ok": False, "error": str(err)}
    except json.JSONDecodeError:
        # El backend lee la salida como JSON. Una traza de Python aqui se
        # convierte alli en un error generico que no dice nada.
        resultado = {"ok": False, "error": "La descripcion de la actividad no es JSON valido"}
    except OSError as err:
        resultado = {"ok": False, "error": f"No se pudo preparar: {err.strerror}"}

    json.dump(resultado, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
