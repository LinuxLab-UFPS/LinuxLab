"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch: render a placeholder until mounted.
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      // The label depends on the resolved theme, which only exists on the client:
      // it has to wait for `mounted` just like the icon does, or the server and
      // client render different labels and React reports a hydration mismatch.
      aria-label={
        mounted ? (isDark ? "Activar modo claro" : "Activar modo oscuro") : "Cambiar tema"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      {mounted ? (
        isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5 opacity-0" />
      )}
    </Button>
  )
}
