import type { RouteRule } from "@/lib/features/shared/types"

export const adminRules: RouteRule[] = [
  { path: "/admin", roles: ["admin"] },
]
