import { redirect } from "next/navigation"
import { requireServerRole } from "@/lib/features/auth/session"

/** Contents now live on the student home; keep the old URL working. */
export default async function ContentsPage() {
  await requireServerRole(["student", "admin"])
  redirect("/inicio")
}
