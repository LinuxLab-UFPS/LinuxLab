import { MyGroupView } from "@/lib/features/student/components/my-group-view"
import { getMyGrades } from "@/lib/features/student/group-activities"
import { requireServerRole } from "@/lib/features/auth/session"
import { EMPTY_MY_GRADES } from "@/lib/models/groups"

export default async function MyGroupPage() {
  await requireServerRole(["student"])
  // El boletín trae también el grupo (nombre, descripción y docente): con una
  // sola llamada se arma el encabezado y el panel de calificaciones. Antes se
  // sumaba listMyGroupActivities solo por la tarjeta del grupo, que repetía
  // aquí lo que la vista de actividades ya muestra.
  const grades = await getMyGrades().catch(() => EMPTY_MY_GRADES)

  return <MyGroupView grades={grades} />
}
