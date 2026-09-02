"use client"

import { GraduationCap, Users } from "lucide-react"
import { MyGradesPanel } from "@/lib/features/student/components/my-grades-panel"
import type { MyGrades } from "@/lib/models/groups"

/**
 * Vista "Mi Grupo": el encabezado es el grupo del estudiante y debajo su
 * boletín, sin pestañas. Las actividades del curso no se listan aquí — tienen
 * su propia vista en "Actividades" — así que esta pantalla es solo grupo y
 * calificaciones.
 */
export function MyGroupView({ grades }: { grades: MyGrades }) {
  const group = grades.group

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {!group ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="text-base font-medium text-foreground">Sin grupo de laboratorio</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            No estás inscrito en ningún grupo activo. Cuando un docente te matricule,
            aquí verás tu grupo.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
                {group.name}
              </span>
            </h1>
            <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
            <p className="mt-4 flex items-center gap-1.5 text-lg text-muted-foreground">
              <GraduationCap className="h-5 w-5 shrink-0" />
              Dirigido por <span className="font-medium text-foreground">{group.teacherName}</span>
            </p>
            {group.description && (
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground">
                {group.description}
              </p>
            )}
          </div>

          <MyGradesPanel grades={grades} />
        </>
      )}
    </div>
  )
}
