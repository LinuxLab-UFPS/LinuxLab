"use client"

import { createContext, useContext } from "react"
import { useQuery } from "@tanstack/react-query"
import { listMyGroupActivities } from "@/lib/features/student/group-activities"
import { useAuth } from "@/lib/features/auth/context"

interface EnrollmentValue {
  hasEnrollment: boolean
  loading: boolean
  group: { id: string; name: string } | null
}

const Ctx = createContext<EnrollmentValue>({ hasEnrollment: true, loading: false, group: null })

export function EnrollmentProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const enabled = !authLoading && user?.role === "student"
  const q = useQuery({
    queryKey: ["enrollment", user?.id],
    queryFn: listMyGroupActivities,
    enabled,
    staleTime: 30_000,
  })
  const value: EnrollmentValue = {
    hasEnrollment: q.data ? Boolean(q.data.group) : (user?.hasEnrollment ?? true),
    loading: enabled ? q.isLoading : false,
    group: q.data?.group ?? null,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useEnrollment(): EnrollmentValue {
  return useContext(Ctx)
}
