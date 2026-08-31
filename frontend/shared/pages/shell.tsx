import type { ReactNode } from "react"
import type { Role } from "@/lib/models/auth"
import { LessonProgressProvider } from "@/lib/features/student/progress"
import { SiteHeader } from "@/lib/features/student/components/site-header"
import { TeacherHeader } from "@/lib/features/teacher/components/teacher-header"
import { AdminHeader } from "@/lib/features/admin/components/admin-header"
import { ProvisioningIndicator } from "@shared/components/provisioning-indicator"
import { getSearchIndex } from "@shared/lib/content/lessons"
import { getSimulators } from "@shared/lib/content/simulators"

/**
 * Shell unico para las rutas protegidas: barra superior segun el rol y el
 * contenido scrollable debajo. El progreso de lectura solo aplica al
 * estudiante (es por navegador, en localStorage): para los otros roles no se
 * monta para no contaminar esa clave.
 *
 * Los indices de busqueda del estudiante son contenido de servidor (leen el
 * temario del disco), por eso se resuelven aqui y no dentro del header.
 */
export function Shell({ role, children }: { role: Role; children: ReactNode }) {
  const body = (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {role === "student" ? (
        <SiteHeader simulators={getSimulators()} searchItems={getSearchIndex()} />
      ) : role === "teacher" ? (
        <TeacherHeader />
      ) : (
        <AdminHeader />
      )}
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ProvisioningIndicator />
    </div>
  )
  if (role === "student") {
    return <LessonProgressProvider>{body}</LessonProgressProvider>
  }
  return body
}
