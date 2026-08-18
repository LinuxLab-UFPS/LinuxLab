#!/usr/bin/python3
"""Gestor de entregas manuales del laboratorio.

Se ejecuta DENTRO del contenedor y CON LA IDENTIDAD DEL ESTUDIANTE
(`sudo -u <estudiante>`), igual que el checker y el setup.

Recibe un JSON por stdin con la accion a realizar y devuelve un JSON por stdout.

Acciones soportadas:

    {"action": "tree", "workdir": "T-0001"}
    -> {"ok": true, "tree": ["ejercicio1/respuesta.txt", ...]}

    {"action": "zipball", "workdir": "T-0001", "dest": "/tmp/xxx.zip"}
    -> {"ok": true, "totalBytes": 12345}

Toda ruta se resuelve dentro del home del estudiante, siguiendo el patron
de checker.py y setup.py. El backend nunca arma comandos shell con datos
del usuario; este script es quien decide que hacer con los datos.
"""

import json
import os
import pwd
import signal
import subprocess
import sys
import tempfile
import zipfile

TIMEOUT_SECONDS = 30
MAX_TARBALL_BYTES = 5 * 1024 * 1024

BASE = "actividades"


def me():
    return pwd.getpwuid(os.getuid())


def resolve_workdir(workdir):
    """Resuelve y valida la ruta de la carpeta de trabajo.

    La ruta debe quedar dentro de ~/actividades/ y no puede contener '..'.
    """
    if not workdir or not isinstance(workdir, str):
        raise ValueError("Falta el workdir")
    if ".." in workdir or workdir.startswith("/"):
        raise ValueError("workdir no valido")

    home = me().pw_dir
    path = os.path.join(home, BASE, workdir)

    real = os.path.realpath(path)
    home_real = os.path.realpath(home)
    base_real = os.path.realpath(os.path.join(home, BASE))

    if not (real == base_real or real.startswith(base_real + os.sep)):
        raise ValueError("La ruta queda fuera de actividades")

    return real


def action_tree(workdir):
    """Lista los archivos relativos dentro de la carpeta de trabajo."""
    root = resolve_workdir(workdir)
    if not os.path.isdir(root):
        return {"ok": True, "tree": []}

    tree = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        for name in sorted(filenames):
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root)
            tree.append(rel)

    return {"ok": True, "tree": tree}


def action_zipball(workdir, dest):
    """Crea un .zip de la carpeta de trabajo.

    El zip se escribe en `dest` (ruta absoluta, normalmente /tmp/).
    El backend limpia el archivo despues de subirlo a Storage.
    """
    root = resolve_workdir(workdir)
    if not os.path.isdir(root):
        raise ValueError("La carpeta de trabajo no existe")

    if not dest or not isinstance(dest, str):
        raise ValueError("Falta el dest")
    dest_real = os.path.realpath(dest)
    if not dest_real.startswith("/tmp/"):
        raise ValueError("El destino debe estar en /tmp/")

    with zipfile.ZipFile(dest_real, "w", zipfile.ZIP_DEFLATED) as zf:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames.sort()
            for name in sorted(filenames):
                full = os.path.join(dirpath, name)
                arcname = os.path.relpath(full, root)
                zf.write(full, arcname=arcname)

    total_bytes = os.path.getsize(dest_real)
    if total_bytes > MAX_TARBALL_BYTES:
        os.remove(dest_real)
        raise ValueError("El tamano de la entrega supera el limite de 5 MB")

    return {"ok": True, "totalBytes": total_bytes}


ACTIONS = {
    "tree": lambda p: action_tree(p.get("workdir")),
    "zipball": lambda p: action_zipball(p.get("workdir"), p.get("dest")),
}


def main():
    signal.signal(signal.SIGALRM, lambda *_: sys.exit("timeout"))
    signal.alarm(TIMEOUT_SECONDS)

    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        json.dump({"ok": False, "error": "El payload no es JSON valido"}, sys.stdout)
        sys.stdout.write("\n")
        return

    action = payload.get("action")
    fn = ACTIONS.get(action)
    if fn is None:
        json.dump({"ok": False, "error": f"Accion desconocida: {action}"}, sys.stdout)
        sys.stdout.write("\n")
        return

    try:
        result = fn(payload)
    except ValueError as err:
        result = {"ok": False, "error": str(err)}
    except OSError as err:
        result = {"ok": False, "error": f"Error del sistema: {err.strerror}"}

    json.dump(result, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
