import { CheckCircle2, Clock, AlertCircle, CircleDashed } from "lucide-react"
import { cn } from "@shared/lib/utils"
import type { ProvisioningStatus } from "@/lib/features/teacher/types"

const STATUS_CONFIG: Record<ProvisioningStatus, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  completed: { label: "Listo", icon: CheckCircle2, style: "text-green-600 bg-green-500/10 border-green-500/20" },
  processing: { label: "Creando...", icon: Clock, style: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  pending: { label: "En cola", icon: CircleDashed, style: "text-muted-foreground bg-secondary border-border" },
  failed: { label: "Error", icon: AlertCircle, style: "text-red-600 bg-red-500/10 border-red-500/20" },
}

export function StatusBadge({ status }: { status: ProvisioningStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border", cfg.style)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}
