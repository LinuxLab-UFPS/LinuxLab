import { env } from "@/lib/config/env"

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function baseUrl(): string {
  if (typeof window !== "undefined") {
    return "http://localhost:3000"
  }
  return env.backendUrl
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.error || `HTTP ${res.status}`, res.status)
  }

  return res.json()
}
