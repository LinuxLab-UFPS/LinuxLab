import type { RouteRule } from "@/lib/features/shared/types"

export const studentRules: RouteRule[] = [
  { path: "/terminal", roles: ["student", "teacher", "admin"], exact: true },
  { path: "/contents", roles: ["student", "admin"] },
  { path: "/group", roles: ["student", "teacher", "admin"], exact: true },
  { path: "/activity", roles: ["student", "admin"], exact: true },
  { path: "/simulators", roles: ["student", "admin"] },
  { path: "/activities", roles: ["student", "admin"] },
]
