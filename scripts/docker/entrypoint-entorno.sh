#!/bin/bash
set -e
ssh-keygen -A >/dev/null 2>&1
if [ -f /ssh/ssh_key.pub ]; then
  mkdir -p /home/labadmin/.ssh /root/.ssh
  cp /ssh/ssh_key.pub /home/labadmin/.ssh/authorized_keys
  cp /ssh/ssh_key.pub /root/.ssh/authorized_keys
  chmod 600 /home/labadmin/.ssh/authorized_keys /root/.ssh/authorized_keys
  chown -R labadmin:labadmin /home/labadmin/.ssh
fi
exec /usr/sbin/sshd -D
