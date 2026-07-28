export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(
      `"${operation}" is not implemented yet. Wire it to the backend in lib/data/. ` +
        `See ARCHITECTURE.md.`,
    )
    this.name = "NotImplementedError"
  }
}

export function notImplemented(operation: string): never {
  throw new NotImplementedError(operation)
}
