"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StudentManager } from "@/components/teacher/student-manager"
import { createGroup } from "@/lib/features/teacher/data"
import { parseStudentCsv } from "@/lib/features/shared/parse-csv"
import type { EnrollmentStudent } from "@/lib/features/auth/types"
import { RoleGuard } from "@/components/shared/role-guard"

function CreateGroupContent() {
  const PANEL = "rounded-xl border border-black/15 bg-card p-6 shadow-md dark:border-border dark:shadow-none"
  const router = useRouter()
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [students, setStudents] = useState<EnrollmentStudent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const handleAddStudent = (student: Omit<EnrollmentStudent, "id">) => {
    setStudents((prev) => [...prev, { ...student, id: crypto.randomUUID() }])
  }

  const handleRemoveStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  const handleUploadCSV = async (file: File) => {
    setError(null)
    try {
      const text = await file.text()
      const rows = parseStudentCsv(text)
      if (rows.length === 0) {
        setError("El archivo CSV está vacío o no tiene el formato esperado (nombre,email,codigo).")
        return
      }
      setStudents((prev) => [
        ...prev,
        ...rows.map((r) => ({ ...r, id: crypto.randomUUID() })),
      ])
      setInfo(`${rows.length} estudiante(s) agregado(s) desde CSV.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo CSV.")
    }
  }

  const handlePublish = async () => {
    setError(null)
    setInfo(null)
    if (!groupName.trim()) {
      setError("El nombre del curso es requerido.")
      return
    }
    setPublishing(true)
    try {
      const response = await createGroup({
        name: groupName,
        description,
        students: students.map((s) => ({ name: s.name, email: s.email, code: s.code })),
      })
      const e = response.enrollment
      const parts: string[] = []
      if (e.registered) parts.push(`${e.registered} inscrito(s)`)
      if (e.skipped) parts.push(`${e.skipped} ya inscrito(s)`)
      if (e.errors.length) parts.push(`${e.errors.length} con error`)
      const summary = parts.length ? parts.join(", ") : "sin estudiantes"
      router.push(`/groups/${response.group.id}?created=1&summary=${encodeURIComponent(summary)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar el curso.")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <Link
        href="/home"
        className="neon-glow inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      {info && !error && (
        <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {info}
        </div>
      )}

      <section className={PANEL}>
        <h2 className="mb-6 text-lg font-medium text-foreground">Información del curso</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-muted-foreground">
              Nombre del curso
            </Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Sistemas Operativos - 2026-I"
              className="border-border bg-secondary/30 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Breve descripción del curso…"
              className="resize-none border-border bg-secondary/30 focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      <section className={PANEL}>
        <h2 className="mb-6 flex items-center text-lg font-medium text-foreground">
          Estudiantes
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {students.length} estudiantes agregados
          </span>
        </h2>

        <StudentManager
          students={students}
          onAddStudent={handleAddStudent}
          onRemoveStudent={handleRemoveStudent}
          onUploadCSV={handleUploadCSV}
        />
      </section>

      <div className="flex justify-end">
        <Button
          onClick={handlePublish}
          disabled={publishing}
          className="neon-glow bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="mr-2 h-4 w-4" />
          {publishing ? "Publicando…" : "Publicar curso"}
        </Button>
      </div>
    </div>
  )
}

export default function CreateGroupPage() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <CreateGroupContent />
    </RoleGuard>
  )
}
