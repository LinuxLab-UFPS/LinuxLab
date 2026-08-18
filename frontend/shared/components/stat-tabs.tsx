"use client"

import { cn } from "@shared/lib/utils"

export type StatTabTone = "primary" | "amber" | "violet" | "sky" | "emerald" | "neutral"

export interface StatTabItem {
  value: string
  /** Etiqueta corta cuando la pestaña está en reposo. */
  label: string
  /** Etiqueta larga que acompaña al número cuando está seleccionada. */
  statLabel?: string
  count?: number
  icon: React.ComponentType<{ className?: string }>
  tone?: StatTabTone
}

/** Relleno pleno para la pestaña activa compacta. */
const SOLID: Record<StatTabTone, string> = {
  primary: "bg-primary text-primary-foreground",
  amber: "bg-amber-500 text-amber-950",
  violet: "bg-violet-500 text-white",
  sky: "bg-sky-500 text-white",
  emerald: "bg-emerald-500 text-emerald-950",
  neutral: "bg-foreground/25 text-foreground",
}

/** Tarjeta grande, para vistas de una sola pestaña. */
const CARD: Record<StatTabTone, { card: string; box: string; value: string }> = {
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
  emerald: {
    card: "border-emerald-500/60 bg-emerald-500/10",
    box: "bg-emerald-500/20 text-emerald-400",
    value: "text-emerald-400",
  },
  neutral: {
    card: "border-table-line bg-card",
    box: "bg-foreground/10 text-foreground",
    value: "text-foreground",
  },
}

/**
 * Pestañas que además son la estadística de lo que muestran.
 *
 * Con varias pestañas van compactas y a la misma altura: la activa se rellena
 * con su color y muestra ícono, número y etiqueta; el resto queda en ficha
 * neutra. Con una sola pestaña no hay nada que alternar, así que se dibuja como
 * tarjeta grande (banco de actividades, gestión de docentes).
 */
export function StatTabs({
  tabs,
  value,
  onChange,
  variant,
  plain,
  className,
}: {
  tabs: StatTabItem[]
  value: string
  onChange?: (value: string) => void
  variant?: "compact" | "card"
  plain?: boolean
  className?: string
}) {
  const mode = variant ?? (tabs.length === 1 ? "card" : "compact")

  if (mode === "card") {
    return (
      <div role="tablist" className={cn("flex flex-wrap items-end gap-3", className)}>
        {tabs.map((tab) => {
          const active = tab.value === value
          const tone = CARD[tab.tone ?? "primary"]
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
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      tone.box,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
<span className="text-left">
                      {tab.count != null && (
                        <span
                          className={cn(
                            "block font-mono text-2xl font-semibold leading-none",
                            tone.value,
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                      {tab.statLabel && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {tab.statLabel}
                        </span>
                      )}
                    </span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.count != null && (
                    <span className="font-mono text-xs opacity-70">{tab.count}</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    // Un solo riel para todas: al cambiar de pestaña el bloque de color se
    // recoge de un lado y se abre del otro, asi que se lee como si se moviera.
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl bg-foreground/[0.08] p-1.5",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        const Icon = tab.icon
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              "flex h-10 items-center rounded-lg text-sm font-medium transition-all duration-300 ease-out",
              active
                ? cn("pl-2 pr-3.5", SOLID[tab.tone ?? "primary"])
                : "px-3 text-muted-foreground hover:text-foreground",
            )}
          >
            {/* Los tres bloques viven siempre montados y se abren o se recogen a
                lo ancho con `0fr` / `1fr`, que es lo unico que anima de verdad
                el ancho del boton sin medirlo en JS. */}
            <span
              className={cn(
                "grid shrink-0 transition-all duration-300 ease-out",
                active ? "mr-2 grid-cols-[1fr] opacity-100" : "mr-0 grid-cols-[0fr] opacity-0",
              )}
            >
              <span className="overflow-hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black/20">
                  <Icon className="h-4 w-4" />
                </span>
              </span>
            </span>

            <span
              className={cn(
                "grid transition-all duration-300 ease-out",
                active && !plain ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
              )}
            >
              <span className="overflow-hidden">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  {!plain && tab.count != null && (
                    <span className="font-mono text-base font-semibold">{tab.count}</span>
                  )}
                  {!plain && <span>{tab.statLabel}</span>}
                </span>
              </span>
            </span>

            <span
              className={cn(
                "grid transition-all duration-300 ease-out",
                plain
                  ? "grid-cols-[1fr] opacity-100"
                  : active
                    ? "grid-cols-[0fr] opacity-0"
                    : "grid-cols-[1fr] opacity-100",
              )}
            >
              <span className="overflow-hidden">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span>{tab.label}</span>
                  {!plain && tab.count != null && (
                    <span className="font-mono text-xs opacity-70">{tab.count}</span>
                  )}
                </span>
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
