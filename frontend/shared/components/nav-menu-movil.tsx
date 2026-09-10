"use client"

import Link from "next/link"
import { Menu, type LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import { cn } from "@shared/lib/utils"

/**
 * El menu de la cabecera cuando no cabe en linea.
 *
 * Las tres cabeceras (estudiante, docente y administrador) escondian su nav con
 * `hidden md:flex` y no ponian nada en su lugar: por debajo de 768 el estudiante
 * se quedaba con el logo y el avatar, sin forma de llegar a la terminal ni a las
 * actividades salvo escribiendo la URL.
 *
 * Es el mismo patron que ya usa la portada (`landing-header.tsx`), extraido para
 * no tenerlo copiado tres veces.
 */
export interface EnlaceNav {
  href: string
  label: string
  icon: LucideIcon
  /** Marca el enlace como el sitio donde uno esta. */
  activo?: boolean
}

export function NavMenuMovil({
  enlaces,
  className,
}: {
  enlaces: EnlaceNav[]
  /** El umbral desde el que deja de hacer falta, en clase de Tailwind. */
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Abrir el menú"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40",
          className ?? "xl:hidden",
        )}
      >
        <Menu className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {enlaces.map((enlace) => {
          const Icono = enlace.icon
          return (
            <DropdownMenuItem key={enlace.href} asChild>
              <Link
                href={enlace.href}
                className={cn("flex items-center gap-2.5", enlace.activo && "text-primary")}
              >
                <Icono className="h-4 w-4 shrink-0" />
                {enlace.label}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
