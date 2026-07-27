"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Database, ScrollText, Search, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { RoleTag } from "@/components/shared/role-tag"
import { useAuth, initialsOf } from "@/lib/features/auth/context"
import { DevRoleSwitcher } from "@/components/dev/role-switcher"

const NAV = [
  {
    label: "Cursos",
    href: "/home",
    icon: BookOpen,
    hover: "hover:bg-sky-500/15 hover:text-sky-400",
    active: "bg-sky-500/15 text-sky-400",
  },
  {
    label: "Banco de Actividades",
    href: "/bank",
    icon: Database,
    hover: "hover:bg-amber-500/15 hover:text-amber-400",
    active: "bg-amber-500/15 text-amber-400",
  },
  {
    label: "Bitácora",
    href: "/audit-log",
    icon: ScrollText,
    hover: "hover:bg-violet-500/15 hover:text-violet-400",
    active: "bg-violet-500/15 text-violet-400",
  },
]

/** Top header for the teacher experience: same black bar as the student one,
 *  with a DOCENTE tag next to the logo and the teacher's own nav. */
export function TeacherHeader() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <header className="h-16 shrink-0 border-b border-white/10 bg-[#0a0a0a] text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo + role tag */}
        <Link href="/home" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-primary [text-shadow:0_0_18px_rgba(196,30,58,0.55)]">
              Linux
            </span>
            <span className="text-white">Lab</span>
          </span>
          <RoleTag variant="docente" />
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
          {/* Search: visual only for now, wired to real search later. */}
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar..."
              aria-label="Buscar"
              className="h-9 w-48 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-primary/60 focus:bg-white/[0.07] lg:w-60"
            />
          </div>

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
                  window.location.href = "/"
                }}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
              <div className="px-1 pt-1">
                <DevRoleSwitcher />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
