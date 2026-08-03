"use client"

import { cn } from "@/lib/utils"

export type StatTabTone = "primary" | "amber" | "violet" | "sky" | "neutral"

export interface StatTabItem {
  value: string
  /** Etiqueta corta cuando la pestaña está en reposo. */
  label: string
  /** Etiqueta larga que acompaña al número cuando está seleccionada. */
  statLabel: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  tone?: StatTabTone
}

const TONE: Record<StatTabTone, { card: string; box: string; value: string }> = {
  primary: {
    card: "border-primary/60 bg-primary/10 neon-glow",
    box: "bg-primary/20 text-primary",
    value: "text-primary",
  },
  amber: {
    card: "border-amber-500/60 bg-amber-500/10",
    box: "bg-amber-500/20 text-amber-500",
    value: "text-amber-500",
  },
  violet: {
    card: "border-violet-500/60 bg-violet-500/10",
    box: "bg-violet-500/20 text-violet-400",
    value: "text-violet-400",
  },
  sky: {
    card: "border-sky-500/60 bg-sky-500/10",
    box: "bg-sky-500/20 text-sky-500",
    value: "text-sky-500",
  },
  neutral: {
    card: "border-table-line bg-card",
    box: "bg-foreground/10 text-foreground",
    value: "text-foreground",
  },
}

/**
 * Pestañas que además son la estadística de lo que muestran: la seleccionada se
 * abre en tarjeta con su ícono y su número, y las demás se recogen a una ficha
 * con el nombre y la cuenta.
 *
 * Con una sola pestaña se queda siempre abierta, que es el caso de una vista sin
 * alternativas (gestión de docentes).
 */
export function StatTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: StatTabItem[]
  value: string
  onChange?: (value: string) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn("flex flex-wrap items-end gap-3", className)}>
      {tabs.map((tab) => {
        const active = tab.value === value
        const tone = TONE[tab.tone ?? "primary"]
        const Icon = tab.icon
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              "flex items-center rounded-xl border transition-all duration-300 ease-out",
              active
                ? cn("gap-3 px-5 py-3.5", tone.card)
                : "gap-2 border-table-line bg-secondary/40 px-3.5 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {active ? (
              <>
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg duration-300 animate-in fade-in zoom-in-75",
                    tone.box,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-left duration-300 animate-in fade-in slide-in-from-left-2">
                  <span
                    className={cn("block font-mono text-2xl font-semibold leading-none", tone.value)}
                  >
                    {tab.count}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{tab.statLabel}</span>
                </span>
              </>
            ) : (
              <span className="flex items-center gap-2 duration-200 animate-in fade-in">
                {tab.label}
                <span className="font-mono text-xs opacity-70">{tab.count}</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
