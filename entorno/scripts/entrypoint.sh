#!/bin/bash
set -e
mkdir -p /run/sshd
ssh-keygen -A >/dev/null 2>&1

# Asegurar labadmin
if ! grep -q labadmin /etc/passwd 2>/dev/null; then
  echo 'labadmin:x:1000:1000:Lab Admin:/home/labadmin:/bin/bash' >> /etc/passwd
  echo 'labadmin:!:19820:0:99999:7:::' >> /etc/shadow
  echo 'labadmin:x:1000:' >> /etc/group
  echo 'labadmin:!::' >> /etc/gshadow
fi
if [ ! -d /home/labadmin ]; then
  mkdir -p /home/labadmin
  chown 1000:1000 /home/labadmin
fi

# Re-aplicar sudoers
echo 'labadmin ALL=(root) NOPASSWD: /usr/sbin/useradd *, /usr/sbin/userdel *, /usr/sbin/usermod *, /usr/sbin/groupadd *, /usr/bin/passwd *, /bin/mkdir /home/*, /bin/chown * /home/*, /bin/chmod * /home/*, /bin/chgrp * /home/*, /usr/bin/su *' \
  > /etc/sudoers.d/labadmin
chmod 440 /etc/sudoers.d/labadmin

# Copiar llave SSH
if [ -f /ssh/ssh_key.pub ]; then
  mkdir -p /home/labadmin/.ssh /root/.ssh
  if [ ! -f /home/labadmin/.ssh/authorized_keys ]; then
    cp /ssh/ssh_key.pub /home/labadmin/.ssh/authorized_keys
  fi
  cp /ssh/ssh_key.pub /root/.ssh/authorized_keys
  chmod 600 /home/labadmin/.ssh/authorized_keys /root/.ssh/authorized_keys
  chown -R labadmin:labadmin /home/labadmin/.ssh
fi

exec /usr/sbin/sshd -D
