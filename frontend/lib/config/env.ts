/**
 * Acceso tipado y central a las variables de entorno.
 *
 * `NEXT_PUBLIC_*` queda incrustado al compilar; el resto se lee en el arranque.
 * Esta es la unica fuente de configuracion del frontend: nadie mas debe leer
 * `process.env` directamente.
 */
export const env = {
  /** Backend API URL as the browser sees it. */
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000",
  /**
   * Backend API URL as the server sees it, leido en el arranque. En Docker el
   * backend no es "localhost" sino el nombre del servicio, y el servidor de
   * Next escucha en ese mismo puerto: sin esto, una peticion del servidor se la
   * hace a si mismo y responde 404.
   */
  serverBackendUrl:
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3000",
  /**
   * Public base URL of the video CDN (Cloudflare R2). Videos are too heavy for
   * the repo, so they are not committed (see .gitignore); unset in local dev,
   * lesson videos fall back to the local public/temario files if present.
   */
  videoBaseUrl: (process.env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "").replace(/\/$/, ""),
  frontendUrl: (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
  jwtSecret: process.env.JWT_SECRET ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const

/** Use once a value becomes mandatory; throws if unset. */
export function requireEnv(key: keyof typeof env): string {
  const value = env[key]
  if (!value) {
    throw new Error(`Missing required environment variable for "${key}". See .env.example.`)
  }
  return value
}
