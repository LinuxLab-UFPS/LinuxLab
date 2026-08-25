"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/features/auth/context"
import type { Role } from "@/lib/features/auth/types"
import { SkeletonScreen } from "@shared/components/skeleton"

export function RoleGuard({
  roles,
  children,
  requireEnrollment = false,
}: {
  roles: Role[]
  children: React.ReactNode
  requireEnrollment?: boolean
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!roles.includes(user.role)) {
      router.replace("/unauthorized")
      return
    }
    if (requireEnrollment && user.role === "student" && user.hasEnrollment === false) {
      router.replace("/inscripcion/pendiente")
    }
  }, [user, loading, roles, requireEnrollment, router])

  if (loading) return <SkeletonScreen className="p-10"><div className="h-32" /></SkeletonScreen>
  if (!user) return null
  if (!roles.includes(user.role)) return null
  if (requireEnrollment && user.role === "student" && user.hasEnrollment === false) return null

  return <>{children}</>
}
