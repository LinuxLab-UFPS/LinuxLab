import type { RouteRule } from "@/lib/features/shared/types"

export const studentRules: RouteRule[] = [
  { path: "/terminal", roles: ["student", "admin"], exact: true },
  { path: "/contents", roles: ["student", "admin"], exact: true },
  { path: "/group", roles: ["student", "teacher", "admin"], exact: true },
  { path: "/activity", roles: ["student", "admin"], exact: true },
]
