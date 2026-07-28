import type { RouteRule } from "./types"

export const sharedRules: RouteRule[] = [
  { path: "/home", roles: ["student", "teacher", "admin"], exact: true },
]
