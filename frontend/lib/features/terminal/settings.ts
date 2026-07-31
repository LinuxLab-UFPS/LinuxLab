import { apiFetch } from "@/lib/api/client"

export async function resetTerminal(): Promise<void> {
  await apiFetch("/api/terminal/reset", { method: "POST" })
}
