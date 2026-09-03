"use client"

import { Archive, BookOpen, GraduationCap } from "lucide-react"
import { cn } from "@shared/lib/utils"
import type { LucideIcon } from "lucide-react"

export type GroupStatus = "active" | "finished" | "archived"

const GROUP_STATUS_CONFIG: Record<
  GroupStatus,
  { label: string; icon: LucideIcon; style: string }
> = {
  active: {
    label: "Activo",
    icon: BookOpen,
    style: "text-green-600 bg-green-500/10 border-green-500/20",
  },
  finished: {
    label: "Finalizado",
    icon: GraduationCap,
    style: "text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-500",
  },
  archived: {
    label: "Archivado",
    icon: Archive,
    style: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  },
}

/** Pill de estado de un grupo: Activo (verde), Finalizado (rojo), Archivado (ámbar). */
export function GroupStatusBadge({
  status,
  className,
}: {
  status: GroupStatus
  className?: string
}) {
  const cfg = GROUP_STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.style,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}
