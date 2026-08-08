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
labadmin ALL=(root) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /usr/sbin/groupadd, /usr/bin/passwd, /bin/mkdir, /bin/chown, /bin/chmod, /bin/cp, /bin/rm, /usr/bin/su
labadmin ALL=(ALL) NOPASSWD: /usr/local/lib/linuxlab/checker.py, /usr/local/lib/linuxlab/setup.py
EOF
chmod 440 /etc/sudoers.d/labadmin

echo "[entrypoint] Configurando aislamiento de procesos..."
mount -o remount,hidepid=2 /proc 2>/dev/null || true

echo "[entrypoint] Iniciando SSH..."
mkdir -p /run/sshd
exec /usr/sbin/sshd -D
