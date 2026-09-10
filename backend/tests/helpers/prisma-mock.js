/**
 * Mock automatico del cliente Prisma para pruebas unitarias de rutas.
 * Cada modelo responde por defecto de forma inofensiva:
 *   findUnique/findFirst -> null, findMany -> [], count -> 0, etc.
 * Cada metodo es un jest.fn(), y cada suite sobreescribe lo que
 * el caso de uso necesita con mockResolvedValueOnce(...).
 */
function createPrismaMock() {
  const store = new Map()

  function getImplementations(modelName) {
    if (!store.has(modelName)) {
      store.set(modelName, {
        findUnique: jest.fn(async () => null),
        findUniqueOrThrow: jest.fn(async () => ({})),
        findFirst: jest.fn(async () => null),
        findFirstOrThrow: jest.fn(async () => ({})),
        findMany: jest.fn(async () => []),
        create: jest.fn(async ({ data }) => data),
        createMany: jest.fn(async ({ data }) => ({ count: data.length })),
        update: jest.fn(async () => ({})),
        updateMany: jest.fn(async () => ({ count: 0 })),
        upsert: jest.fn(async () => ({})),
        delete: jest.fn(async () => ({})),
        deleteMany: jest.fn(async () => ({ count: 0 })),
        count: jest.fn(async () => 0),
        aggregate: jest.fn(async () => ({})),
        groupBy: jest.fn(async () => []),
      })
    }
    return store.get(modelName)
  }

  const prisma = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "$transaction") {
          return jest.fn(async (arg) => (typeof arg === "function" ? arg(prisma) : []))
        }
        if (prop === "$extends") return jest.fn(() => prisma)
        if (prop === "$queryRaw" || prop === "$queryRawUnsafe") return jest.fn(async () => [])
        if (prop === "$executeRaw" || prop === "$executeRawUnsafe") return jest.fn(async () => 0)
        if (prop === "$disconnect" || prop === "$connect") return jest.fn(async () => undefined)
        if (typeof prop !== "string" || prop.startsWith("$")) return undefined
        return getImplementations(prop)
      },
    },
  )

  return prisma
}

module.exports = { createPrismaMock }
