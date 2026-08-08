#!/usr/bin/python3
"""Arma el directorio de trabajo de una actividad.

Se ejecuta DENTRO del contenedor y CON LA IDENTIDAD DEL ESTUDIANTE
(`sudo -u <estudiante>`), igual que el checker. Recibe un JSON por stdin con la
descripcion del arbol y lo materializa dentro de la carpeta de la actividad:

    {"slug": "comodines",
     "dirs": ["archivo"],
     "files": [{"path": "informe.txt", "content": "..."}]}

    {"ok": true, "root": "/home/.../.actividades/comodines", "creados": 4}

Va aparte del checker a proposito. El checker solo lee, y darle permiso de
escritura para ahorrarse un archivo significaria que un fallo suyo pueda
estropear el trabajo que esta evaluando. Aqui se escribe, alli se mide.

El arbol llega como DATOS, nunca como ordenes: se reciben rutas y contenidos, y
este programa decide que hacer con ellos. Si el docente pudiera mandar comandos,
se perderia la garantia que sostiene todo lo demas.
"""

import json
import os
import pwd
import shutil
import signal
import sys

TIMEOUT_SECONDS = 20

#: Todo lo de las actividades cuelga de aqui, dentro del home del estudiante.
BASE = ".actividades"

#: Topes para que una actividad mal escrita no llene el disco de nadie.
MAX_ARCHIVOS = 200
MAX_BYTES_ARCHIVO = 512 * 1024
MAX_BYTES_TOTAL = 4 * 1024 * 1024

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


def construye(spec):
    raiz = os.path.join(home(), BASE, valida_slug(spec.get("slug", "")))

    # Rehacer el arbol es la forma de "recargar": lo de antes se descarta entero,
    # que es justo lo que hace segura la actividad de borrar cosas.
    if os.path.exists(raiz):
        shutil.rmtree(raiz)
    os.makedirs(raiz, mode=0o700, exist_ok=True)

    archivos = spec.get("files") or []
    if len(archivos) > MAX_ARCHIVOS:
        raise SetupError(f"La actividad pide {len(archivos)} archivos, el tope es {MAX_ARCHIVOS}")

    creados = 0
    total = 0

    for carpeta in spec.get("dirs") or []:
        os.makedirs(dentro(raiz, carpeta), mode=0o700, exist_ok=True)
        creados += 1

    for archivo in archivos:
        destino = dentro(raiz, archivo.get("path", ""))
        contenido = archivo.get("content", "")
        if not isinstance(contenido, str):
            raise SetupError("El contenido de un archivo tiene que ser texto")

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
    except OSError as err:
        resultado = {"ok": False, "error": f"No se pudo preparar: {err.strerror}"}

    json.dump(resultado, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
