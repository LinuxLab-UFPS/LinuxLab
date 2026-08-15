"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/features/auth/context"
import type { Role } from "@/lib/features/auth/types"

export function RoleGuard({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/")
      return
    }
    if (!roles.includes(user.role)) {
      router.push("/unauthorized")
    }
  }, [user, loading, roles, router])

  if (loading || !user || !roles.includes(user.role)) return null

  return <>{children}</>
}
