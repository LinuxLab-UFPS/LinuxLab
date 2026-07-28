import { redirect } from "next/navigation"

/** Contents now live on the student home; keep the old URL working. */
export default function ContentsPage() {
  redirect("/home")
}
