import { listBankActivities } from "@/lib/features/teacher/data"
import { BankTable } from "@/components/teacher/bank-table"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function BankPage() {
  await requireServerRole(["teacher", "admin"])
  const activities = await listBankActivities()

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
            Banco de Actividades
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 to-sky-600" />
        <p className="mt-4 max-w-xl text-muted-foreground">
          Busca y filtra las actividades disponibles para tus cursos.
        </p>
      </div>

      <BankTable activities={activities} />
    </div>
  )
}
