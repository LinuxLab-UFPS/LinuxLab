"use client"

import { useRef, useState } from "react"
import { Trash2, Upload, UserPlus, FileSpreadsheet } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel, TableEmptyState } from "@shared/components/data-table"
import { ActionButton } from "@shared/components/action-button"
import { IconAction } from "@shared/components/icon-action"
import { StatTabs } from "@shared/components/stat-tabs"
import { parseStudentCsv } from "@shared/lib/csv"
import { notify } from "@shared/lib/toast"

export type StudentSource = "manual" | "csv"

export interface DraftStudent {
  id: string
  name: string
  email: string
  code: string
  source: StudentSource
}

/** Fila que no entro, con el motivo, para que el docente la pueda corregir. */
interface Rejected {
  line: number
  email: string
  reason: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailKey = (email: string) => email.trim().toLowerCase()
const codeKey = (code: string) => code.trim().toLowerCase()

/**
 * Arma la lista de estudiantes del curso, a mano o pegando un CSV.
 *
 * Los duplicados se atajan aqui y no en el servidor: al crear el curso la lista
 * es lo unico que existe, asi que basta con cruzarla contra si misma por correo
 * y por codigo. Nada se descarta en silencio: lo rechazado se muestra con su
 * motivo.
 */
export function StudentManager({
  students,
  onAdd,
  onAddMany,
  onRemove,
}: {
  students: DraftStudent[]
  onAdd: (student: Omit<DraftStudent, "id">) => void
  onAddMany: (students: Omit<DraftStudent, "id">[]) => void
  onRemove: (id: string) => void
}) {
  const [mode, setMode] = useState<StudentSource>("manual")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const emails = new Set(students.map((s) => emailKey(s.email)))
  const codes = new Set(students.map((s) => codeKey(s.code)))
  const counts = {
    manual: students.filter((s) => s.source === "manual").length,
    csv: students.filter((s) => s.source === "csv").length,
  }

  const addManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !code.trim()) {
      notify.error(null, "Nombre, correo y código son obligatorios.")
      return
    }
    if (!EMAIL.test(email.trim())) {
      notify.error(null, "El correo no tiene un formato válido.")
      return
    }
    if (emails.has(emailKey(email))) {
      notify.error(null, `Ya agregaste el correo ${email.trim()}.`)
      return
    }
    if (codes.has(codeKey(code))) {
      notify.error(null, `Ya agregaste el código ${code.trim()}.`)
      return
    }
    onAdd({ name: name.trim(), email: email.trim(), code: code.trim(), source: "manual" })
    setName("")
    setEmail("")
    setCode("")
  }

  const importCsv = async (file: File) => {
    try {
      const rows = parseStudentCsv(await file.text())
      if (rows.length === 0) {
        notify.error(null, "El archivo está vacío o le falta el encabezado nombre,email,codigo")
        return
      }

      // Las claves arrancan con lo que ya hay en la lista y crecen con el propio
      // archivo, asi se atajan tambien los repetidos dentro del CSV.
      const seenEmails = new Set(emails)
      const seenCodes = new Set(codes)
      const accepted: Omit<DraftStudent, "id">[] = []
      const bad: Rejected[] = []

      rows.forEach((row, i) => {
        const line = i + 2
        if (!EMAIL.test(row.email.trim())) {
          bad.push({ line, email: row.email, reason: "Correo inválido" })
          return
        }
        if (!row.code.trim()) {
          bad.push({ line, email: row.email, reason: "Sin código" })
          return
        }
        if (seenEmails.has(emailKey(row.email))) {
          bad.push({ line, email: row.email, reason: "Correo repetido" })
          return
        }
        if (seenCodes.has(codeKey(row.code))) {
          bad.push({ line, email: row.email, reason: `Código ${row.code.trim()} repetido` })
          return
        }
        seenEmails.add(emailKey(row.email))
        seenCodes.add(codeKey(row.code))
        accepted.push({
          name: row.name.trim() || row.email.trim(),
          email: row.email.trim(),
          code: row.code.trim(),
          source: "csv",
        })
      })

      if (accepted.length) onAddMany(accepted)
      const dupes = bad.filter((b) => b.reason.includes("repetido")).length
      const invalid = bad.length - dupes
      const parts = [`${accepted.length} agregado(s)`]
      if (dupes) parts.push(`${dupes} duplicado(s)`)
      if (invalid) parts.push(`${invalid} inválido(s)`)
      notify.success(parts.join(", "), {
        description:
          bad.length > 0
            ? bad.map((b) => `línea ${b.line}: ${b.email} — ${b.reason}`).join(" · ")
            : undefined,
      })
    } catch {
      notify.error(null, "No se pudo leer el archivo")
    }
  }

  return (
    <div className="space-y-5">
      <StatTabs
        value={mode}
        onChange={(v) => setMode(v as StudentSource)}
        tabs={[
          {
            value: "manual",
            label: "Manual",
            statLabel: "Agregados a mano",
            count: counts.manual,
            icon: UserPlus,
            tone: "primary",
          },
          {
            value: "csv",
            label: "CSV",
            statLabel: "Agregados por CSV",
            count: counts.csv,
            icon: FileSpreadsheet,
            tone: "primary",
          },
        ]}
      />

      {mode === "manual" ? (
        <form onSubmit={addManual} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="student-name" className="text-muted-foreground">
                Nombre completo
              </Label>
              <Input
                id="student-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellidos"
                className="border-table-line"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email" className="text-muted-foreground">
                Correo institucional
              </Label>
              <Input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ufps.edu.co"
                className="border-table-line"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-code" className="text-muted-foreground">
                Código estudiantil
              </Label>
              <Input
                id="student-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="1150000"
                className="border-table-line"
              />
            </div>
          </div>

          <ActionButton tone="primary" type="submit">
            <UserPlus className="h-4 w-4" />
            Agregar estudiante
          </ActionButton>
        </form>
      ) : (
        <div className="space-y-4">
          <div
            onDragEnter={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file) importCsv(file)
            }}
            className={cn(
              "rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-table-line",
            )}
          >
            <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-foreground">Arrastra el archivo aquí</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Debe tener las columnas <span className="font-mono">nombre,email,codigo</span>
            </p>
            <input
              ref={fileInput}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importCsv(file)
                e.target.value = ""
              }}
            />
            <ActionButton
              tone="neutral"
              className="mt-4"
              onClick={() => fileInput.current?.click()}
            >
              Seleccionar archivo
            </ActionButton>
          </div>
        </div>
      )}

      <TablePanel>
        <div className="max-h-80 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead>Estudiante</TableHead>
                <TableHead className="w-40">Código</TableHead>
                <TableHead className="w-32">Origen</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <span className="block text-sm font-medium text-foreground">
                      {student.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">{student.email}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {student.code}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.source === "csv" ? "CSV" : "Manual"}
                  </TableCell>
                  <TableCell>
                    <IconAction
                      label={`Quitar a ${student.name}`}
                      icon={Trash2}
                      onClick={() => onRemove(student.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {students.length === 0 && (
            <TableEmptyState>Todavía no has agregado estudiantes.</TableEmptyState>
          )}
        </div>
      </TablePanel>
    </div>
  )
}
