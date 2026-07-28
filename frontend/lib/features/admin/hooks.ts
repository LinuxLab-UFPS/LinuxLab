"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import type { TeacherListItem } from "./types"
import type { TeacherFilters } from "./api"
import * as adminData from "./data"

export function useTeachers(filters?: TeacherFilters) {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminData.listTeachers(filters)
      setTeachers(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al cargar docentes"
      toast.error(message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.search, filters?.status])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const register = useCallback(async (name: string, email: string) => {
    setSubmitting(true)
    try {
      const newTeacher = await adminData.registerTeacher({ name, email })
      setTeachers((prev) => [...prev, newTeacher])
      toast.success("Docente registrado exitosamente")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al registrar docente"
      toast.error(message)
      throw e
    } finally {
      setSubmitting(false)
    }
  }, [])

  const toggleStatus = useCallback(async (id: string) => {
    try {
      const updated = await adminData.toggleTeacherStatus(id)
      setTeachers((prev) => prev.map((t) => (t.id === id ? updated : t)))
      toast.success(updated.active ? "Docente reactivado" : "Docente dado de baja")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al cambiar estado"
      toast.error(message)
    }
  }, [])

  return { teachers, loading, submitting, register, toggleStatus }
}
