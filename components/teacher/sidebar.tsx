"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Database, PlusCircle, Terminal, ScrollText, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { useAuth, initialsOf } from "@/lib/features/auth/context"
import { DevRoleSwitcher } from "@/components/dev/role-switcher"

const navItems = [
  {
    label: "Mis Grupos",
    href: "/home",
    icon: BookOpen,
  },
  {
    label: "Actividad Bank",
    href: "/bank",
    icon: Database,
  },
  {
    label: "Crear Grupo",
    href: "/create-group",
    icon: PlusCircle,
  },
  {
    label: "Audit Log",
    href: "/audit-log",
    icon: ScrollText,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const roleLabel =
    user?.role === "admin"
      ? "Administrador"
      : user?.role === "student"
        ? "Estudiante"
        : "Docente"

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:neon-glow transition-shadow">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground group-hover:neon-text transition-all">
            LinuxLab
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary neon-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Teacher Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarFallback className="bg-secondary text-foreground">
              {initialsOf(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name ?? "Invitado"}
            </p>
            <span className="text-xs text-muted-foreground">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-2">
        <button
          onClick={async () => {
            await signOut()
            window.location.href = "/"
          }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">LinuxLab UFPS v1.0</p>
        <ThemeToggle className="h-7 w-7" />
      </div>

      <DevRoleSwitcher />
    </aside>
  )
}
