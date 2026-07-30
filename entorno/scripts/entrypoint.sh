#!/bin/bash
set -e

echo "[entrypoint] Configurando clave SSH de labadmin..."

if [ -f /ssh/ssh_key.pub ]; then
  mkdir -p /home/labadmin/.ssh
  cp /ssh/ssh_key.pub /home/labadmin/.ssh/authorized_keys
  chown -R labadmin:labadmin /home/labadmin/.ssh 2>/dev/null || true
  chmod 600 /home/labadmin/.ssh/authorized_keys 2>/dev/null || true
fi

ssh-keygen -A >/dev/null 2>&1

# Re-aplicar sudoers
cat > /etc/sudoers.d/labadmin << 'EOF'
labadmin ALL=(root) NOPASSWD: /usr/sbin/useradd, /usr/sbin/userdel, /usr/sbin/usermod, /usr/sbin/groupadd, /usr/bin/passwd, /bin/mkdir, /bin/chown, /bin/chmod, /bin/rm, /usr/bin/su
EOF
chmod 440 /etc/sudoers.d/labadmin

echo "[entrypoint] Reprovisionando usuarios..."

# Recrear docentes y sus grupos
for teacher_dir in /home/*/; do
  teacher=$(basename "$teacher_dir")
  [ "$teacher" = "labadmin" ] && continue
  [ ! -d "$teacher_dir" ] && continue

  if ! id "$teacher" &>/dev/null; then
    echo "[entrypoint] Recreando docente: $teacher"
    useradd -M -d "$teacher_dir/home" -s /bin/bash "$teacher"
    mkdir -p "$teacher_dir/home" "$teacher_dir/grupos"
    chown "$teacher:$teacher" "$teacher_dir" "$teacher_dir/grupos" "$teacher_dir/home"
    chmod 751 "$teacher_dir" "$teacher_dir/grupos"
    chmod 755 "$teacher_dir/home"
  fi

  # Procesar grupos del docente
  for group_dir in "$teacher_dir/grupos/"*/; do
    [ -d "$group_dir" ] || continue

    group_id=$(basename "$group_dir")
    group_name="grp_${group_id: -8}"

    if ! getent group "$group_name" &>/dev/null; then
      echo "[entrypoint] Recreando grupo: $group_name"
      groupadd "$group_name"
    fi

    if ! id -nG "$teacher" | grep -qw "$group_name"; then
      usermod -aG "$group_name" "$teacher"
    fi

    chown "$teacher:$group_name" "$group_dir"
    chmod 2751 "$group_dir"

    # Recrear estudiantes
    for student_dir in "$group_dir"*/; do
      [ -d "$student_dir" ] || continue
      username=$(basename "$student_dir")

      if ! id "$username" &>/dev/null; then
        echo "[entrypoint] Recreando estudiante: $username"
        useradd -M -d "$student_dir" -s /bin/bash "$username"
      fi

      chown "$username:$group_name" "$student_dir"
      chmod 2750 "$student_dir"
    done
  done
done

echo "[entrypoint] Iniciando SSH..."
mkdir -p /run/sshd
exec /usr/sbin/sshd -D
