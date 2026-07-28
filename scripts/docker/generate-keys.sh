#!/bin/sh
set -e
if [ ! -f /ssh/ssh_key ]; then
  apk add --no-cache openssh-keygen >/dev/null 2>&1
  ssh-keygen -t rsa -b 4096 -f /ssh/ssh_key -N '' -q
  echo "SSH keys generated"
else
  echo "SSH keys already exist"
fi
