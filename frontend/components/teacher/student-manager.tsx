"use client"

import { useState } from "react"
import { Trash2, Upload, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { EnrollmentStudent } from "@/lib/features/auth/types"

interface StudentManagerProps {
  students: EnrollmentStudent[]
  onAddStudent: (student: Omit<EnrollmentStudent, "id">) => void
  onRemoveStudent: (id: string) => void
  onUploadCSV: (file: File) => void
}

export function StudentManager({
  students,
  onAddStudent,
  onRemoveStudent,
  onUploadCSV,
}: StudentManagerProps) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nombre && email && codigo) {
      onAddStudent({ name: nombre, email, code: codigo })
      setNombre("")
      setEmail("")
      setCodigo("")
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadCSV(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadCSV(e.target.files[0])
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="bg-secondary/50 border border-border p-1">
          <TabsTrigger
            value="individual"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar individual
          </TabsTrigger>
          <TabsTrigger
            value="csv"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Upload className="w-4 h-4 mr-2" />
            Cargar CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-muted-foreground">
                  Nombre completo
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre y apellidos"
                  className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Email institucional
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ufps.edu.co"
                  className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-muted-foreground">
                  Código estudiantil
                </Label>
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="1150000"
                  className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar estudiante
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="csv" className="mt-4">
          <div
            className={`border-2 border-dashed p-8 text-center transition-all duration-200 ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground mb-2">
              Arrastra un archivo CSV aquí o{" "}
              <label className="text-primary hover:underline cursor-pointer">
                selecciona un archivo
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-muted-foreground">
              Formato esperado: nombre,email,codigo
            </p>
            <div className="mt-4 p-3 bg-secondary/30 border border-border text-left font-mono text-xs text-muted-foreground">
              <p className="text-foreground mb-1"># Ejemplo de CSV:</p>
              <p>nombre,email,codigo</p>
              <p>Nombre Apellido,correo@ufps.edu.co,1150000</p>
              <p>Otro Estudiante,otro@ufps.edu.co,1150001</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Students Table */}
      {students.length > 0 && (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Código</TableHead>
                <TableHead className="text-muted-foreground w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  className="border-border hover:bg-secondary/30"
                >
                  <TableCell className="text-foreground">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {student.code}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveStudent(student.id)}
                      className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {students.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay estudiantes agregados aún</p>
        </div>
      )}
    </div>
  )
}
