import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"

// ############################################################################
// ## PROHIBIDO CAMBIAR / NO MOVER A (protected).                            ##
// ##                                                                        ##
// ## La vista del grupo trae su PROPIA barra lateral (la de contenidos del  ##
// ## grupo). Si se mete bajo (protected), el layout de ese grupo pinta la   ##
// ## barra global ADEMAS de la del grupo => doble barra lateral.            ##
// ##                                                                        ##
// ## Por eso el grupo vive en app/group (fuera de (protected)). Este        ##
// ## layout solo hace el chequeo de auth, SIN barra. La URL sigue siendo    ##
// ## /group porque (protected) es un grupo sin segmento de ruta.            ##
// ############################################################################
export default async function GroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  return <>{children}</>
}
