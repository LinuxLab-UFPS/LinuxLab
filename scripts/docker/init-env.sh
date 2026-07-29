#!/bin/sh
set -e

# SSH keys
if [ ! -f /ssh/ssh_key ]; then
  apk add --no-cache openssh-keygen >/dev/null 2>&1
  ssh-keygen -t rsa -b 4096 -f /ssh/ssh_key -N '' -q
  echo "SSH keys generated"
else
  echo "SSH keys already exist"
fi

# Auth files for bind mount persistence
if [ ! -f /auth/passwd ]; then
  cp /etc/passwd /auth/passwd
  cp /etc/shadow /auth/shadow
  cp /etc/group /auth/group
  cp /etc/gshadow /auth/gshadow
  echo "Auth files initialized"
else
  echo "Auth files already exist"
fi
