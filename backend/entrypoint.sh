#!/bin/sh
set -e

if [ "${SEED_ON_BOOT:-}" = "1" ]; then
  # El seed apunta a la base local de docker (postgres:5432), nunca a Neon.
  if [ -n "$SEED_DATABASE_URL" ]; then
    DATABASE_URL="$SEED_DATABASE_URL" npx prisma db seed || true
  else
    npx prisma db seed || true
  fi
fi

exec node src/index.js