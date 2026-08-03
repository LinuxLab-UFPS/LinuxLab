import type { RouteRule } from "@/lib/features/shared/types"

export const adminRules: RouteRule[] = [
  { path: "/admin", roles: ["admin"] },
  { path: "/audit-log", roles: ["admin"], exact: true },
]
