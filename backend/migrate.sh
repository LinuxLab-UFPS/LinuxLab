#!/bin/sh
set -e

# Baseline de la migracion colapsada sobre la base de la app (Neon local).
# Si la base ya tiene esquema pero esta migracion no esta registrada, Prisma
# la marcaria como aplicada (P3005 -> resolucion sin tocar datos). Es
# idempotente: si ya esta registrada, el error se ignora y se sigue.
npx prisma migrate resolve --applied 20260824000000_init 2>/dev/null || true

# Migraciones pendientes sobre la base de la app (no-op una vez baselined).
npx prisma migrate deploy

# La base local de docker (postgres) es el destino del seed: necesita el
# esquema antes de poder sembrar. Si no hay SEED_DATABASE_URL se omite.
if [ -n "$SEED_DATABASE_URL" ]; then
  DATABASE_URL="$SEED_DATABASE_URL" npx prisma migrate deploy
fi