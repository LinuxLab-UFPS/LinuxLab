"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Send, ArrowLeft } from "lucide-react"
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
      setError("El nombre del grupo es requerido.")
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
      setError(e instanceof Error ? e.message : "No se pudo publicar el grupo.")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/home"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Crear Grupo</h1>
              <p className="text-sm text-muted-foreground">
                Configura un nuevo grupo para tus estudiantes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground"
              disabled
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar borrador
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
            >
              <Send className="w-4 h-4 mr-2" />
              {publishing ? "Publicando…" : "Publicar grupo"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
            {info}
          </div>
        )}

        {/* Section 1: Group Info */}
        <section className="bg-card border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/20 text-primary text-sm flex items-center justify-center">
              1
            </span>
            Información del grupo
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-muted-foreground">
                Nombre del grupo
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ej: Sistemas Operativos - 2026-I"
                className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
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
                placeholder="Breve descripción del grupo…"
                className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Students */}
        <section className="bg-card border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/20 text-primary text-sm flex items-center justify-center">
              2
            </span>
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
