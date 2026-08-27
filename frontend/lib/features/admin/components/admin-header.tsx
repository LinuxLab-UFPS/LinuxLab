"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, ScrollText, TerminalSquare, Users } from "lucide-react"
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
import { RoleTag } from "@shared/components/role-tag"
import { useAuth, initialsOf } from "@/lib/features/auth/context"


const NAV = [
  {
    label: "Gestión de Docentes",
    href: "/admin/docentes",
    icon: Users,
    hover: "hover:bg-violet-500/15 hover:text-violet-400",
    active: "bg-violet-500/15 text-violet-400",
  },
  {
    label: "Entorno",
    href: "/admin/entorno",
    icon: TerminalSquare,
    hover: "hover:bg-emerald-500/15 hover:text-emerald-400",
    active: "bg-emerald-500/15 text-emerald-400",
  },
  {
    label: "Bitácora",
    href: "/admin/bitacora",
    icon: ScrollText,
    hover: "hover:bg-sky-500/15 hover:text-sky-400",
    active: "bg-sky-500/15 text-sky-400",
  },
]

/** Top header for the admin experience: same black bar as student/teacher, with
 *  an ADMIN tag next to the logo. */
export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  return (
    <header className="h-16 shrink-0 border-b border-white/10 bg-[#0a0a0a] text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo + role tag */}
        <Link href="/inicio" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-primary [text-shadow:0_0_18px_rgba(196,30,58,0.55)]">
              Linux
            </span>
            <span className="text-white">Lab</span>
          </span>
          <RoleTag variant="admin" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? item.active : cn("text-white/60", item.hover),
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />

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
      </div>
    </header>
  )
}
