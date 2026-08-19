import type { LucideIcon } from "lucide-react"

/**
 * Estado vacío estilo shadcn: ícono en caja de tono suave, título y
 * descripción opcional. Sin botones ni acciones: solo comunica que no hay
 * datos que mostrar.
 */
export function Empty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}