/**
 * Typed, lazy access to environment variables.
 *
 * Nothing here is wired yet: the runtime (database, terminal gateway, auth) is
 * deferred. These are placeholders so the rest of the code can reference config
 * without scattering `process.env` lookups. They do NOT throw on missing values;
 * when the backend is implemented, switch the relevant ones to `requireEnv`.
 *
 * See `.env.example` for the full list.
 */

export const env = {
  /** PostgreSQL connection string (future). */
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** WebSocket URL of the terminal gateway to the shared Linux server (future). */
  terminalGatewayUrl: process.env.TERMINAL_GATEWAY_URL ?? "",
  /** Secret used to sign session tokens (future). */
  authSecret: process.env.AUTH_SECRET ?? "",
  /** Backend API URL */
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000",
  /**
   * Public base URL of the video CDN (Cloudflare R2). Videos are too heavy for
   * the repo, so they are not committed (see .gitignore); unset in local dev,
   * lesson videos fall back to the local public/temario files if present.
   */
  videoBaseUrl: (process.env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "").replace(/\/$/, ""),
  /** JWT secret for token verification (middleware). */
  jwtSecret: process.env.JWT_SECRET ?? "linuxlab-jwt-secret-2026",
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
