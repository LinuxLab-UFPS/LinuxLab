"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SquareTerminal,
  Target,
  MonitorPlay,
  Search,
  LogOut,
  ChevronDown,
  FolderTree,
} from "lucide-react"
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
import { useAuth, initialsOf } from "@/lib/features/auth/context"
import { DevRoleSwitcher } from "@/components/dev/role-switcher"
import { SearchDialog } from "@/components/student/search-dialog"
import type { SearchItem } from "@/lib/features/shared/lessons"
import type { Simulator } from "@/lib/features/shared/simulators"

/** Top-level nav for the student experience. These three still get their real
 *  pages later; for now Terminal is live and the other two are placeholders. */
const NAV = [
  {
    label: "Terminal",
    href: "/terminal",
    icon: SquareTerminal,
    hover: "hover:bg-primary/15 hover:text-primary",
    active: "bg-primary/15 text-primary",
  },
  {
    label: "Actividades",
    href: "/activities",
    icon: Target,
    hover: "hover:bg-amber-500/15 hover:text-amber-400",
    active: "bg-amber-500/15 text-amber-400",
  },
]

/** The black top bar: logo, nav, search, theme toggle and profile. */
export function SiteHeader({
  simulators,
  searchItems,
}: {
  simulators: Simulator[]
  searchItems: SearchItem[]
}) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="h-16 shrink-0 border-b border-white/10 bg-[#0a0a0a] text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/home" className="shrink-0 text-xl font-extrabold tracking-tight">
          <span className="text-primary [text-shadow:0_0_18px_rgba(196,30,58,0.55)]">Linux</span>
          <span className="text-white">Lab</span>
        </Link>

        {/* Primary nav, with the AlgoMaster-style rounded hover pill */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/")
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
          <SimuladoresNav simulators={simulators} pathname={pathname} />
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

        <SearchDialog
          items={searchItems}
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
      </div>
    </header>
  )
}

/**
 * Simuladores nav item: a link that also opens a hover dropdown listing the
 * simulators (green hover to match their tag color). Shows up to 5, plus a
 * "Ver más" link when there are more.
 */
function SimuladoresNav({
  simulators,
  pathname,
}: {
  simulators: Simulator[]
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const active = pathname === "/simulators" || pathname.startsWith("/simulators/")

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/simulators"
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-emerald-500/15 text-emerald-400"
            : "text-white/60 hover:bg-emerald-500/15 hover:text-emerald-400",
        )}
      >
        <MonitorPlay className="h-4 w-4" />
        Simuladores
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </Link>

      {open && simulators.length > 0 && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="w-64 animate-in fade-in-0 slide-in-from-top-1 rounded-xl border border-white/10 bg-[#0f0f11] p-1.5 shadow-2xl shadow-black/60 duration-150">
            {simulators.slice(0, 5).map((sim) => (
              <Link
                key={`${sim.topicSlug}/${sim.id}`}
                href={sim.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors hover:bg-emerald-500/15 hover:text-emerald-400"
              >
                <FolderTree className="h-4 w-4 shrink-0" />
                <span className="truncate">{sim.title}</span>
              </Link>
            ))}
            {simulators.length > 5 && (
              <Link
                href="/simulators"
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
