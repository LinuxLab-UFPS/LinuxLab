"use client"

import Link from "next/link"
import { Terminal, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { useAuth, initialsOf } from "@/lib/features/auth/context"

export function Navbar() {
  const { user } = useAuth()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary/20 flex items-center justify-center neon-glow">
          <Terminal className="w-5 h-5 text-primary" />
        </div>
        <span className="font-semibold text-lg tracking-tight">
          <span className="text-primary neon-text">Linux</span>
          <span className="text-foreground">Lab</span>
        </span>
      </Link>

      {/* User Section */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Terminal className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{user?.name ?? "Invitado"}</span>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              {user ? initialsOf(user.name) : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
