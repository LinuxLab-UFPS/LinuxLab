import { env } from "@/lib/config/env"

export const DEFAULT_FETCH_TIMEOUT_MS = 30000

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export type ApiFetchOptions = RequestInit & {
  /** Tiempo máximo en ms; al pasarlo la solicitud se aborta. */
  timeoutMs?: number
}

function baseUrl(): string {
  return typeof window === "undefined" ? env.serverBackendUrl : env.backendUrl
}

/**
 * El navegador manda la cookie de sesion solo; el servidor no. Cuando una
 * pantalla se pinta en el servidor hay que reenviarla a mano o el backend
 * responde 401 y la pagina se cae.
 */
async function sessionHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {}
  const { cookies } = await import("next/headers")
  const jar = (await cookies()).toString()
  return jar ? { cookie: jar } : {}
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal: externalSignal, ...rest } = options
  // Red de seguridad: si el backend se cuelga, la solicitud se aborta en vez
  // de dejar al usuario esperando (y la promesa lanza un error claro).
  const controller = new AbortController()
  const ownsAbort = !externalSignal
  const timer = ownsAbort ? setTimeout(() => controller.abort(), timeoutMs) : undefined

  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(await sessionHeader()),
        ...rest.headers,
      },
      signal: externalSignal ?? controller.signal,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(body.error || `HTTP ${res.status}`, res.status)
    }

    // Un 204, o cualquier respuesta sin cuerpo, no trae JSON que parsear. Se lee
    // como texto primero porque res.json() sobre un cuerpo vacío lanza
    // "unexpected end of data" y convierte una operación exitosa en un error.
    if (res.status === 204) {
      return undefined as T
    }
    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  } catch (e) {
    if (ownsAbort && controller.signal.aborted) {
      throw new ApiError(
        `La solicitud tardó más de ${Math.round(timeoutMs / 1000)}s y fue cancelada`,
        408,
      )
    }
    throw e
  } finally {
    if (timer) clearTimeout(timer)
  }
}
