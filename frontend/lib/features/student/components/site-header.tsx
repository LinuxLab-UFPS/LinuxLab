"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  SquareTerminal,
  Target,
  MonitorPlay,
  Search,
  LogOut,
  FolderTree,
  SquarePen,
  Stamp,
  FileArchive,
  Users,
} from "lucide-react"
import { cn } from "@shared/lib/utils"
import { notify } from "@shared/lib/toast"
import { Avatar, AvatarFallback } from "@shared/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import { ThemeToggle } from "@shared/components/theme-toggle"
import { useAuth, initialsOf } from "@/lib/features/auth/context"

import { SearchDialog } from "@/lib/features/student/components/search-dialog"
import {
  NavDropdown,
  NAV_ACTIVE,
  NAV_IDLE,
} from "@/lib/features/student/components/nav-dropdown"
import type { SearchItem } from "@shared/lib/content/lessons"
import type { Simulator } from "@shared/lib/content/simulators"
import { getActivities } from "@shared/lib/content/activities"

/** Icono propio de cada simulador en el menú; sin entrada, cae al del grupo. */
const SIMULATOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "travesia-del-arbol": FolderTree,
  "retos-de-vi": SquarePen,
  "filtro-de-permisos": Stamp,
  "escritorio-comprimido": FileArchive,
}

/** The black top bar: logo, nav, search, theme toggle and profile. */
/** The black top bar: logo, nav, search, theme toggle and profile. */
export function SiteHeader({
  simulators,
  searchItems,
}: {
  simulators: Simulator[]
  searchItems: SearchItem[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="h-16 shrink-0 border-b border-white/10 bg-[#0a0a0a] text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/inicio" className="shrink-0 text-xl font-extrabold tracking-tight">
          <span className="text-primary [text-shadow:0_0_18px_rgba(196,30,58,0.55)]">Linux</span>
          <span className="text-white">Lab</span>
        </Link>

        {/* Primary nav, with the AlgoMaster-style rounded hover pill */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/terminal"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/terminal" ? NAV_ACTIVE : NAV_IDLE,
            )}
          >
            <SquareTerminal className="h-4 w-4" />
            Terminal
          </Link>

          <NavDropdown
            href="/actividades"
            label="Actividades"
            icon={Target}
            itemIcon={Target}
            entries={getActivities().map((a) => ({
              key: a.slug,
              title: a.title,
              href: a.href,
            }))}
            pathname={pathname}
          />

          <NavDropdown
            href="/simuladores"
            label="Simuladores"
            icon={MonitorPlay}
            itemIcon={FolderTree}
            entries={simulators.map((s) => ({
              key: s.id,
              title: s.title,
              href: s.href,
              icon: SIMULATOR_ICONS[s.id],
            }))}
            pathname={pathname}
          />

          <Link
            href="/estudiante/grupo"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/estudiante/grupo")
                ? NAV_ACTIVE
                : NAV_IDLE,
            )}
          >
            <Users className="h-4 w-4" />
            Mi Grupo
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Search opens the modal palette. */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="hidden h-9 w-48 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/40 outline-none transition hover:bg-white/[0.07] hover:text-white/70 sm:flex lg:w-60"
          >
            <Search className="h-4 w-4" />
            Buscar...
          </button>

          <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-white/10">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                  {initialsOf(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[10rem] truncate text-sm text-white/80 sm:block">
                {user?.name ?? "Invitado"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {user?.name ?? "Invitado"}
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {user?.email ?? "Sin sesión activa"}
                </span>
                {/* El codigo, a la vista: es lo que el estudiante da al
                    inscribirse y lo que aparece en las notas del docente. */}
                {user?.code && (
                  <span className="block truncate font-mono text-xs font-normal text-muted-foreground">
                    {user.code}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut()
                  notify.info("Sesión cerrada")
                  // Carga completa y no `router.push`: la barra superior la
                  // elige el layout de servidor segun el rol, y una navegacion
                  // de cliente reutiliza el layout ya renderizado. Quien entrara
                  // despues con otro rol se encontraba con la barra del
                  // anterior hasta recargar a mano.
                  window.location.href = "/"
                }}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SearchDialog
          items={searchItems}
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
      </div>
    </header>
  )
}

