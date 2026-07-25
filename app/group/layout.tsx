import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"

// ############################################################################
// ## PROHIBIDO CAMBIAR / NO MOVER A (protected).                            ##
// ##                                                                        ##
// ## La vista del curso trae su PROPIA barra lateral (la de contenidos del  ##
// ## curso). Si se mete bajo (protected), el layout de ese grupo pinta la   ##
// ## barra global ADEMAS de la del curso => doble barra lateral.            ##
// ##                                                                        ##
// ## Por eso el curso vive en app/course (fuera de (protected)). Este       ##
// ## layout solo hace el chequeo de auth, SIN barra. La URL sigue siendo    ##
// ## /course porque (protected) es un grupo sin segmento de ruta.           ##
// ############################################################################
export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect("/")

  return <>{children}</>
}
