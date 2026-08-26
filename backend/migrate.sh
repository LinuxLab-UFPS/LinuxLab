#!/bin/sh
set -e

# Baseline de la migracion colapsada, SOLO si la base ya traia esquema.
#
# El colapso de migraciones dejo `20260824000000_init` recreando el modelo
# entero. Una base que venia del modelo viejo ya tiene esas tablas con otros
# nombres, y aplicarle el init de verdad reventaria; por eso se marca como
# aplicada sin ejecutarla.
#
# Pero eso SOLO vale si hay esquema. Antes esta linea corria siempre, y sobre
# una base vacia —un `docker compose up` limpio, o un despliegue nuevo— marcaba
# el init como aplicado sin crear una sola tabla: la siguiente migracion moria
# con «relation "GroupActivity" does not exist» y la base quedaba inservible.
#
# La condicion es «existe alguna tabla que no sea la de migraciones». Si la hay,
# la base viene de antes y se hace baseline. Si no, se deja que el init corra.
#
# Se pregunta con el cliente de Prisma y no con `psql`, que no esta instalado en
# la imagen del backend.
YA_HAY_ESQUEMA=$(node -e '
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
prisma.$queryRawUnsafe(
  "SELECT COUNT(*)::int AS n FROM pg_tables WHERE schemaname = $$public$$ AND tablename <> $$_prisma_migrations$$",
)
  .then((r) => { console.log(r[0].n) })
  .catch(() => { console.log(0) })
  .finally(() => prisma.$disconnect())
' 2>/dev/null || echo 0)

if [ "${YA_HAY_ESQUEMA:-0}" -gt 0 ]; then
  echo "La base ya tiene esquema: se marca el init como aplicado sin ejecutarlo."
  npx prisma migrate resolve --applied 20260824000000_init 2>/dev/null || true
else
  echo "Base vacia: el init se aplica como una migracion normal."
fi

# Migraciones pendientes sobre la base de la app.
npx prisma migrate deploy

# La base local de docker (postgres) es el destino del seed: necesita el
# esquema antes de poder sembrar. Si no hay SEED_DATABASE_URL se omite.
if [ -n "$SEED_DATABASE_URL" ]; then
  DATABASE_URL="$SEED_DATABASE_URL" npx prisma migrate deploy
fi
