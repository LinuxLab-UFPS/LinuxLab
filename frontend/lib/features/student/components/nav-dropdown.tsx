"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@shared/lib/utils"

/* Las tres pestanas van del mismo rojo, el de la marca: antes cada seccion
 * tenia el suyo (ambar en Actividades, esmeralda en Simuladores) y la barra
 * parecia de tres sitios distintos.
 *
 * El rojo no es `--primary` sino el extremo claro del degradado de la marca.
 * `--primary` (#C41E3A) esta pensado para fondos claros y sobre el negro de la
 * barra se apaga: la pestana activa apenas se despegaba del fondo. El gris
 * inactivo sube de /60 a /80 por lo mismo, que a /60 se leian apagadas.
 *
 * Los iconos no llevan color propio: van dentro del enlace y heredan estos
 * mismos, asi que icono y texto encienden juntos.
 *
 * Se exportan porque el enlace de Terminal no pasa por este componente —no
 * despliega ninguna lista— y tiene que verse igual que los otros dos. */
export const NAV_ACTIVE = "bg-primary/20 text-[#ff5470]"
export const NAV_IDLE = "text-white/80 hover:bg-primary/20 hover:text-[#ff5470]"
export const NAV_ITEM = "hover:bg-primary/20 hover:text-[#ff5470]"

export interface NavEntry {
  key: string
  title: string
  href: string
  /** Icono propio de la entrada. Sin él se usa el del menú. */
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * A nav item that is also a shortcut: the label goes to the section, and hovering
 * it drops a short list of what is inside. The list is capped — once it fills up
 * there is a "Ver más" instead, because the point is a shortcut, not a catalog.
 */
export function NavDropdown({
  href,
  label,
  icon: Icon,
  itemIcon: ItemIcon,
  entries,
  max = 4,
  pathname,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  itemIcon: React.ComponentType<{ className?: string }>
  entries: NavEntry[]
  max?: number
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const active = pathname === href || pathname.startsWith(href + "/")
  const shown = entries.slice(0, max)

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? NAV_ACTIVE : NAV_IDLE,
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </Link>

      {open && shown.length > 0 && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="w-64 animate-in fade-in-0 slide-in-from-top-1 rounded-xl border border-white/10 bg-[#0f0f11] p-1.5 shadow-2xl shadow-black/60 duration-150">
            {shown.map((entry) => {
              const Icon = entry.icon ?? ItemIcon
              return (
                <Link
                  key={entry.key}
                  href={entry.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors",
                    NAV_ITEM,
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{entry.title}</span>
                </Link>
              )
            })}
            {entries.length >= max && (
              <Link
                href={href}
                className="mt-1 flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
              >
                Ver más
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
