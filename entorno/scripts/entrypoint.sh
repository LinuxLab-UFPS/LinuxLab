#!/bin/bash
set -e

echo "[entrypoint] Restaurando cuentas del SO desde volumen..."

# Sembrar los archivos base en el primer arranque (volumen vacio).
if [ ! -f /var/lib/linuxlab/passwd ]; then
  echo "[entrypoint] Primer arranque, sembrando archivos base..."
  mkdir -p /var/lib/linuxlab
  cp -p /etc/passwd  /var/lib/linuxlab/passwd
  cp -p /etc/group   /var/lib/linuxlab/group
  cp -p /etc/shadow  /var/lib/linuxlab/shadow
  cp -p /etc/gshadow /var/lib/linuxlab/gshadow 2>/dev/null || true
fi

# Restaurar desde el volumen a /etc (solo los archivos que existan).
[ -f /var/lib/linuxlab/passwd ] && cp -p /var/lib/linuxlab/passwd  /etc/passwd
[ -f /var/lib/linuxlab/group  ] && cp -p /var/lib/linuxlab/group   /etc/group
[ -f /var/lib/linuxlab/shadow ] && cp -p /var/lib/linuxlab/shadow  /etc/shadow
[ -f /var/lib/linuxlab/gshadow ] && cp -p /var/lib/linuxlab/gshadow /etc/gshadow

chmod 644 /etc/passwd /etc/group
chmod 640 /etc/shadow /etc/gshadow
chown root:shadow /etc/shadow /etc/gshadow

echo "[entrypoint] Configurando clave SSH de labadmin..."

# Aislamiento: /home no listable por otros; labadmin solo para si mismo.
chmod 711 /home 2>/dev/null || true
chmod 700 /home/labadmin 2>/dev/null || true

# Los archivos de cuentas vienen montados desde el proyecto; fijar modos
# por si el filesystem del host no los preserva (git no trackea modos).
chmod 640 /etc/shadow /etc/gshadow
chown root:shadow /etc/shadow /etc/gshadow

if [ -f /ssh/ssh_key.pub ]; then
  mkdir -p /home/labadmin/.ssh
  cp /ssh/ssh_key.pub /home/labadmin/.ssh/authorized_keys
  chown -R labadmin:labadmin /home/labadmin/.ssh 2>/dev/null || true
  chmod 600 /home/labadmin/.ssh/authorized_keys 2>/dev/null || true
fi

ssh-keygen -A >/dev/null 2>&1

# Re-aplicar sudoers
cat > /etc/sudoers.d/labadmin << 'EOF'
labadmin ALL=(root) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /usr/sbin/groupadd, /usr/bin/passwd, /bin/mkdir, /bin/chown, /bin/chmod, /bin/cp, /bin/rm, /usr/bin/su, /bin/sh
labadmin ALL=(ALL) NOPASSWD: /usr/local/lib/linuxlab/checker.py, /usr/local/lib/linuxlab/setup.py, /usr/local/lib/linuxlab/submitter.py
EOF
chmod 440 /etc/sudoers.d/labadmin

echo "[entrypoint] Configurando aislamiento de procesos..."
mount -o remount,hidepid=2 /proc 2>/dev/null || true

echo "[entrypoint] Habilitando limites de CPU por estudiante (cgroups v2)..."

# El techo de CPU por estudiante (10% de 1 CPU) vive en un cgroup por usuario.
# Docker monta /sys/fs/cgroup como read-only por defecto; con CAP_SYS_ADMIN se
# puede remontar como rw, pero ademas el controlador "cpu" debe estar delegado
# al contenedor (cgroup.subtree_control del padre). Si el host no lo permite,
# se cae gracilmente y el fallback nice+ulimit del Nivel 1 protege igual.
if mount -o remount,rw /sys/fs/cgroup 2>/dev/null; then
  mkdir -p /sys/fs/cgroup/linuxlab
  # Habilitar el controlador cpu; si no esta delegado, la escritura falla y
  # grep detecta que no quedo activo (evita loguear "activos" en falso).
  { echo "+cpu" > /sys/fs/cgroup/cgroup.subtree_control; } 2>/dev/null || true
  if grep -qw cpu /sys/fs/cgroup/cgroup.subtree_control 2>/dev/null; then
    # Cgroups para los docentes y usuarios de nivel superior.
    for d in /home/*/; do
      [ -d "$d" ] || continue
      u=$(basename "$d")
      mkdir -p "/sys/fs/cgroup/linuxlab/$u" 2>/dev/null || true
      { echo "10000 100000" > "/sys/fs/cgroup/linuxlab/$u/cpu.max"; } 2>/dev/null || true
    done
    # Cgroups para los estudiantes que ya existen (los nuevos los crea
    # createStudent al aprovisionar).
    for d in /home/*/grupos/*/*/; do
      [ -d "$d" ] || continue
      u=$(basename "$d")
      mkdir -p "/sys/fs/cgroup/linuxlab/$u" 2>/dev/null || true
      { echo "10000 100000" > "/sys/fs/cgroup/linuxlab/$u/cpu.max"; } 2>/dev/null || true
    done
    echo "[entrypoint] cgroups v2 rw: limites de CPU por usuario activos"
  else
    echo "[entrypoint] cgroups v2 sin permisos: fallback a nice + ulimit"
  fi
else
  echo "[entrypoint] cgroups v2 sin permisos: fallback a nice + ulimit"
fi

echo "[entrypoint] Habilitando cuotas de disco por estudiante..."

# Cuota de 20 MB por estudiante (la aplica createStudent con setquota). Depende
# de que el filesystem del host soporte quotas; si no, se sigue sin limite.
if quotacheck -cum /home 2>/dev/null && quotaon /home 2>/dev/null; then
  echo "[entrypoint] cuotas de disco habilitadas en /home"
else
  echo "[entrypoint] cuotas de disco no disponibles (host sin soporte)"
fi

echo "[entrypoint] Iniciando SSH..."
mkdir -p /run/sshd
exec /usr/sbin/sshd -D
